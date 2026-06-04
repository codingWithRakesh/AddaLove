import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import User from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { generateReferenceCode } from '../utils/referenceCodeGenFun.js'
import OTP from '../models/otp.model.js';
const sendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new ApiError(400, 'Email not found')
    }
    const IsFristUser = await User.findOne({ email: email });
    if (IsFristUser) {
        throw new ApiError(400, 'Alreday Have a account with this email');
    }
    const otp = Math.floor((Math.random() * 1000000) + 1);
    const referenceCode = generateReferenceCode();
    const newotp= new OTP({
        OTPNO:otp,
        referenceCode:referenceCode,
    })
    await newotp.save();
    const sendmail = await sendemail(email, otp);
    return res.status(200).json(new ApiResponse(200, referenceCode, "Otp is send to your email"))
})

export { sendOtp };