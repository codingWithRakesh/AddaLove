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

const ALLOWED_LANGUAGES = ['Bengali', 'Hindi', 'Gujarati', 'English', 'Kannada', 'Marathi', 'Tamil', 'Telugu', 'Urdu', 'Punjabi'];

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
    io.emit('room_available', { roomId });

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

    if (req.userType !== 'girl') {
        throw new ApiError(403, 'Only girls can create rooms');
    }

    const girlId = req.user._id;
    const { roomType, languages } = req.body;

    if (!roomType || !['message', 'voice', 'video'].includes(roomType)) {
        throw new ApiError(400, 'Invalid or missing roomType. Must be one of: message, voice, video');
    }

    if (!Array.isArray(languages) || languages.length !== 2) {
        throw new ApiError(400, 'Please select exactly 2 languages');
    }

    const selectedLanguages = [...new Set(languages.map((language) => String(language).trim()))];
    if (selectedLanguages.length !== 2 || selectedLanguages.some((language) => !ALLOWED_LANGUAGES.includes(language))) {
        throw new ApiError(400, `Invalid languages. Select exactly 2 from: ${ALLOWED_LANGUAGES.join(', ')}`);
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
        language: selectedLanguages,
        status: 'open'
    });

    io.emit('room_opened', { roomId: room.roomId });

    return res.status(201).json(
        new ApiResponse(201, {
            roomId: room.roomId,
            roomType: room.roomType,
            languages: room.language,
            status: room.status,
            createdAt: room.createdAt
        }, 'Room created successfully')
    );

});


const destroyRoom = asyncHandler(async (req, res) => {

    if (req.userType !== 'girl') {
        throw new ApiError(403, 'Only the girl who created a room can destroy it');
    }

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
        io.to(room.currentBoy.toString()).emit('room_destroyed', {
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

    if (req.userType !== 'boy') {
        throw new ApiError(403, 'Only boys can join rooms');
    }

    const boyId = req.user._id;
    const { roomId } = req.params;

    const existingBoyRoom = await Room.findOne({
        currentBoy: boyId,
        status: 'occupied'
    });
    if (existingBoyRoom) {
        throw new ApiError(409, 'You are already inside another room');
    }

    const sessionDurationMs = ACTIVE_SESSION_DURATION_SECONDS * 1000;
    const joinedAt = new Date();
    const room = await Room.findOneAndUpdate(
        { roomId, status: 'open', currentBoy: null },
        {
            $set: {
                status: 'occupied',
                currentBoy: boyId,
                currentBoyJoinedAt: joinedAt,
                currentSessionDurationMs: sessionDurationMs
            }
        },
        { new: true }
    );
    if (!room) {
        const roomExists = await Room.exists({ roomId });
        if (!roomExists) throw new ApiError(404, 'Room not found');
        throw new ApiError(409, 'Room is currently occupied. Try again shortly.');
    }

    io.to(roomId).emit('boy_joined', {
        roomId,
        boyId,
        sessionDurationMs
    });
    io.emit('room_occupied', { roomId });

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

    if (req.userType !== 'boy') {
        throw new ApiError(403, 'Girls must destroy their room; they cannot leave it');
    }

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
        .populate('createdBy', 'fullName imageUrl age')
        .populate('currentBoy', 'fullName imageUrl walletBlance');

    if (!room) {
        throw new ApiError(404, 'Room not found');
    }

    const roomData = room[0];

    const requesterId = req.user._id.toString();
    const isOwner = room.createdBy?._id?.toString() === requesterId;
    const isCurrentBoy = room.currentBoy?._id?.toString() === requesterId;
    if (!isOwner && !isCurrentBoy) {
        throw new ApiError(403, 'You are not a participant in this room');
    }

    return res.status(200).json(
        new ApiResponse(200, { room }, 'Room details retrieved successfully')
    );

});



//Try to calculte the the followers with user data 
// const getRoomDetails = asyncHandler(async (req, res) => {
//     const { roomId } = req.params;

//     const room = await Room.aggregate([
//         {
//             $match: { roomId: roomId }
//         },

//         // Created By
//         {
//             $lookup: {
//                 from: "girls",
//                 localField: "createdBy",
//                 foreignField: "_id",
//                 as: "createdBy"
//             }
//         },
//         {
//             $unwind: "$createdBy"
//         },

//         // Current Boy
//         {
//             $lookup: {
//                 from: "boys",
//                 localField: "currentBoy",
//                 foreignField: "_id",
//                 as: "currentBoy"
//             }
//         },
//         {
//             $unwind: {
//                 path: "$currentBoy",
//                 preserveNullAndEmptyArrays: true
//             }
//         },

//         // CreatedBy Followers Count
//         {
//             $lookup: {
//                 from: "followers",
//                 localField: "createdBy._id",
//                 foreignField: "following",
//                 as: "createdByFollowers"
//             }
//         },

//         // CurrentBoy Followers Count
//         {
//             $lookup: {
//                 from: "followers",
//                 localField: "currentBoy._id",
//                 foreignField: "following",
//                 as: "currentBoyFollowers"
//             }
//         },

//         {
//             $addFields: {
//                 "createdBy.totalFollowers": {
//                     $size: "$createdByFollowers"
//                 },
//                 "currentBoy.totalFollowers": {
//                     $size: "$currentBoyFollowers"
//                 }
//             }
//         },

//         {
//             $project: {
//                 roomId: 1,
//                 roomType: 1,
//                 status: 1,
//                 language: 1,
//                 createdAt: 1,
//                 updatedAt: 1,
//                 currentSessionDurationMs: 1,
//                 currentBoyJoinedAt: 1,

//                 "createdBy._id": 1,
//                 "createdBy.fullName": 1,
//                 "createdBy.imageUrl": 1,
//                 "createdBy.age": 1,
//                 "createdBy.totalFollowers": 1,

//                 "currentBoy._id": 1,
//                 "currentBoy.fullName": 1,
//                 "currentBoy.imageUrl": 1,
//                 "currentBoy.walletBlance": 1,
//                 "currentBoy.totalFollowers": 1
//             }
//         }
//     ]);

//     if (!room.length) {
//         throw new ApiError(404, "Room not found");
//     }

//     const roomData = room[0];

//     const requesterId = req.user._id.toString();

//     const isOwner =
//         roomData.createdBy?._id?.toString() === requesterId;

//     const isCurrentBoy =
//         roomData.currentBoy?._id?.toString() === requesterId;

//     if (!isOwner && !isCurrentBoy) {
//         throw new ApiError(403, "You are not a participant in this room");
//     }

//     return res.status(200).json(
//         new ApiResponse(200, { room: roomData }, "Room details retrieved successfully")
//     );
//     return res.status(200).json(
//         new ApiResponse(200, { room }, 'Room details retrieved successfully')
//     );

// });




// ─────────────────────────────────────────────────────────────────────────────
// GET ALL OPEN ROOMS (boy browses available rooms)
// GET /api/rooms
// ─────────────────────────────────────────────────────────────────────────────
const getOpenRooms = asyncHandler(async (req, res) => {

    const { type } = req.query; // optional filter: ?type=voice

    const query = { status: 'open' };
    if (type && ['message', 'voice', 'video'].includes(type)) {
        query.roomType = type;
    }

    const rooms = await Room.aggregate([
        { $match: query },
        {
            $lookup: {
                from: 'girls',
                localField: 'createdBy',
                foreignField: '_id',
                as: 'createdBy'
            }
        },
        {
            $unwind: {
                path: '$createdBy',
            }
        },
        {
            $lookup: {
                from: "followers",
                let: { girlId: "$createdBy._id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ["$following", "$$girlId"]
                            }
                        }
                    },
                    {
                        $count: "totalFollowers"
                    }
                ],
                as: "followersData"
            }
        },
        {
            $addFields: {
                totalFollowers: {
                    $ifNull: [
                        { $arrayElemAt: ["$followersData.totalFollowers", 0] },
                        0
                    ]
                }
            }
        },
        {
            $project: {
                roomId: 1,
                roomType: 1,
                status: 1,
                currentBoy: 1,
                currentBoyJoinedAt: 1,
                currentSessionDurationMs: 1,
                language: 1,
                createdAt: 1,
                updatedAt: 1,
                totalFollowers: 1,
                createdBy: {
                    _id: '$createdBy._id',
                    fullName: '$createdBy.fullName',
                    imageUrl: '$createdBy.imageUrl',
                    age: '$createdBy.age'
                }
            }
        },
        { $sort: { createdAt: -1 } }
    ]);

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
