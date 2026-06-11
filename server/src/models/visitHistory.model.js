import { Schema, model } from 'mongoose';

const visitHistorySchema = new Schema({
    roomId: {
        type: String,
        required: true
    },
    girl: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Girls'
    },
    boy: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    roomType: {
        type: String,
        required: true,
        enum: ['message', 'voice', 'video']
    },
    joinedAt: {
        type: Date,
        required: true
    },
    leftAt: {
        type: Date,
        default: null
    },
    // Actual time spent in seconds
    durationSeconds: {
        type: Number,
        default: 0
    },
    // How the session ended
    exitReason: {
        type: String,
        enum: ['time_limit', 'boy_left', 'room_destroyed', 'disconnect'],
        default: null
    }
}, { timestamps: true });

const VisitHistory = model('VisitHistory', visitHistorySchema);
export default VisitHistory;