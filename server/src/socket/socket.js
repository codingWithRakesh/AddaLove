import { Server } from 'socket.io';
import http from 'http';
import app from '../app.js';
import Room from '../models/room.model.js';
import Message from '../models/message.model.js';
import VisitHistory from '../models/visitHistory.model.js';
import { deleteFromImageKit } from '../utils/imageKit.js';

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: true, credentials: true }
});


const onlineUsers = new Map();

io.on('connection', (socket) => {
    const { userId, userType } = socket.handshake.auth || {};

    if (!userId || !['boy', 'girl'].includes(userType)) {
        socket.disconnect(true);
        return;
    }

    const existingUser = onlineUsers.get(userId);
    if (existingUser?.socketId && existingUser.socketId !== socket.id) {
        io.sockets.sockets.get(existingUser.socketId)?.disconnect(true);
    }

    onlineUsers.set(userId, { socketId: socket.id, userType });
    console.log(`[CONNECT] ${userType} ${userId}`);

    const onlineList = Array.from(onlineUsers.entries()).map(([id, info]) => ({
        userId: id,
        userType: info.userType
    }));
    socket.emit('online_users', { users: onlineList });


    socket.on('join_room', async ({ roomId, userId: roomUserId }) => {
        if (!roomId) {
            socket.emit('room_error', { message: 'roomId is required' });
            return;
        }
        const targetUserId = roomUserId || userId;
        socket.join(roomId);
        socket.join(targetUserId);
    });

    socket.on('leave_room', async ({ roomId, userId: roomUserId }) => {
        if (!roomId) {
            socket.emit('room_error', { message: 'roomId is required' });
            return;
        }
        const targetUserId = roomUserId || userId;
        socket.leave(roomId);
        socket.leave(targetUserId);
    });

    socket.on("offer", ({ offer, roomId }) => {
        socket.to(roomId).emit("offer", { from: userId, offer });
    });

    socket.on("answer", ({ answer, roomId }) => {
        socket.to(roomId).emit("answer", { from: userId, answer });
    });

    socket.on("ice_candidate", ({ candidate, roomId }) => {
        socket.to(roomId).emit("ice_candidate", { from: userId, candidate });
    });

    socket.on('disconnect', async () => {
        console.log(`[DISCONNECT] ${userType} ${userId}`);
        if (onlineUsers.get(userId)?.socketId === socket.id) {
            onlineUsers.delete(userId);
        }

        io.emit('user_offline', { userId, userType });
        const updatedOnlineList = Array.from(onlineUsers.entries()).map(([id, info]) => ({
            userId: id,
            userType: info.userType
        }));
        io.emit('online_users', { users: updatedOnlineList });
        socket.leave(userId);

    });
});


export { server, io };
