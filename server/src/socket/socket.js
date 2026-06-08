import { Server } from 'socket.io';
import http from 'http';
import app from '../app.js';
import CallRoom from '../models/callRoom.model.js';
import CallHistory from '../models/callHistory.model.js';

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: true,
        credentials: true
    }
});

/**
 * Tracks every connected socket.
 * Key: userId (string)
 * Value: { socketId, userType }
 */
const onlineUsers = new Map();

/**
 * Girl availability lock.
 * Key: girlId (string)
 * Value: { status: 'ringing' | 'in_call', roomId }
 *
 * A girl is locked while a call is ringing OR while a call is active.
 * Lock is released ONLY when:
 *   - She rejects the call         → status was 'ringing'
 *   - Boy cancels before accept    → status was 'ringing'
 *   - Call ends (any reason)       → status was 'in_call'
 *   - She disconnects              → either status
 */
const girlLocks = new Map();

/**
 * Active calls (post-accept, timer running).
 * Key: roomId
 * Value: { timer, startedAt, durationMs, boyId, girlId }
 */
const activeCalls = new Map();

function lockGirl(girlId, status, roomId) {
    girlLocks.set(girlId, { status, roomId });
    console.log(`[LOCK] girl=${girlId} status=${status} room=${roomId}`);
}
 
function unlockGirl(girlId) {
    girlLocks.delete(girlId);
    console.log(`[UNLOCK] girl=${girlId}`);
}
 
function isGirlAvailable(girlId) {
    // Must be online AND not locked
    return onlineUsers.has(girlId) && !girlLocks.has(girlId);
}

/**
 * Fully ends an ACTIVE call (timer running):
 * 1. Clears countdown timer
 * 2. Emits call_ended to both participants
 * 3. Unlocks the girl
 * 4. Persists end state + call history to DB
 */
async function endCall(roomId, reason = 'ended_by_user') {
    const call = activeCalls.get(roomId);
    if (!call) return;
 
    clearTimeout(call.timer);
    activeCalls.delete(roomId);
 
    // Release girl lock
    unlockGirl(call.girlId);
 
    // Notify both sides
    io.to(roomId).emit('call_ended', { roomId, reason });
    io.socketsLeave(roomId);
 
    // Persist
    try {
        const now = new Date();
        const actualDurationMs = call.startedAt ? now - call.startedAt : 0;
 
        await CallRoom.findOneAndUpdate(
            { roomId },
            { status: 'ended', endedAt: now, endReason: reason, actualDurationMs }
        );
 
        const roomDoc = await CallRoom.findOne({ roomId });
        if (roomDoc) {
            await CallHistory.create({
                roomId,
                callType: roomDoc.callType,
                caller: roomDoc.createdBy,
                receiver: roomDoc.invitedGirl,
                status: 'completed',
                plannedDurationMs: roomDoc.durationMs,
                actualDurationMs,
                startedAt: call.startedAt,
                endedAt: now,
                endReason: reason
            });
        }
    } catch (err) {
        console.error('endCall DB error:', err);
    }
}

/**
 * Destroys a room that was still in 'waiting' state (ringing but never accepted):
 * - rejected by girl
 * - cancelled by boy
 * - girl/boy disconnected while ringing
 */
async function destroyWaitingRoom(roomId, reason = 'rejected') {
    try {
        const roomDoc = await CallRoom.findOneAndUpdate(
            { roomId },
            {
                status: reason === 'rejected' ? 'rejected' : 'ended',
                endedAt: new Date(),
                endReason: reason
            },
            { new: true }
        );
 
        if (roomDoc) {
            // Unlock the girl if she's still locked by this room
            const lock = girlLocks.get(roomDoc.invitedGirl.toString());
            if (lock && lock.roomId === roomId) {
                unlockGirl(roomDoc.invitedGirl.toString());
            }
 
            await CallHistory.create({
                roomId,
                caller: roomDoc.createdBy,
                receiver: roomDoc.invitedGirl,
                status: reason === 'rejected' ? 'rejected' : 'missed',
                plannedDurationMs: roomDoc.durationMs,
                actualDurationMs: 0,
                startedAt: null,
                endedAt: new Date(),
                endReason: reason
            });
        }
    } catch (err) {
        console.error('destroyWaitingRoom DB error:', err);
    }
 
    io.socketsLeave(roomId);
}

io.on('connection', (socket) => {
    const { userId, userType } = socket.handshake.auth || {};
 
    if (!userId || !['boy', 'girl'].includes(userType)) {
        socket.emit('auth_error', { message: 'userId and userType (boy|girl) are required' });
        socket.disconnect(true);
        return;
    }
 
    // Register presence
    onlineUsers.set(userId, { socketId: socket.id, userType });
    socket.join(`user:${userId}`);
 
    console.log(`[CONNECT] ${userType} ${userId} | socket ${socket.id}`);
 
    // ── 1. BOY: NOTIFY GIRL OF INCOMING CALL ─────────────────────────────────
    /**
     * Called by boy right after POST /api/calls/create.
     * Payload: { roomId, girlId }
     *
     * Checks:
     *   - Girl must be online
     *   - Girl must NOT be locked (ringing elsewhere or in a call)
     *
     * On success:
     *   - Locks the girl with status 'ringing'
     *   - Pushes 'incoming_call' to her socket
     */
    socket.on('notify_incoming_call', async ({ roomId, girlId }) => {
        if (userType !== 'boy') {
            socket.emit('call_error', { message: 'Only boys can initiate calls' });
            return;
        }
        if (!roomId || !girlId) {
            socket.emit('call_error', { message: 'roomId and girlId are required' });
            return;
        }
 
        // ── ONLINE CHECK ──
        if (!onlineUsers.has(girlId)) {
            // Clean up the room we just created since we can't reach her
            await destroyWaitingRoom(roomId, 'girl_offline');
            socket.emit('call_error', {
                message: 'This user is currently offline. Try again later.',
                code: 'GIRL_OFFLINE'
            });
            return;
        }
 
        // ── AVAILABILITY CHECK ──
        if (girlLocks.has(girlId)) {
            const lock = girlLocks.get(girlId);
            await destroyWaitingRoom(roomId, 'girl_busy');
            socket.emit('call_error', {
                message: lock.status === 'ringing'
                    ? 'This user is already being called by someone else. Try again shortly.'
                    : 'This user is currently in a call. Try again after the call ends.',
                code: 'GIRL_BUSY'
            });
            return;
        }
 
        try {
            const room = await CallRoom.findOne({ roomId })
                .populate('createdBy', 'fullName imageUrl age')
                .populate('invitedGirl', 'fullName imageUrl age');
 
            if (!room) {
                socket.emit('call_error', { message: 'Room not found' });
                return;
            }
            if (room.status !== 'waiting') {
                socket.emit('call_error', { message: 'Room is no longer available' });
                return;
            }
            if (room.invitedGirl._id.toString() !== girlId) {
                socket.emit('call_error', { message: 'This room is not for that girl' });
                return;
            }
 
            // Boy joins the socket room
            socket.join(roomId);
 
            // 🔒 Lock the girl as 'ringing'
            lockGirl(girlId, 'ringing', roomId);
 
            // Push incoming call to girl
            io.to(`user:${girlId}`).emit('incoming_call', {
                roomId,
                callType: room.callType,
                durationMinutes: room.durationMs / 60000,
                caller: {
                    id: room.createdBy._id,
                    fullName: room.createdBy.fullName,
                    imageUrl: room.createdBy.imageUrl,
                    age: room.createdBy.age
                }
            });
 
            socket.emit('call_request_sent', { roomId, girlId });
            console.log(`[RINGING] room=${roomId} girl=${girlId}`);
        } catch (err) {
            console.error('notify_incoming_call error:', err);
            // Unlock on error to avoid stuck lock
            unlockGirl(girlId);
            socket.emit('call_error', { message: 'Server error' });
        }
    });
 
    // ── 2. GIRL: ACCEPT CALL ──────────────────────────────────────────────────
    /**
     * Payload: { roomId }
     *
     * On success:
     *   - Upgrades girl lock from 'ringing' → 'in_call'
     *   - Starts countdown timer
     *   - Emits 'call_accepted' to both
     */
    socket.on('accept_call', async ({ roomId }) => {
        if (userType !== 'girl') {
            socket.emit('call_error', { message: 'Only girls can accept calls' });
            return;
        }
        if (!roomId) {
            socket.emit('call_error', { message: 'roomId is required' });
            return;
        }
 
        try {
            const room = await CallRoom.findOne({ roomId });
            if (!room) {
                socket.emit('call_error', { message: 'Room not found' });
                return;
            }
            if (room.status !== 'waiting') {
                socket.emit('call_error', { message: 'Call is no longer available' });
                return;
            }
            if (room.invitedGirl.toString() !== userId) {
                socket.emit('call_error', { message: 'You are not invited to this room' });
                return;
            }
 
            // Girl joins the socket room
            socket.join(roomId);
 
            const startedAt = new Date();
            await CallRoom.findOneAndUpdate({ roomId }, { status: 'active', startedAt });
 
            // 🔒 Upgrade lock: ringing → in_call
            lockGirl(userId, 'in_call', roomId);
 
            // Start the countdown timer
            const timer = setTimeout(() => endCall(roomId, 'duration_limit'), room.durationMs);
            activeCalls.set(roomId, {
                timer,
                startedAt,
                durationMs: room.durationMs,
                boyId: room.createdBy.toString(),
                girlId: userId
            });
 
            // Notify both
            io.to(roomId).emit('call_accepted', {
                roomId,
                durationMs: room.durationMs,
                startedAt: startedAt.toISOString()
            });
 
            console.log(`[CALL STARTED] room=${roomId} duration=${room.durationMs}ms`);
        } catch (err) {
            console.error('accept_call error:', err);
            socket.emit('call_error', { message: 'Server error' });
        }
    });
 
    // ── 3. GIRL: REJECT CALL ──────────────────────────────────────────────────
    /**
     * Payload: { roomId }
     *
     * On success:
     *   - Unlocks the girl immediately
     *   - Notifies the boy
     *   - Destroys room
     */
    socket.on('reject_call', async ({ roomId }) => {
        if (userType !== 'girl') {
            socket.emit('call_error', { message: 'Only girls can reject calls' });
            return;
        }
        if (!roomId) {
            socket.emit('call_error', { message: 'roomId is required' });
            return;
        }
 
        try {
            const room = await CallRoom.findOne({ roomId });
            if (!room) {
                socket.emit('call_error', { message: 'Room not found' });
                return;
            }
            if (room.status !== 'waiting') {
                socket.emit('call_error', { message: 'Room is no longer in waiting state' });
                return;
            }
 
            // Notify boy
            io.to(`user:${room.createdBy.toString()}`).emit('call_rejected', {
                roomId,
                message: 'The user rejected your call'
            });
 
            // Persist + unlock (destroyWaitingRoom handles the unlock)
            await destroyWaitingRoom(roomId, 'rejected');
 
            socket.emit('call_rejection_confirmed', { roomId });
            console.log(`[CALL REJECTED] room=${roomId}`);
        } catch (err) {
            console.error('reject_call error:', err);
            socket.emit('call_error', { message: 'Server error' });
        }
    });
 
    // ── 4. BOY: CANCEL CALL (before girl answers) ────────────────────────────
    /**
     * Payload: { roomId }
     * Boy can withdraw the call request while it's still ringing.
     * Unlocks the girl and destroys the room.
     */
    socket.on('cancel_call', async ({ roomId }) => {
        if (userType !== 'boy') {
            socket.emit('call_error', { message: 'Only boys can cancel calls' });
            return;
        }
        if (!roomId) {
            socket.emit('call_error', { message: 'roomId is required' });
            return;
        }
 
        try {
            const room = await CallRoom.findOne({ roomId });
            if (!room) {
                socket.emit('call_error', { message: 'Room not found' });
                return;
            }
            if (room.status !== 'waiting') {
                socket.emit('call_error', { message: 'Can only cancel a waiting call' });
                return;
            }
            if (room.createdBy.toString() !== userId) {
                socket.emit('call_error', { message: 'You did not create this room' });
                return;
            }
 
            // Tell the girl the call was cancelled
            io.to(`user:${room.invitedGirl.toString()}`).emit('call_cancelled', {
                roomId,
                message: 'The caller cancelled the call'
            });
 
            // destroyWaitingRoom handles the girl unlock
            await destroyWaitingRoom(roomId, 'cancelled');
 
            socket.emit('call_cancel_confirmed', { roomId });
            console.log(`[CALL CANCELLED] room=${roomId}`);
        } catch (err) {
            console.error('cancel_call error:', err);
            socket.emit('call_error', { message: 'Server error' });
        }
    });
 
    // ── 5. WebRTC SIGNALLING ──────────────────────────────────────────────────
    // All three events just relay to the other person in the room.
    // Audio goes peer-to-peer; server only forwards signalling.
 
    socket.on('webrtc_offer', ({ roomId, offer }) => {
        if (!roomId || !offer) {
            socket.emit('call_error', { message: 'roomId and offer are required' });
            return;
        }
        socket.to(roomId).emit('webrtc_offer', { from: userId, offer });
    });
 
    socket.on('webrtc_answer', ({ roomId, answer }) => {
        if (!roomId || !answer) {
            socket.emit('call_error', { message: 'roomId and answer are required' });
            return;
        }
        socket.to(roomId).emit('webrtc_answer', { from: userId, answer });
    });
 
    socket.on('ice_candidate', ({ roomId, candidate }) => {
        if (!roomId) {
            socket.emit('call_error', { message: 'roomId is required' });
            return;
        }
        socket.to(roomId).emit('ice_candidate', { from: userId, candidate });
    });
 
    // ── 6. END CALL (manual, mid-call) ───────────────────────────────────────
    /**
     * Either participant can end the active call early.
     * Payload: { roomId }
     */
    socket.on('end_call', ({ roomId }) => {
        if (!roomId) {
            socket.emit('call_error', { message: 'roomId is required' });
            return;
        }
        if (activeCalls.has(roomId)) {
            endCall(roomId, 'ended_by_user');
        } else {
            // Safety: room still in waiting state somehow
            destroyWaitingRoom(roomId, 'ended_by_user');
        }
    });
 
    // ── 7. DISCONNECT ─────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
        console.log(`[DISCONNECT] ${userType} ${userId}`);
        onlineUsers.delete(userId);
 
        if (userType === 'girl') {
            const lock = girlLocks.get(userId);
            if (lock) {
                if (lock.status === 'ringing') {
                    // Girl dropped while ringing — notify boy, destroy room
                    const room = await CallRoom.findOne({ roomId: lock.roomId });
                    if (room) {
                        io.to(`user:${room.createdBy.toString()}`).emit('call_rejected', {
                            roomId: lock.roomId,
                            message: 'User went offline'
                        });
                    }
                    await destroyWaitingRoom(lock.roomId, 'girl_offline');
                } else if (lock.status === 'in_call') {
                    // Girl dropped mid-call
                    await endCall(lock.roomId, 'disconnect');
                }
                // destroyWaitingRoom/endCall both call unlockGirl internally
            }
        }
 
        if (userType === 'boy') {
            // Boy dropped: check if he was in an active call
            for (const [roomId, call] of activeCalls.entries()) {
                if (call.boyId === userId) {
                    await endCall(roomId, 'disconnect');
                }
            }
 
            // Boy dropped while ringing (waiting room exists)
            const waitingRoom = await CallRoom.findOne({
                createdBy: userId,
                status: 'waiting'
            });
            if (waitingRoom) {
                io.to(`user:${waitingRoom.invitedGirl.toString()}`).emit('call_cancelled', {
                    roomId: waitingRoom.roomId,
                    message: 'Caller went offline'
                });
                await destroyWaitingRoom(waitingRoom.roomId, 'boy_offline');
            }
        }
    });
});



export { server, io };