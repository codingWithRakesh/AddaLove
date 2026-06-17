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
        required: true
    },
    // Actual time spent in seconds
    durationSeconds: {
        type: Number,
        default: 0,
        min: 0
    },
    // How the boy session ended: boy left, girl destroyed the room, or time ended.
    exitReason: {
        type: String,
        enum: ['boy_left', 'room_destroyed', 'time_limit'],
        required: true
    }
}, { timestamps: true });

visitHistorySchema.index({ girl: 1, createdAt: -1 });
visitHistorySchema.index({ boy: 1, createdAt: -1 });
visitHistorySchema.index({ roomId: 1 });

const VisitHistory = model('VisitHistory', visitHistorySchema);
export default VisitHistory;
