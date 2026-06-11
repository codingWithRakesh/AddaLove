import { Schema, model } from 'mongoose';

const messageSchema = new Schema({
    roomId: {
        type: String,
        required: true
    },
    sender: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'senderModel'
    },
    senderModel: {
        type: String,
        required: true,
        enum: ['User', 'Girls']
    },
    messageType: {
        type: String,
        required: true,
        enum: ['text', 'image', 'audio']
    },
    // For text messages
    text: {
        type: String,
        default: null
    },
    // For image and audio messages (ImageKit URL)
    fileUrl: {
        type: String,
        default: null
    },
    // ImageKit fileId — needed for deletion
    fileId: {
        type: String,
        default: null
    }
}, { timestamps: true });

const Message = model('Message', messageSchema);
export default Message;