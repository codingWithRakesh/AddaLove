import { Schema, model } from 'mongoose';

const callHistorySchema = new Schema({
    roomId: {
        type: String,
        required: true
    },
    caller: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    receiver: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Girls'
    },
    status: {
        type: String,
        enum: ['completed', 'rejected', 'missed'],
        required: true
    },
    plannedDurationMs: {
        type: Number,
        required: true
    },
    actualDurationMs: {
        type: Number,
        default: 0
    },
    startedAt: {
        type: Date,
        default: null
    },
    endedAt: {
        type: Date,
        required: true
    },
    endReason: {
        type: String,
        default: null
    },
    callType: {
        type: String,
        enum: ['audio', 'video'],
        default: 'audio'
    }
}, { timestamps: true });

const CallHistory = model('CallHistory', callHistorySchema);
export default CallHistory;