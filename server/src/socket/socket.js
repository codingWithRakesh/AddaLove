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

/**
 * Online users.
 * Key: userId  Value: { socketId, userType }
 */
const onlineUsers = new Map();

/**
 * Active boy sessions inside rooms.
 * Key: roomId
 * Value: { boyId, joinedAt, timer }
 */
const activeSessions = new Map();

/**
 * Ends a boy's session in a room.
 * Saves visit history, frees the room, notifies both sides.
 */
async function endBoySession(roomId, reason = 'boy_left') {
    const session = activeSessions.get(roomId);
    if (!session) return;
 
    clearTimeout(session.timer);
    activeSessions.delete(roomId);
 
    const leftAt = new Date();
    const durationSeconds = Math.round((leftAt - session.joinedAt) / 1000);
 
    try {
        const room = await Room.findOne({ roomId });
        if (room && room.status !== 'destroyed') {
            // Wipe all messages so the next boy starts fresh
            if (room.roomType === 'message') {
                const mediaMessages = await Message.find({
                    roomId,
                    messageType: { $in: ['image', 'audio'] },
                    fileId: { $ne: null }
                });
                for (const msg of mediaMessages) {
                    try {
                        await deleteFromImageKit(msg.fileId);
                    } catch (e) {
                        console.error(`ImageKit delete failed fileId=${msg.fileId}:`, e.message);
                    }
                }
                await Message.deleteMany({ roomId });
 
                // Tell both sides to clear their chat UI
                io.to(roomId).emit('messages_cleared', { roomId });
            }
 
            // Free the room
            room.status = 'open';
            room.currentBoy = null;
            room.currentBoyJoinedAt = null;
            await room.save();
 
            // Save history
            await VisitHistory.create({
                roomId,
                girl: room.createdBy,
                boy: session.boyId,
                roomType: room.roomType,
                joinedAt: session.joinedAt,
                leftAt,
                durationSeconds,
                exitReason: reason
            });
 
            // Notify the girl her room is open again
            io.to(`user:${room.createdBy.toString()}`).emit('boy_left', {
                roomId,
                boyId: session.boyId,
                durationSeconds,
                reason
            });
 
            // Notify everyone: room is open again
            io.emit('room_status_changed', { roomId, status: 'open' });
        }
    } catch (err) {
        console.error('endBoySession DB error:', err);
    }
 
    // Kick boy from socket room
    io.to(`user:${session.boyId}`).emit('session_ended', { roomId, reason });
    const boySocketId = onlineUsers.get(session.boyId)?.socketId;
    if (boySocketId) {
        const boySocket = io.sockets.sockets.get(boySocketId);
        if (boySocket) boySocket.leave(roomId);
    }
}
 
 
io.on('connection', (socket) => {
    const { userId, userType } = socket.handshake.auth || {};
 
    if (!userId || !['boy', 'girl'].includes(userType)) {
        socket.emit('auth_error', { message: 'userId and userType (boy|girl) are required' });
        socket.disconnect(true);
        return;
    }
 
    onlineUsers.set(userId, { socketId: socket.id, userType });
    socket.join(`user:${userId}`);
    console.log(`[CONNECT] ${userType} ${userId}`);
 
    // Send the full online users list only to the newly connected client
    const onlineList = Array.from(onlineUsers.entries()).map(([id, info]) => ({
        userId: id,
        userType: info.userType
    }));
    socket.emit('online_users', { users: onlineList });
 
    // Tell every other connected client this user just came online
    socket.broadcast.emit('user_online', { userId, userType });
 
    // ── GIRL: ANNOUNCE ROOM CREATED ───────────────────────────────────────────
    /**
     * After POST /api/rooms/create, girl emits this so everyone online
     * sees the new room appear in their list.
     * Payload: { roomId, roomType }
     */
    socket.on('announce_room', ({ roomId, roomType }) => {
        if (userType !== 'girl') return;
        socket.join(roomId); // girl always stays in her room's socket channel
        io.emit('room_opened', { roomId, roomType, girlId: userId });
        console.log(`[ROOM OPENED] ${roomId} type=${roomType}`);
    });
 
    // ── BOY: JOIN ROOM (socket side — after REST /join succeeds) ─────────────
    /**
     * Boy calls REST POST /api/rooms/:roomId/join first.
     * If that returns success, he emits this to enter the socket room
     * and start the 5-minute timer.
     * Payload: { roomId }
     */
    socket.on('join_room', async ({ roomId }) => {
        if (userType !== 'boy') {
            socket.emit('room_error', { message: 'Only boys can join rooms' });
            return;
        }
        if (!roomId) {
            socket.emit('room_error', { message: 'roomId is required' });
            return;
        }
 
        // Guard: don't let him start a second session if one is already running
        for (const [rid, session] of activeSessions.entries()) {
            if (session.boyId === userId) {
                socket.emit('room_error', { message: 'You are already in a room. Leave first.' });
                return;
            }
        }
 
        try {
            const room = await Room.findOne({ roomId });
            if (!room || room.status === 'destroyed') {
                socket.emit('room_error', { message: 'Room not found or destroyed' });
                return;
            }
            if (room.status !== 'occupied' || room.currentBoy?.toString() !== userId) {
                // REST join was not called first or race condition
                socket.emit('room_error', { message: 'Call REST /join before joining the socket room' });
                return;
            }
 
            socket.join(roomId);
 
            const joinedAt = room.currentBoyJoinedAt || new Date();
            const sessionDurationMs = room.currentSessionDurationMs || 5 * 60 * 1000;
 
            // Start timer using the duration the boy chose at REST join time
            const timer = setTimeout(() => endBoySession(roomId, 'time_limit'), sessionDurationMs);
            activeSessions.set(roomId, { boyId: userId, joinedAt, timer });
 
            // Notify girl
            io.to(`user:${room.createdBy.toString()}`).emit('boy_joined', {
                roomId,
                boyId: userId,
                sessionDurationMs,
                joinedAt: joinedAt.toISOString()
            });
 
            // Confirm to boy with his chosen duration
            socket.emit('session_started', {
                roomId,
                roomType: room.roomType,
                sessionDurationMs,
                joinedAt: joinedAt.toISOString()
            });
 
            // Tell everyone room is now occupied
            io.emit('room_status_changed', { roomId, status: 'occupied' });
 
            console.log(`[BOY JOINED] room=${roomId} boy=${userId}`);
        } catch (err) {
            console.error('join_room socket error:', err);
            socket.emit('room_error', { message: 'Server error' });
        }
    });
 
    // ── BOY: LEAVE ROOM (manual) ──────────────────────────────────────────────
    /**
     * Boy presses Leave button.
     * Payload: { roomId }
     */
    socket.on('leave_room', async ({ roomId }) => {
        if (!roomId) {
            socket.emit('room_error', { message: 'roomId is required' });
            return;
        }
        const session = activeSessions.get(roomId);
        if (!session || session.boyId !== userId) {
            socket.emit('room_error', { message: 'You are not in this room' });
            return;
        }
        await endBoySession(roomId, 'boy_left');
        socket.leave(roomId);
    });
 
    // ── GIRL: DESTROY ROOM (socket side) ─────────────────────────────────────
    /**
     * After REST DELETE /api/rooms/:roomId, girl emits this to trigger
     * the socket-level cleanup (kick boy, notify everyone).
     * Payload: { roomId }
     *
     * Note: destroyRoom REST also does this via io import, so this event
     * is an alternative/backup for clients that handle it socket-only.
     */
    socket.on('destroy_room', async ({ roomId }) => {
        if (userType !== 'girl') return;
        if (!roomId) return;
 
        try {
            const room = await Room.findOne({ roomId });
            if (!room || room.createdBy.toString() !== userId) return;
 
            // End boy session if someone is inside
            if (activeSessions.has(roomId)) {
                await endBoySession(roomId, 'room_destroyed');
            }
 
            room.status = 'destroyed';
            await room.save();
 
            io.to(roomId).emit('room_destroyed', { roomId, message: 'Host ended the room' });
            io.emit('room_closed', { roomId });
            io.socketsLeave(roomId);
 
            console.log(`[ROOM DESTROYED] ${roomId}`);
        } catch (err) {
            console.error('destroy_room socket error:', err);
        }
    });
 
    // ── WebRTC SIGNALLING (voice / video rooms only) ──────────────────────────
    // Server just relays — audio/video goes peer to peer
 
    socket.on('webrtc_offer', ({ roomId, offer }) => {
        if (!roomId || !offer) return;
        socket.to(roomId).emit('webrtc_offer', { from: userId, offer });
    });
 
    socket.on('webrtc_answer', ({ roomId, answer }) => {
        if (!roomId || !answer) return;
        socket.to(roomId).emit('webrtc_answer', { from: userId, answer });
    });
 
    socket.on('ice_candidate', ({ roomId, candidate }) => {
        if (!roomId) return;
        socket.to(roomId).emit('ice_candidate', { from: userId, candidate });
    });
 
    // ── EXIT CALL (voice/video only — ends WebRTC but stays in room) ─────────
    /**
     * For voice/video rooms: boy can "exit the call" (stop media)
     * without leaving the room itself. His 5-min timer still runs.
     * If he wants to fully leave he uses leave_room.
     * Payload: { roomId }
     */
    socket.on('exit_call', ({ roomId }) => {
        if (!roomId) return;
        socket.to(roomId).emit('peer_exited_call', { from: userId, roomId });
    });
 
    // ── DISCONNECT ────────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
        console.log(`[DISCONNECT] ${userType} ${userId}`);
        onlineUsers.delete(userId);
 
        // Tell everyone this user went offline
        io.emit('user_offline', { userId, userType });
 
        if (userType === 'boy') {
            // End any active session
            for (const [roomId, session] of activeSessions.entries()) {
                if (session.boyId === userId) {
                    await endBoySession(roomId, 'disconnect');
                }
            }
        }
 
        if (userType === 'girl') {
            // If girl disconnects, destroy her active room
            const room = await Room.findOne({
                createdBy: userId,
                status: { $in: ['open', 'occupied'] }
            });
            if (room) {
                if (activeSessions.has(room.roomId)) {
                    await endBoySession(room.roomId, 'room_destroyed');
                }
                room.status = 'destroyed';
                await room.save();
                io.emit('room_closed', { roomId: room.roomId });
            }
        }
    });
});


export { server, io };