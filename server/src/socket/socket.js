import { Server } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import Room from '../models/room.model.js';
import User from '../models/user.model.js';
import Girls from '../models/girls.model.js';

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: true, credentials: true }
});

const onlineUsers = new Map();

const readCookie = (cookieHeader, name) => {
    const cookies = String(cookieHeader || '').split(';');
    for (const cookie of cookies) {
        const [key, ...value] = cookie.trim().split('=');
        if (key === name) return decodeURIComponent(value.join('='));
    }
    return null;
};

io.use(async (socket, next) => {
    try {
        const cookieToken = readCookie(socket.handshake.headers.cookie, 'authToken');
        const bearerToken = socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');
        const token = cookieToken || bearerToken;
        if (!token) return next(new Error('Unauthorized'));

        const decoded = jwt.verify(token, process.env.JWT_SERECT);
        const userType = decoded.userType?.toLowerCase();
        if (!['boy', 'girl'].includes(userType)) return next(new Error('Unauthorized'));

        const Model = userType === 'girl' ? Girls : User;
        const userExists = await Model.exists({ _id: decoded.userId });
        if (!userExists) return next(new Error('Unauthorized'));

        socket.data.userId = String(decoded.userId);
        socket.data.userType = userType;
        next();
    } catch {
        next(new Error('Unauthorized'));
    }
});

const getParticipantRoom = async (roomId, userId, userType) => {
    const room = await Room.findOne({ roomId });
    if (!room) return { error: 'Room not found' };

    const isOwner = userType === 'girl' && room.createdBy.toString() === userId;
    const isCurrentBoy = userType === 'boy' && room.currentBoy?.toString() === userId;
    if (!isOwner && !isCurrentBoy) return { error: 'You are not a participant in this room' };

    return { room };
};

io.on('connection', (socket) => {
    const { userId, userType } = socket.data;
    const existingUser = onlineUsers.get(userId);
    if (existingUser?.socketId && existingUser.socketId !== socket.id) {
        io.sockets.sockets.get(existingUser.socketId)?.disconnect(true);
    }

    onlineUsers.set(userId, { socketId: socket.id, userType });
    socket.join(userId);

    const onlineList = Array.from(onlineUsers.entries()).map(([id, info]) => ({
        userId: id,
        userType: info.userType
    }));
    socket.emit('online_users', { users: onlineList });

    socket.on('join_room', async ({ roomId } = {}) => {
        if (!roomId) return socket.emit('room_error', { message: 'roomId is required' });
        try {
            const { room, error } = await getParticipantRoom(roomId, userId, userType);
            if (error) return socket.emit('room_error', { roomId, message: error });

            await socket.join(roomId);
            socket.emit('room_joined', { roomId, roomType: room.roomType });

            if (room.roomType === 'voice') {
                socket.to(roomId).emit('voice_participant_joined', { roomId, userId, userType });
            }
        } catch {
            socket.emit('room_error', { roomId, message: 'Could not join the socket room' });
        }
    });

    socket.on('leave_room', ({ roomId } = {}) => {
        if (!roomId || !socket.rooms.has(roomId)) return;
        socket.to(roomId).emit('voice_participant_left', { roomId, userId, userType });
        socket.leave(roomId);
    });

    const relayVoiceSignal = async (eventName, payload = {}) => {
        const { roomId } = payload;
        if (!roomId || !socket.rooms.has(roomId)) return;

        try {
            const { room, error } = await getParticipantRoom(roomId, userId, userType);
            if (error || room.roomType !== 'voice') return;
            socket.to(roomId).emit(eventName, { ...payload, from: userId });
        } catch {
            socket.emit('room_error', { roomId, message: 'Audio signaling failed' });
        }
    };

    socket.on('offer', (payload) => relayVoiceSignal('offer', payload));
    socket.on('answer', (payload) => relayVoiceSignal('answer', payload));
    socket.on('ice_candidate', (payload) => relayVoiceSignal('ice_candidate', payload));

    socket.on('disconnecting', () => {
        for (const roomId of socket.rooms) {
            if (roomId !== socket.id && roomId !== userId) {
                socket.to(roomId).emit('voice_participant_left', { roomId, userId, userType });
            }
        }
    });

    socket.on('disconnect', () => {
        if (onlineUsers.get(userId)?.socketId === socket.id) onlineUsers.delete(userId);
        io.emit('user_offline', { userId, userType });
        io.emit('online_users', {
            users: Array.from(onlineUsers.entries()).map(([id, info]) => ({
                userId: id,
                userType: info.userType
            }))
        });
    });
});

export { server, io };
