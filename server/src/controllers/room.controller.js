import { v4 as uuidv4 } from 'uuid';
import Room from '../models/room.model.js';
import Message from '../models/message.model.js';
import VisitHistory from '../models/visitHistory.model.js';
import { deleteFromImageKit } from '../utils/imageKit.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from '../utils/apiError.js';
import { io } from '../socket/socket.js';

const ALLOWED_DURATIONS_MS = {
    5: 5 * 60 * 1000,
    10: 10 * 60 * 1000,
    15: 15 * 60 * 1000,
    20: 20 * 60 * 1000,
    30: 30 * 60 * 1000
};

// ─────────────────────────────────────────────────────────────────────────────
// GIRL: CREATE ROOM
// POST /api/rooms/create
// Body: { roomType: 'message' | 'voice' | 'video' }
// ─────────────────────────────────────────────────────────────────────────────
const createRoom = asyncHandler(async (req, res) => {

    const girlId = req.girl._id;
    const { roomType } = req.body;

    if (!roomType || !['message', 'voice', 'video'].includes(roomType)) {
        throw new ApiError(400, 'Invalid or missing roomType. Must be one of: message, voice, video');
    }

    // Girl can only have one active room at a time
    const existing = await Room.findOne({
        createdBy: girlId,
        status: { $in: ['open', 'occupied'] }
    });
    if (existing) {
        throw new ApiError(400, 'You already have an active room. Please destroy it before creating a new one.');
    }

    const roomId = `room_${uuidv4()}`;

    const room = await Room.create({
        roomId,
        createdBy: girlId,
        roomType,
        status: 'open'
    });

    return res.status(201).json(
        new ApiResponse(201, {
            roomId: room.roomId,
            roomType: room.roomType,
            status: room.status,
            createdAt: room.createdAt
        }, 'Room created successfully')
    );

});

// ─────────────────────────────────────────────────────────────────────────────
// GIRL: DESTROY ROOM
// DELETE /api/rooms/:roomId
// ─────────────────────────────────────────────────────────────────────────────
const destroyRoom = asyncHandler(async (req, res) => {

    const girlId = req.girl._id;
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });
    if (!room) {
        throw new ApiError(404, 'Room not found');
    }
    if (room.createdBy.toString() !== girlId.toString()) {
        throw new ApiError(403, 'You do not own this room');
    }
    if (room.status === 'destroyed') {
        throw new ApiError(400, 'Room is already destroyed');
    }

    // Delete all media messages (images + audio) from ImageKit
    const mediaMessages = await Message.find({
        roomId,
        messageType: { $in: ['image', 'audio'] },
        fileId: { $ne: null }
    });

    for (const msg of mediaMessages) {
        try {
            await deleteFromImageKit(msg.fileId);
        } catch (e) {
            console.error(`ImageKit delete failed for fileId=${msg.fileId}:`, e.message);
        }
    }

    // Mark room destroyed
    room.status = 'destroyed';
    await room.save();

    // Socket layer handles kicking the current boy and emitting room_destroyed
    // We export the io instance and call it from here via the socket utility

    // If a boy is currently inside, close his session via socket
    if (room.currentBoy) {
        io.to(`user:${room.currentBoy.toString()}`).emit('room_destroyed', {
            roomId,
            message: 'The room has been destroyed by the host'
        });
    }

    // Notify everyone watching the room list
    io.emit('room_closed', { roomId });

    return res.status(200).json(
        new ApiResponse(200, null, 'Room destroyed successfully')
    );

});

// ─────────────────────────────────────────────────────────────────────────────
// BOY: JOIN ROOM
// POST /api/rooms/:roomId/join
// ─────────────────────────────────────────────────────────────────────────────
const joinRoom = asyncHandler(async (req, res) => {

    const boyId = req.user._id;
    const { roomId } = req.params;
    const { durationMinutes = 5 } = req.body;

    const parsedDuration = Number(durationMinutes);
    if (!ALLOWED_DURATIONS_MS[parsedDuration]) {
        throw new ApiError(400, `durationMinutes must be one of: ${Object.keys(ALLOWED_DURATIONS_MS).join(', ')}`);
    }

    const room = await Room.findOne({ roomId });
    if (!room) {
        throw new ApiError(404, 'Room not found');
    }
    if (room.status === 'destroyed') {
        throw new ApiError(400, 'This room no longer exists');
    }
    if (room.status === 'occupied') {
        throw new ApiError(409, 'Room is currently occupied. Try again shortly.');
    }

    const sessionDurationMs = ALLOWED_DURATIONS_MS[parsedDuration];

    // Lock the room — also store the chosen duration so the socket timer can read it
    room.status = 'occupied';
    room.currentBoy = boyId;
    room.currentBoyJoinedAt = new Date();
    room.currentSessionDurationMs = sessionDurationMs;
    await room.save();

    return res.status(200).json(
        new ApiResponse(200, {
            roomId: room.roomId,
            roomType: room.roomType,
            sessionDurationMs,
            joinedAt: room.currentBoyJoinedAt
        }, 'Joined room successfully')
    );


});

// ─────────────────────────────────────────────────────────────────────────────
// BOY: LEAVE ROOM
// POST /api/rooms/:roomId/leave
// ─────────────────────────────────────────────────────────────────────────────
const leaveRoom = asyncHandler(async (req, res) => {

    const boyId = req.user._id;
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });
    if (!room) {
        throw new ApiError(404, 'Room not found');
    }
    if (!room.currentBoy || room.currentBoy.toString() !== boyId.toString()) {
        throw new ApiError(403, 'You are not in this room');
    }

    const leftAt = new Date();
    const durationSeconds = Math.round((leftAt - room.currentBoyJoinedAt) / 1000);

    // Save visit history
    await VisitHistory.create({
        roomId,
        girl: room.createdBy,
        boy: boyId,
        roomType: room.roomType,
        joinedAt: room.currentBoyJoinedAt,
        leftAt,
        durationSeconds,
        exitReason: 'boy_left'
    });

    // Free the room
    room.status = 'open';
    room.currentBoy = null;
    room.currentBoyJoinedAt = null;
    await room.save();

    return res.status(200).json(
        new ApiResponse(200, null, 'Left room successfully')
    );

});

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL OPEN ROOMS (boy browses available rooms)
// GET /api/rooms
// ─────────────────────────────────────────────────────────────────────────────
const getOpenRooms = asyncHandler(async (req, res) => {

    const { type } = req.query; // optional filter: ?type=voice

    const query = { status: { $in: ['open', 'occupied'] } };
    if (type && ['message', 'voice', 'video'].includes(type)) {
        query.roomType = type;
    }

    const rooms = await Room.find(query)
        .populate('createdBy', 'fullName imageUrl age')
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, rooms, 'Open rooms retrieved successfully')
    );

});

// ─────────────────────────────────────────────────────────────────────────────
// GET ROOM MESSAGES
// GET /api/rooms/:roomId/messages
// ─────────────────────────────────────────────────────────────────────────────
const getRoomMessages = asyncHandler(async (req, res) => {

    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });
    if (!room) {
        throw new ApiError(404, 'Room not found');
    }

    const messages = await Message.find({ roomId })
        .populate('sender', 'fullName imageUrl')
        .sort({ createdAt: 1 });

    return res.status(200).json(
        new ApiResponse(200, { messages }, 'Room messages retrieved successfully')
    );

});

// ─────────────────────────────────────────────────────────────────────────────
// GIRL: GET HER VISIT HISTORY (who visited her rooms)
// GET /api/rooms/history/girl
// ─────────────────────────────────────────────────────────────────────────────
const getGirlHistory = asyncHandler(async (req, res) => {
    const girlId = req.girl._id;

    const history = await VisitHistory.find({ girl: girlId })
        .populate('boy', 'fullName imageUrl')
        .sort({ createdAt: -1 })
        .limit(50);

    return res.status(200).json(
        new ApiResponse(200, { history }, 'Girl visit history retrieved successfully')
    );

});

// ─────────────────────────────────────────────────────────────────────────────
// BOY: GET HIS VISIT HISTORY (rooms he joined)
// GET /api/rooms/history/boy
// ─────────────────────────────────────────────────────────────────────────────
const getBoyHistory = asyncHandler(async (req, res) => {
    const boyId = req.user._id;

    const history = await VisitHistory.find({ boy: boyId })
        .populate('girl', 'fullName imageUrl')
        .sort({ createdAt: -1 })
        .limit(50);

    return res.status(200).json(
        new ApiResponse(200, { history }, 'Boy visit history retrieved successfully')
    );

});

export {
    createRoom,
    destroyRoom,
    joinRoom,
    leaveRoom,
    getOpenRooms,
    getRoomMessages,
    getGirlHistory,
    getBoyHistory
}