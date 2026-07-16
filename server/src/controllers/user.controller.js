import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiResponse } from "../utils/apiResponse.js";
import User from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { generateReferenceCode } from '../utils/referenceCodeGenFun.js'
import { generateApplicationId } from '../utils/applicationIdGenFuncation.js';
import OTP from '../models/otp.model.js';
import { uploadToImageKit, deleteFromImageKit } from "../utils/imageKit.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { options } from "../constants.js";
import sendemail from '../middlewares/sendotp.middleware.js';
import Girls from '../models/girls.model.js';
import mongoose from 'mongoose';
import { userRateCalculate } from '../utils/calculateUserRateAVG.js';
import axios from 'axios'
const sendOtp = asyncHandler(async (req, res) => {
    const { email, purpose } = req.body;
    if (!email) {
        throw new ApiError(400, 'Email not found')
    }
    const IsFristUser = await User.findOne({ email: email });
    const IsFristGirl = await Girls.findOne({ email: email });
    if (purpose !== 'forget-password' && (IsFristUser || IsFristGirl)) {
        throw new ApiError(400, 'Alreday Have a account with this email');
    }
    if (purpose === 'forget-password' && !IsFristUser && !IsFristGirl) {
        throw new ApiError(404, 'Invalid user email');
    }
    const otp = Math.floor((Math.random() * 1000000) + 1);
    const referenceCode = generateReferenceCode();
    const newotp = new OTP({
        OTPNO: otp,
        referenceCode: referenceCode,
    })
    await newotp.save();
    const sendmail = await sendemail(email, otp);
    return res.status(200).json(new ApiResponse(200, { referenceCode }, "Otp is send to your email"))
})


const messageOtpSend = asyncHandler(async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
        throw new ApiError(400, 'Number can not be empty')
    }
    const otpCount = await OTP.countDocuments({ phoneNumber });
    const IsFristUser = await User.findOne({ phoneNumber: phoneNumber }).lean();
    const IsFristGirl = await Girls.findOne({ phoneNumber: phoneNumber }).lean();
    if (otpCount >= 2) {
        throw new ApiError(429, 'OTP limit reached. Please try again after some time.');
    }
    if (IsFristUser || IsFristGirl) {
        throw new ApiError(400, 'Alreday Have a account with this phone number.');
    }
    const otp = Math.floor((Math.random() * 1000000) + 1);
    const response = await fetch("https://apitxt.com/api/sendOTP", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            authkey: process.env.APITXT_API_KEY,
            mobile: `91${Number(phoneNumber)}`,
            otp: otp.toString(),
        }),
    });
    const referenceCode = generateReferenceCode();
    const newotp = new OTP({
        OTPNO: otp,
        referenceCode: referenceCode,
        phoneNumber: phoneNumber
    })
    await newotp.save();
    const data = await response.json();
    console.log(data);
    return res.status(200).json(new ApiResponse(200, { referenceCode }, 'OTP Send successfully'))

})

const otpVerify = asyncHandler(async (req, res) => {
    const { otp, referenceCode } = req.body;
    const dbOtp = (
        await OTP.findOne(
            { referenceCode },
            { OTPNO: 1, _id: 0 }
        ).lean()
    )?.OTPNO;
    if (!dbOtp) {
        throw new ApiError(400, 'Invalid otp')
    }
    if (otp == dbOtp) {
        return res.status(200).json(new ApiResponse(200, null, "Otp Matched."))
    }

    throw new ApiError(400, 'Inavlid otp')

})

const register = asyncHandler(async (req, res) => {
    const { fullName, email, age, password, phoneNumber, bio } = req.body;
    if (!fullName || !phoneNumber || !age || !password) {
        throw new ApiError(400, 'All details are not found');
    }
    let uploadResult;
    if (req.file) {
        const { buffer, mimetype, originalname, size } = req.file;
        if (!buffer || !mimetype || !originalname || !size) {
            throw new ApiError(400, "Invalid file upload");
        }
        const fileName = originalname || `logo_${companyId}_${Date.now()}`;
        uploadResult = await uploadToImageKit(buffer, fileName);
        if (!uploadResult || !uploadResult.url || !uploadResult.fileId) {
            throw new ApiError(500, "Failed to upload logo");
        }
    }
    const slat = await bcrypt.genSalt(12);
    const haspass = await bcrypt.hash(password, slat);
    const newuser = new User({
        fullName,
        phoneNumber,
        email: email ? email : null,
        userBio: bio ? bio : null,
        age,
        imageUrl: uploadResult?.url || 'https://ik.imagekit.io/ufopzzlbh/p.jpeg',
        password: haspass
    })
    await newuser.save();
    return res.status(201).json(new ApiResponse(201, null, 'User account is created'))


})

const login = asyncHandler(async (req, res) => {
    const { phoneNumber, password } = req.body;
    if (!phoneNumber || !password) {
        throw new ApiError(400, 'All details are not found');
    }

    const userdata = await User.findOne({ phoneNumber }).lean();;
    if (!userdata) {
        throw new ApiError(400, "Invalid credential");
    }
    const varifyPassowrd = await bcrypt.compare(password, userdata.password);
    if (!varifyPassowrd) {
        throw new ApiError(400, 'Invalid credential')
    }
    const authToken = jwt.sign({
        userId: userdata._id,
        phoneNumber: userdata.phoneNumber,
        userType: userdata.userType
    }, process.env.JWT_SERECT)
    return res
        .status(200)
        .cookie("authToken", authToken, options)
        .json(
            new ApiResponse(200, null, "User logged in successfully")
        )

})

const girlRegister = asyncHandler(async (req, res) => {
    const { fullName, email, age, password, bio, phoneNumber } = req.body;
    if (!fullName || !phoneNumber || !age || !password) {
        throw new ApiError(400, 'All details are not found');
    }
    let uploadResult;
    if (req.file) {
        const { buffer, mimetype, originalname, size } = req.file;
        if (!buffer || !mimetype || !originalname || !size) {
            throw new ApiError(400, "Invalid file upload");
        }
        const fileName = originalname || `logo_${companyId}_${Date.now()}`;
        uploadResult = await uploadToImageKit(buffer, fileName);
        if (!uploadResult || !uploadResult.url || !uploadResult.fileId) {
            throw new ApiError(500, "Failed to upload logo");
        }
    }
    const slat = await bcrypt.genSalt(12);
    const haspass = await bcrypt.hash(password, slat);
    const newuser = new Girls({
        fullName,
        phoneNumber,
        email: email ? email : null,
        userBio: bio ? bio : null,
        age,
        imageUrl: uploadResult?.url || 'https://ik.imagekit.io/ufopzzlbh/p2.jpeg',
        password: haspass
    })
    await newuser.save();
    return res.status(201).json(new ApiResponse(201, { newuser }, 'User account is created'))

})

const girlVedioUpload = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    if (req.file) {
        const { buffer, mimetype, originalname, size } = req.file;
        if (!buffer || !mimetype || !originalname || !size) {
            throw new ApiError(400, "Invalid file upload");
        }
        const fileName = originalname || `logo_${companyId}_${Date.now()}`;
        const uploadResult = await uploadToImageKit(buffer, fileName);
        if (!uploadResult || !uploadResult.url || !uploadResult.fileId) {
            throw new ApiError(500, "Failed to upload logo");
        }
        const applicationId = generateApplicationId();

        const updateobject = {
            vedioUrl: uploadResult.url,
            applicationId: applicationId
        }
        await Girls.findByIdAndUpdate(userId, { $set: updateobject }, { new: true })
        return res.status(202).json(new ApiResponse(202, { applicationId }, "Application submitted successfully"))
    }

})

const checkApplicationStatus = asyncHandler(async (req, res) => {
    const { applicationId } = req.params;

    if (!applicationId) {
        throw new ApiError(400, 'Application ID is required');
    }

    const application = await Girls.findOne({ applicationId });

    if (!application) {
        throw new ApiError(404, 'Application not found');
    }

    return res.status(200).json(
        new ApiResponse(200, application, 'Application details retrieved successfully')
    );
});


const girlsLogin = asyncHandler(async (req, res) => {

    const { phoneNumber, password } = req.body;
    if (!phoneNumber || !password) {
        throw new ApiError(400, 'All details are not found');
    }

    const userdata = await Girls.findOne({ phoneNumber }).lean();;
    if (!userdata) {
        throw new ApiError(400, "Invalid credential");
    }
    if (userdata.applicationStatus == 'accepted') {
        const varifyPassowrd = await bcrypt.compare(password, userdata.password);
        if (!varifyPassowrd) {
            throw new ApiError(400, 'Invalid credential')
        }
        const authToken = jwt.sign({
            userId: userdata._id,
            phoneNumber: userdata.phoneNumber,
            userType: userdata.userType
        }, process.env.JWT_SERECT)
        return res
            .status(200)
            .cookie("authToken", authToken, options)
            .json(
                new ApiResponse(200, null, "User logged in successfully")
            )

    }
    throw new ApiError(400, 'Your account not accecpted yet.')
})

const currentUser = asyncHandler(async (req, res) => {

    if (req.userType == 'boy') {

        const user = await User.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup: {
                    from: "followers",
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$following", "$$userId"]
                                }
                            }
                        }
                    ],
                    as: "followers"
                }
            },
            {
                $lookup: {
                    from: "followers",
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$follower", "$$userId"]
                                }
                            }
                        }
                    ],
                    as: "following"
                }
            },
            {
                $addFields: {
                    followersCount: {
                        $size: "$followers"
                    },
                    followingCount: {
                        $size: "$following"
                    }
                }
            },
            {
                $project: {
                    password: 0,
                    followers: 0,
                    following: 0
                }
            }
        ]);
        const userRateAVG = await userRateCalculate(req.user._id);
        const userInfo = user[0];
        return res.status(200).json(
            new ApiResponse(
                200,
                { userInfo, userRateAVG },
                "Current user details retrieved successfully"
            )
        );
    }

    if (req.userType == 'girl') {

        const user = await Girls.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup: {
                    from: "followers",
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$following", "$$userId"]
                                }
                            }
                        }
                    ],
                    as: "followers"
                }
            },
            {
                $lookup: {
                    from: "followers",
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$follower", "$$userId"]
                                }
                            }
                        }
                    ],
                    as: "following"
                }
            },
            {
                $addFields: {
                    followersCount: {
                        $size: "$followers"
                    },
                    followingCount: {
                        $size: "$following"
                    }
                }
            },
            {
                $project: {
                    password: 0,
                    followers: 0,
                    following: 0
                }
            }
        ]);

        const userRateAVG = await userRateCalculate(req.user._id);
        const userInfo = user[0];
        return res.status(200).json(
            new ApiResponse(
                200,
                { userInfo, userRateAVG },
                "Current user details retrieved successfully"
            )
        );
    }

    throw new ApiError(401, "Unauthorized");
});

const logOut = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }
    res.clearCookie("authToken", options);
    return res.status(200).json(new ApiResponse(200, null, 'Logout done'))
})

const findUserDataForForgetPassword = asyncHandler(async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
        throw new ApiError(400, 'Phone number is required.')
    }
    const findTheUserDataBoy = await User.findOne({ phoneNumber }).lean();
    const findTheUserDataGirl = await Girls.findOne({ phoneNumber }).lean();
    if (!findTheUserDataBoy && !findTheUserDataGirl) {
        throw new ApiError(404, 'User not found')
    }
    if (findTheUserDataBoy) {
        return res.status(200).json(new ApiResponse(200, findTheUserDataBoy.email, 'Email retrive'))
    }
    if (findTheUserDataGirl) {
        return res.status(200).json(new ApiResponse(200, findTheUserDataGirl.email, 'Email retrive'))
    }

})
const forgetPassword = asyncHandler(async (req, res) => {

    const { newPassword, email } = req.body;
    if (!newPassword || !email) {
        throw new ApiError(400, 'All data not found')
    }
    const userDataBoy = await User.findOne({ email });
    const userDataGirl = await Girls.findOne({ email });
    if (!userDataBoy && !userDataGirl) {
        throw new ApiError(404, 'Invalid user email')
    }
    const slat = await bcrypt.genSalt(12);
    const haspass = await bcrypt.hash(newPassword, slat);
    if (userDataBoy) {

        await User.findByIdAndUpdate(userDataBoy._id, { $set: { password: haspass } }, { new: true })
        return res.status(200).json(new ApiResponse(200,null,'Password changed Successfully'))
    }
    if(userDataGirl){
        await Girls.findByIdAndUpdate(userDataGirl._id,{$set:{ password: haspass}}, { new: true })
        return res.status(200).json(new ApiResponse(200,null,'Password changed Successfully'))
    }

})

export {
    sendOtp,
    otpVerify,
    register,
    login,
    girlRegister,
    girlVedioUpload,
    checkApplicationStatus,
    girlsLogin,
    currentUser,
    logOut,
    messageOtpSend,
    findUserDataForForgetPassword,
    forgetPassword
};
