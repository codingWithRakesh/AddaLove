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
    phoneNo: {
        type: String,
        require: true,
    },
    age: {
        type: String,
        require: true,
    },
    
})