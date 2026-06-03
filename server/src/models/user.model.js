import mongoose from "mongoose"
const userSchema = new mongoose.Schema({
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
        default:'https://ik.imagekit.io/ufopzzlbh/p.jpeg'
    },
    role: {
        type: String,
        required: true,
        enum: ['User', 'Admin'],
        default:'User'
    },
    walletBlance:{
        type:Number,
        require:true,
        default:0
    },
    password:{
        type: String,
        require: true,

    }
},{ timestamps: true })

const User = mongoose.model("User", userSchema);
export default User;