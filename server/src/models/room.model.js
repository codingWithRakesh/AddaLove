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
    currentSessionDurationMs: {
        type: Number,
        default: 5 * 60 * 1000
    },
    language: {
        type: [{
            type: String,
            enum: ['Bengali', 'Hindi', 'Gujarati', 'English', 'Kannada', 'Marathi', 'Tamil', 'Telugu', 'Urdu', 'Punjabi']
        }],
        required: true,
        validate: {
            validator: (languages) => Array.isArray(languages) && languages.length === 2,
            message: 'Exactly 2 languages are required'
        }
    }
}, { timestamps: true });

const Room = model('Room', roomSchema);
export default Room;
