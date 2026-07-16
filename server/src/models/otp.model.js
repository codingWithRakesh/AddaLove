import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    OTPNO: {
        type: Number,
        required: true,
        trim: true
    },
    referenceCode: {
        type: String,
        required: true,
        trim: true
    },
    phoneNumber:{
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600 // 600 seconds = 10 minutes
    }
});

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;