import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from '../utils/apiError.js';
import User from '../models/user.model.js';
import Girls from '../models/girls.model.js';
import Rating from '../models/rating.model.js';
import Followers from '../models/followers.model.js';

const getLeaderboard = asyncHandler(async (req, res) => {
    const { userType } = req.params;
    if (!userType || !['boy', 'girl'].includes(userType.toLowerCase())) {
        throw new ApiError(400, "userType query param must be 'boy' or 'girl'");
    }

    if (userType.toLowerCase() === 'girl') {
        const leaderboard = await Girls.aggregate([
            { $match: { applicationStatus: 'accepted' } },
            {
                $lookup: {
                    from: 'followers',
                    let: { girlId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$following', '$$girlId'] },
                                        { $eq: ['$followingModel', 'Girls'] }
                                    ]
                                }
                            }
                        },
                        { $count: 'count' }
                    ],
                    as: 'followerData'
                }
            },
            {
                $lookup: {
                    from: 'ratings',
                    let: { girlId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$ratedUser', '$$girlId'] },
                                        { $eq: ['$ratedUserModel', 'Girls'] }
                                    ]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalRatingSum: { $sum: '$rating' },
                                ratingCount: { $sum: 1 }
                            }
                        }
                    ],
                    as: 'ratingData'
                }
            },
            {
                $addFields: {
                    followersCount: { $ifNull: [{ $arrayElemAt: ['$followerData.count', 0] }, 0] },
                    ratingCount: { $ifNull: [{ $arrayElemAt: ['$ratingData.ratingCount', 0] }, 0] },
                    totalRatingSum: { $ifNull: [{ $arrayElemAt: ['$ratingData.totalRatingSum', 0] }, 0] }
                }
            },
            {
                $addFields: {
                    averageRating: {
                        $cond: [
                            { $eq: ['$ratingCount', 0] },
                            0,
                            { $divide: ['$totalRatingSum', '$ratingCount'] }
                        ]
                    },
                    leaderboardScore: { $add: ['$followersCount', '$totalRatingSum'] }
                }
            },
            { $sort: { leaderboardScore: -1 } },
            { $limit: 10 },
            {
                $project: {
                    _id: 1,
                    fullName: 1,
                    imageUrl: 1,
                    userBio: 1,
                    gender: '$userType',
                    followersCount: 1,
                    ratingCount: 1,
                    averageRating: { $round: ['$averageRating', 1] }
                }
            }
        ]);

        return res.status(200).json(
            new ApiResponse(200, leaderboard, "Girls leaderboard fetched successfully")
        );
    }

    const leaderboard = await User.aggregate([
        { $match: { userType: 'Boy' } },
        {
            $lookup: {
                from: 'ratings',
                let: { userId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$ratedUser', '$$userId'] },
                                    { $eq: ['$ratedUserModel', 'User'] }
                                ]
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalRatingSum: { $sum: '$rating' },
                            ratingCount: { $sum: 1 }
                        }
                    }
                ],
                as: 'ratingData'
            }
        },
        {
            $addFields: {
                ratingCount: { $ifNull: [{ $arrayElemAt: ['$ratingData.ratingCount', 0] }, 0] },
                totalRatingSum: { $ifNull: [{ $arrayElemAt: ['$ratingData.totalRatingSum', 0] }, 0] }
            }
        },
        {
            $addFields: {
                ratingScore: { $multiply: ['$totalRatingSum', 2] }
            }
        },
        { $sort: { ratingScore: -1 } },
        { $limit: 10 },
        {
            $project: {
                _id: 1,
                fullName: 1,
                imageUrl: 1,
                gender: '$userType',
                ratingCount: 1,
                ratingScore: 1
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, leaderboard, "Boys leaderboard fetched successfully")
    );
})

export { getLeaderboard };