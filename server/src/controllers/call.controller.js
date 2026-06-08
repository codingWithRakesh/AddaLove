import { v4 as uuidv4 } from 'uuid';
import CallRoom from '../models/callRoom.model.js';
import CallHistory from '../models/callHistory.model.js';
import User from '../models/user.model.js';
import Girls from '../models/girls.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

// Allowed durations in milliseconds
const ALLOWED_DURATIONS = {
    5: 5 * 60 * 1000,
    10: 10 * 60 * 1000,
    15: 15 * 60 * 1000,
    20: 20 * 60 * 1000,
    30: 30 * 60 * 1000
};

/**
 * POST /api/calls/create
 * Boy creates a room by selecting a girl + duration.
 *
 * NOTE: Online / busy checks happen on the SOCKET layer (notify_incoming_call),
 * not here, because online presence is tracked in memory on the socket server.
 * This endpoint only validates DB-level conditions.
 *
 * Body: { girlId, durationMinutes }
 */
const createRoom = asyncHandler(async (req, res) => {
    const boyId = req.user._id;
    const { girlId, durationMinutes, callType = 'audio' } = req.body;

    if (!girlId) {
        throw new ApiError(400, 'girlId is required');
    }

    const parsedDuration = Number(durationMinutes);
    if (!parsedDuration || !ALLOWED_DURATIONS[parsedDuration]) {
        throw new ApiError(400, 'Invalid durationMinutes');
    }

    // Girl must exist and be platform-approved
    const girl = await Girls.findById(girlId).select('fullName imageUrl applicationStatus');
    if (!girl) {
        throw new ApiError(404, 'Girl not found');
    }
    if (girl.applicationStatus !== 'accepted') {
        throw new ApiError(403, 'This user is not available for calls');
    }

    // Boy must not already have a live room
    const existingRoom = await CallRoom.findOne({
        createdBy: boyId,
        status: { $in: ['waiting', 'active'] }
    });
    if (existingRoom) {
        throw new ApiError(409, 'You already have an active or pending call room');
    }

    const roomId = `room_${uuidv4()}`;
    const durationMs = ALLOWED_DURATIONS[parsedDuration];

    const room = await CallRoom.create({
        roomId,
        createdBy: boyId,
        invitedGirl: girlId,
        durationMs,
        callType,
        status: 'waiting'
    });

    const boy = await User.findById(boyId).select('fullName imageUrl');

    return res.status(201).json(new ApiResponse(
        201,
        {
            roomId: room.roomId,
            durationMinutes: parsedDuration,
            durationMs,
            status: room.status,
            caller: {
                id: boy._id,
                fullName: boy.fullName,
                imageUrl: boy.imageUrl
            },
            receiver: {
                id: girl._id,
                fullName: girl.fullName,
                imageUrl: girl.imageUrl
            }
        },
        'Room created. Now emit notify_incoming_call over socket.'
    ))

});


/**
 * GET /api/calls/room/:roomId
 * Public — girl's app fetches this to render the caller card on the ringing screen.
 */
const getRoomDetails = asyncHandler(async (req, res) => {

    const { roomId } = req.params;

    const room = await CallRoom.findOne({ roomId })
        .populate('createdBy', 'fullName imageUrl age')
        .populate('invitedGirl', 'fullName imageUrl age');

    if (!room) {
        throw new ApiError(404, 'Room not found');
    }

    return res.status(200).json(new ApiResponse(
        200,
        {
            roomId: room.roomId,
            status: room.status,
            durationMs: room.durationMs,
            durationMinutes: room.durationMs / 60000,
            caller: room.createdBy,
            receiver: room.invitedGirl,
            startedAt: room.startedAt,
            createdAt: room.createdAt
        },
        'Room details fetched successfully'
    ));

});

/**
 * GET /api/calls/history/user  — boy's outgoing history
 * GET /api/calls/history/girl  — girl's incoming history
 */
const getCallHistory = asyncHandler(async (req, res) => {
    const isGirl = !!req.girl;
    const id = isGirl ? req.girl._id : req.user._id;

    const query = isGirl ? { receiver: id } : { caller: id };
    const history = await CallHistory.find(query)
        .populate('caller', 'fullName imageUrl')
        .populate('receiver', 'fullName imageUrl')
        .sort({ createdAt: -1 })
        .limit(50);

    return res.status(200).json(new ApiResponse(200, history, 'Call history fetched successfully'));

});

/**
 * GET /api/calls/active
 * Boy checks if he has a live room (used on app resume / reconnect).
 */
const getActiveRoom = asyncHandler(async (req, res) => {

    const boyId = req.user._id;

    const room = await CallRoom.findOne({
        createdBy: boyId,
        status: { $in: ['waiting', 'active'] }
    }).populate('invitedGirl', 'fullName imageUrl');

    if (!room) {
        throw new ApiError(404, 'No active call room found');
    }

    return res.status(200).json(new ApiResponse(
        200,
        {
            roomId: room.roomId,
            status: room.status,
            durationMs: room.durationMs,
            invitedGirl: room.invitedGirl
        },
        'Active call room found'
    ));
});

export {
    createRoom,
    getRoomDetails,
    getCallHistory,
    getActiveRoom
}