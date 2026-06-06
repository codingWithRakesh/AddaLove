import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from '../models/user.model.js';
import jwt from "jsonwebtoken";

const verifyUser = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.authToken || req.header("Authorization")?.replace("Bearer ", "");
    console.log(token)
    if (!token) {
        throw new ApiError(401, "Unauthorized")
    }

    const decoded = jwt.verify(token, process.env.JWT_SERECT);
    console.log(decoded)

    const user = await User.findById(decoded?.userId).select("-password");
    if (!user) {
        throw new ApiError(401, "Unauthorized")
    }
    
    req.user = user
    next()
})

export { verifyUser }