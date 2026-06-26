import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from '../utils/apiError.js';
import User from '../models/user.model.js';
import Report from '../models/report.model.js';

const createReport = asyncHandler(async (req, res) => {
    const { reportedUserId, reason } = req.body;
    if (!reportedUserId || !reason) {
        throw new ApiError(400, 'reportedUserId and reason are required');
    }

    const reporterId = req.user._id;
    const reporterModel = req.userType === 'girl' ? 'Girls' : 'User';

    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
        throw new ApiError(404, 'Reported user not found');
    }

    const report = await Report.create({
        reportedBy: reporterId,
        reportedUser: reportedUserId,
        userModel: reporterModel,
        reason
    });

    return res.status(201).json(
        new ApiResponse(201, report, 'Report created successfully')
    );
})

const getReports = asyncHandler(async (req, res) => {
    const reports = await Report.aggregate([
        {
            $lookup: {
                from: 'users',
                localField: 'reportedBy',
                foreignField: '_id',
                as: 'reporter'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'reportedUser',
                foreignField: '_id',
                as: 'reportedUser'
            }
        },
        {
            $unwind: '$reporter'
        },
        {
            $unwind: '$reportedUser'
        },
        {
            $project: {
                _id: 1,
                reason: 1,
                reporter: {
                    _id: 1,
                    name: 1,
                    email: 1
                },
                reportedUser: {
                    _id: 1,
                    name: 1,
                    email: 1
                }
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200, reports, 'Reports fetched successfully')
    );
})

const deleteReport = asyncHandler(async (req, res) => {
    const { reportId } = req.params;
    if (!reportId) {
        throw new ApiError(400, 'reportId is required');
    }
    const report = await Report.findByIdAndDelete(reportId);
    if (!report) {
        throw new ApiError(404, 'Report not found');
    }
    return res.status(200).json(
        new ApiResponse(200, report, 'Report deleted successfully')
    );
})

export {
    createReport,
    getReports,
    deleteReport
}