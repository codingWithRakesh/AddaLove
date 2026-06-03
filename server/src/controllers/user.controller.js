import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiResponse } from "../utils/ApiResponse.js";
const sendOtp = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, null, "Hello"))
})

export  { sendOtp };