import { v4 as uuidv4 } from 'uuid';
import Room from '../models/room.model.js';
import Message from '../models/message.model.js';
import VisitHistory from '../models/visitHistory.model.js';
import { deleteFromImageKit } from '../utils/imageKit.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from '../utils/apiError.js';
import { io } from '../socket/socket.js';

const SESSION_DURATIONS_SECONDS = {
    '20_sec': 20,
    '30_sec': 30,
    '1_min': 60,
    '2_min': 2 * 60,
    '5_min': 5 * 60,
    '10_min': 10 * 60
};

// Change only this key when you want a different hardcoded session time.
const ACTIVE_SESSION_DURATION_KEY = '2_min';
const ACTIVE_SESSION_DURATION_SECONDS = SESSION_DURATIONS_SECONDS[ACTIVE_SESSION_DURATION_KEY];
const activeRoomTimers = new Map();

const clearRoomTimer = (roomId) => {
    const timer = activeRoomTimers.get(roomId);
    if (timer) {
        clearTimeout(timer);
        activeRoomTimers.delete(roomId);
    }
};

const createVisitHistory = async (room, boyId, exitReason) => {
    const leftAt = new Date();
    const durationSeconds = room.currentBoyJoinedAt
        ? Math.max(0, Math.round((leftAt - room.currentBoyJoinedAt) / 1000))
        : 0;

    await VisitHistory.create({
        roomId: room.roomId,
        girl: room.createdBy,
        boy: boyId,
        roomType: room.roomType,
        joinedAt: room.currentBoyJoinedAt || leftAt,
        leftAt,
        durationSeconds,
        exitReason
    });

    return { durationSeconds };
};

const completeBoySession = async (room, boyId, exitReason) => {
    const roomId = room.roomId;
    const { durationSeconds } = await createVisitHistory(room, boyId, exitReason);

    clearRoomTimer(roomId);

    room.status = 'open';
    room.currentBoy = null;
    room.currentBoyJoinedAt = null;
    room.currentSessionDurationMs = null;
    await room.save();

    await Message.deleteMany({ roomId });

    io.to(roomId).emit('boy_left', {
        roomId,
        boyId,
        durationSeconds,
        exitReason
    });

    return { durationSeconds };
};

const scheduleBoyAutoLeave = (roomId, boyId, durationMs) => {
    clearRoomTimer(roomId);

    const timer = setTimeout(async () => {
        try {
            const room = await Room.findOne({ roomId });
            if (!room || room.currentBoy?.toString() !== boyId.toString()) {
                return;
            }

            await completeBoySession(room, boyId, 'time_limit');
        } catch (error) {
            console.error(`Auto leave failed for roomId=${roomId}:`, error.message);
        }
    }, durationMs);

    activeRoomTimers.set(roomId, timer);
};

const createRoom = asyncHandler(async (req, res) => {

    const girlId = req.user._id;
    const { roomType } = req.body;

    if (!roomType || !['message', 'voice', 'video'].includes(roomType)) {
        throw new ApiError(400, 'Invalid or missing roomType. Must be one of: message, voice, video');
    }

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


const destroyRoom = asyncHandler(async (req, res) => {

    const girlId = req.user._id;
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

    if (room.currentBoy) {
        await createVisitHistory(room, room.currentBoy, 'room_destroyed');
        io.to(room.currentBoy).emit('room_destroyed', {
            roomId,
            message: 'The room has been destroyed by the host'
        });
    }

    await Message.deleteMany({ roomId });
    await Room.deleteOne({ roomId });
    clearRoomTimer(roomId);

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

    const sessionDurationMs = ACTIVE_SESSION_DURATION_SECONDS * 1000;

    room.status = 'occupied';
    room.currentBoy = boyId;
    room.currentBoyJoinedAt = new Date();
    room.currentSessionDurationMs = sessionDurationMs;
    await room.save();

    io.to(roomId).emit('boy_joined', {
        roomId,
        boyId,
        sessionDurationMs
    });

    scheduleBoyAutoLeave(roomId, boyId, sessionDurationMs);

    return res.status(200).json(
        new ApiResponse(200, {
            roomId: room.roomId,
            roomType: room.roomType,
            sessionDurationMs,
            sessionDurationSeconds: ACTIVE_SESSION_DURATION_SECONDS,
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

    await completeBoySession(room, boyId, 'boy_left');

    return res.status(200).json(
        new ApiResponse(200, null, 'Left room successfully')
    );

});

// ─────────────────────────────────────────────────────────────────────────────
// GET ROOM DETAILS (used by client when entering a room via roomId in URL)
// GET /api/rooms/:roomId/details
// ─────────────────────────────────────────────────────────────────────────────
const getRoomDetails = asyncHandler(async (req, res) => {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId })
        .populate('createdBy', 'fullName imageUrl age');

    if (!room) {
        throw new ApiError(404, 'Room not found');
    }

    return res.status(200).json(
        new ApiResponse(200, { room }, 'Room details retrieved successfully')
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

    const visibleRooms = rooms.filter((room) => room.status !== 'destroyed');

    return res.status(200).json(
        new ApiResponse(200, visibleRooms, 'Open rooms retrieved successfully')
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
    const girlId = req.user._id;

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
    getRoomDetails,
    getOpenRooms,
    getRoomMessages,
    getGirlHistory,
    getBoyHistory
}
