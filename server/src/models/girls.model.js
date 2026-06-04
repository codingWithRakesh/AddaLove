import mongoose, { model } from "mongoose"
const girlsSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    age: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
        default: 'https://ik.imagekit.io/ufopzzlbh/p.jpeg'
    },
    vedioUrl: {
        type: String,
        required: true,
    },
    applicationStatus: {
        type: String,
        required: true,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    walletBlance: {
        type: Number,
        required: true,
        default: 0
    },
    password: {
        type: String,
        required: true,

    }
},{ timestamps: true });
const Girls= mongoose.model('Girls',girlsSchema);
export default Girls;
