import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiResponse } from "../utils/ApiResponse.js";
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
    const newotp = new OTP({
        OTPNO: otp,
        referenceCode: referenceCode,
    })
    await newotp.save();
    const sendmail = await sendemail(email, otp);
    return res.status(200).json(new ApiResponse(200, { referenceCode }, "Otp is send to your email"))
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
    const { fullName, email, age, password } = req.body;
    if (!fullName || !email || !age || !password) {
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
        email,
        age,
        imageUrl: uploadResult?.url || 'https://ik.imagekit.io/ufopzzlbh/p.jpeg',
        password: haspass
    })
    await newuser.save();
    return res.status(201).json(new ApiResponse(201, null, 'User account is created'))


})

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError(400, 'All details are not found');
    }

    const userdata = await User.findOne({ email: email }).lean();;
    if (!userdata) {
        throw new ApiError(400, "Invalid credential");
    }
    const varifyPassowrd = await bcrypt.compare(password, userdata.password);
    if (!varifyPassowrd) {
        throw new ApiError(400, 'Invalid credential')
    }
    const authToken = jwt.sign({
        userId: userdata._id,
        email: userdata.email,
        usertype: userdata.userType
    }, process.env.JWT_SERECT)
    return res
        .status(200)
        .cookie("authToken", authToken, options)
        .json(
            new ApiResponse(200, null, "User logged in successfully")
        )

})

const girlRegister = asyncHandler(async (req, res) => {
    const { fullName, email, age, password } = req.body;
    if (!fullName || !email || !age || !password) {
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
        email,
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

    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError(400, 'All details are not found');
    }

    const userdata = await Girls.findOne({ email: email }).lean();;
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
            email: userdata.email,
            usertype: userdata.userType
        }, process.env.JWT_SERECT)
        return res
            .status(200)
            .cookie("authToken", authToken, options)
            .json(
                new ApiResponse(200, null, "User logged in successfully")
            )

    }
    throw new ApiError(400,'Your account not accecpted yet.')


})
export { sendOtp, otpVerify, register, login, girlRegister, girlVedioUpload, checkApplicationStatus , girlsLogin };