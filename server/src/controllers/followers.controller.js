import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from '../utils/apiError.js';
import Followers from '../models/followers.model.js';

const followSomeone = asyncHandler(async(req, res) => {
    const { profileUserId } = req.body;

    if (!profileUserId) {
        throw new ApiError(400, 'USer ID is required');
    }
    const newfollower = new Followers({
        follower: req.user._id,
        following: profileUserId,
    })
    await newfollower.save();
    return res.status(200).json(new ApiResponse(200, null, 'Following Done.'))
})
const checkFollowing = asyncHandler(async(req, res) => {
    const { profileUserId } = req.body;

    if (!profileUserId) {
        throw new ApiError(400, 'USer ID is required');
    }
    const isFollowing = await Followers.findOne({
        follower: req.user._id,
        following: profileUserId,
    });
    if (!isFollowing) {
        throw new ApiError(200, 'Not Follow')
    }
    return res.status(200).json(new ApiResponse(200, null, 'Follow'))
})


const countFollowers = asyncHandler(async(req, res) => {
    const followersCount = await Followers.countDocuments({
        following: req.user._id,
    });
    return res.status(200).json(new ApiResponse(200, followersCount, 'Follower count fetch Successfully'))
})
const countFollowing = asyncHandler(async(req, res) => {
    const followingCount = await Followers.countDocuments({
        follower: req.user._id,
    });
    return res.status(200).json(new ApiResponse(200, followingCount, 'Following count fetch Successfully'))
})

const unfollowSomeone = asyncHandler(async(req, res) => {
    const { profileUserId } = req.body;
    await Followers.findOneAndDelete({
        follower: req.user._id,
        following: profileUserId,
    });
    return res.status(200).json(new ApiResponse(200,null,'Unfollow Successfully'))
})

export{followSomeone,checkFollowing,countFollowers,countFollowing,unfollowSomeone};