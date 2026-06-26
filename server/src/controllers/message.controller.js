import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from '../utils/apiError.js';
import Room from '../models/room.model.js';
import Message from '../models/message.model.js';
import { io } from '../socket/socket.js';
import { uploadToImageKit } from '../utils/imageKit.js';

const sendMessage = asyncHandler(async (req, res) => {

    const { roomId } = req.params;
    const { messageType, text } = req.body;

    // Determine who is sending
    const isGirl = req.userType === 'girl';
    const senderId = isGirl ? req.user._id : req.user._id;
    const senderModel = isGirl ? 'Girls' : 'User';

    if (!messageType || !['text', 'image', 'audio'].includes(messageType)) {
        throw new ApiError(400, 'Invalid or missing messageType. Must be one of: text, image, audio');
    }

    const room = await Room.findOne({ roomId });
    if (!room) {
        throw new ApiError(404, 'Room not found');
    }
    if (room.status === 'destroyed') {
        throw new ApiError(400, 'Room no longer exists');
    }
    if (room.roomType !== 'message') {
        throw new ApiError(403, 'This room is not a message room');
    }

    // Only girl owner or the current boy inside can send
    const girlOwner = room.createdBy.toString();
    const currentBoy = room.currentBoy?.toString();

    if (!currentBoy) {
        throw new ApiError(403, 'No boy is inside this room');
    }
    if (!isGirl && currentBoy !== senderId.toString()) {
        throw new ApiError(403, 'You are not inside this room');
    }
    if (isGirl && girlOwner !== senderId.toString()) {
        throw new ApiError(403, 'You do not own this room');
    }

    let fileUrl = null;
    let fileId = null;

    // Handle file upload for image/audio
    if (messageType === 'text') {
        if (!text || !text.trim()) {
            throw new ApiError(400, 'text is required for text messages');
        }
    } else {
        if (!req.file) {
            throw new ApiError(400, `File is required for ${messageType} messages`);
        }

        const folder = messageType === 'image' ? '/chat/images' : '/chat/audio';
        const uploaded = await uploadToImageKit(req.file.buffer, req.file.originalname, folder);
        fileUrl = uploaded.url;
        fileId = uploaded.fileId;
    }

    const message = await Message.create({
        roomId,
        sender: senderId,
        senderModel,
        messageType,
        text: messageType === 'text' ? text.trim() : null,
        fileUrl,
        fileId
    });

    // Emit to everyone in the socket room
    io.to(roomId).emit('new_message', {
        _id: message._id,
        roomId,
        sender: { id: senderId, model: senderModel },
        messageType,
        text: message.text,
        fileUrl: message.fileUrl,
        createdAt: message.createdAt
    });

    return res.status(201).json(
        new ApiResponse(201, message, 'Message sent successfully')
    );

});

export { sendMessage };
