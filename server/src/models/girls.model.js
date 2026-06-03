import mongoose, { model } from "mongoose"
const girlsSchema = new mongoose.Schema({
    fullName: {
        type: String,
        require: true,
        trim: true
    },
    email: {
        type: String,
        require: true,
        unique: true
    },
    age: {
        type: String,
        require: true,
    },
    imageUrl: {
        type: String,
        require: true,
        default: 'https://ik.imagekit.io/ufopzzlbh/p.jpeg'
    },
    vedioUrl: {
        type: String,
        require: true,
    },
    applicationStatus: {
        type: String,
        required: true,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    walletBlance: {
        type: Number,
        require: true,
        default: 0
    },
    password: {
        type: String,
        require: true,

    }
},{ timestamps: true });
const Girls= mongoose.model('Girls',girlsSchema);
export default Girls;
