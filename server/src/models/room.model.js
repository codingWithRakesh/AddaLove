import { Schema, model } from 'mongoose';

const roomSchema = new Schema({
    roomId: {
        type: String,
        required: true,
        unique: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Girls'
    },
    roomType: {
        type: String,
        required: true,
        enum: ['message', 'voice', 'video']
    },
    status: {
        type: String,
        enum: ['open', 'occupied', 'destroyed'],
        default: 'open'
    },
    // The boy currently inside the room
    currentBoy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    currentBoyJoinedAt: {
        type: Date,
        default: null
    },
    // Duration the boy chose when joining — read by socket to set the timer
    currentSessionDurationMs: {
        type: Number,
        default: 5 * 60 * 1000
    }
}, { timestamps: true });

const Room = model('Room', roomSchema);
export default Room;