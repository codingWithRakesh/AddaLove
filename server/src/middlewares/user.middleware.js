import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from '../models/user.model.js';
import Girls from '../models/girls.model.js';
import jwt from "jsonwebtoken";

const verifyUser = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.authToken || req.header("Authorization")?.replace("Bearer ", "");
    console.log(token)
    if (!token) {
        throw new ApiError(401, "Unauthorized")
    }

    const decoded = jwt.verify(token, process.env.JWT_SERECT);
    // console.log(decoded)

    if (decoded.userType.toLowerCase() === 'boy') {
        const user = await User.findById(decoded.userId).select('-password').lean();
        if (!user) {
            throw new ApiError(401, 'User not found');
        }
        req.user = user;
        req.userType = 'boy';
    } else if (decoded.userType.toLowerCase() === 'girl') {
        const girl = await Girls.findById(decoded.userId).select('-password').lean();
        if (!girl) {
            throw new ApiError(401, 'Girl not found');
        }   
        req.user = girl;
        req.userType = 'girl';
    } else {
        throw new ApiError(403, 'Invalid userType in token');
    }
    next()
})

export { verifyUser }