import mongoose from "mongoose"
const userSchema = new mongoose.Schema({
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
        default:'https://ik.imagekit.io/ufopzzlbh/p.jpeg'
    },
    walletBlance:{
        type:Number,
        require:true,
        default:0
    },
    password:{
        type: String,
        required: true,

    }
},{ timestamps: true })

const User = mongoose.model("User", userSchema);
export default User;