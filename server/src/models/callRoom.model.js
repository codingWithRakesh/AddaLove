import { Schema, model } from 'mongoose';

const callRoomSchema = new Schema({
    roomId: {
        type: String,
        required: true,
        unique: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    invitedGirl: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Girls'
    },
    status: {
        type: String,
        enum: ['waiting', 'active', 'ended', 'rejected'],
        default: 'waiting'
    },
    durationMs: {
        type: Number,
        required: true,
        default: 5 * 60 * 1000
    },
    startedAt: {
        type: Date,
        default: null
    },
    endedAt: {
        type: Date,
        default: null
    },
    endReason: {
        type: String,
        enum: ['duration_limit', 'ended_by_user', 'rejected', 'disconnect', 'timeout'],
        default: null
    },
    actualDurationMs: {
        type: Number,
        default: null
    },
    callType: {
        type: String,
        enum: ['audio', 'video'],
        default: 'audio'
    }
}, { timestamps: true });

const CallRoom = model('CallRoom', callRoomSchema);
export default CallRoom;