import express from 'express';
import {sendOtp,otpVerify,register,login,girlRegister, girlVedioUpload, checkApplicationStatus, girlsLogin, currentUser} from "../controllers/user.controller.js"
import {upload} from '../middlewares/multer.middleware.js'
import { verifyUser } from '../middlewares/user.middleware.js';
const AuthRoute= express.Router();

AuthRoute.post('/send-otp',sendOtp);
AuthRoute.post('/verify-otp',otpVerify)
AuthRoute.post('/register',upload.single('profilePhoto'),register)
AuthRoute.post('/login',login);
AuthRoute.post('/girl-register',upload.single('profilePhoto'),girlRegister);
AuthRoute.put('/girl-vedio',upload.single('girlVedio'),girlVedioUpload);
AuthRoute.get('/check-application/:applicationId', checkApplicationStatus);
AuthRoute.post('/girl-login',girlsLogin);
AuthRoute.get('/current-user', verifyUser, currentUser);

export default AuthRoute; 