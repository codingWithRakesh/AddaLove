import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from '../utils/apiError.js';
import User from '../models/user.model.js';
import Rating from '../models/rating.model.js';

const createRating = asyncHandler(async (req, res) => {
    const { ratedUserId, rating } = req.body;
    if (!ratedUserId || !rating) {
        throw new ApiError(400, 'ratedUserId and rating are required');
    }

    const raterId = req.user._id;
    const raterModel = req.userType === 'girl' ? 'Girls' : 'User';

    const ratedUser = await User.findById(ratedUserId);
    if (!ratedUser) {
        throw new ApiError(404, 'Rated user not found');
    }

    const existingRating = await Rating.findOne({
        ratedBy: raterId,
        ratedUser: ratedUserId,
        userModel: raterModel
    });
    if (existingRating) {
        throw new ApiError(400, 'You have already rated this user');
    }

    const newRating = await Rating.create({
        ratedBy: raterId,
        ratedUser: ratedUserId,
        userModel: raterModel,
        rating
    });

    return res.status(201).json(new ApiResponse(201, newRating, 'Rating created successfully'));
});

const getRatingsForUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const ratings = await Rating.find({ ratedUser: userId }).populate('ratedBy', '-password').lean();
    return res.status(200).json(new ApiResponse(200, ratings, 'Ratings fetched successfully'));
})

const getAllRatings = asyncHandler(async (req, res) => {
    const ratings = await Rating.aggregate([
        {
            $lookup: {
                from: 'users',
                localField: 'ratedBy',
                foreignField: '_id',
                as: 'rater'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'ratedUser',
                foreignField: '_id',
                as: 'ratedUser'
            }
        },
        {
            $unwind: '$rater'
        },
        {
            $unwind: '$ratedUser'
        },
        {
            $project: {
                _id: 1,
                rating: 1,
                rater: 1,
                ratedUser: 1
            }
        }
    ])
    return res.status(200).json(new ApiResponse(200, ratings, 'All ratings fetched successfully'));
})

const deleteRating = asyncHandler(async (req, res) => {
    const { ratingId } = req.params;
    const rating = await Rating.findById(ratingId);
    if (!rating) {
        throw new ApiError(404, 'Rating not found');
    }
  
    await Rating.findByIdAndDelete(ratingId);
    return res.status(200).json(new ApiResponse(200, null, 'Rating deleted successfully'));
})

export {
    createRating,
    getRatingsForUser,
    getAllRatings,
    deleteRating
}