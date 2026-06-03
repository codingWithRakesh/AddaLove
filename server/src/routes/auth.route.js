import express from 'express';
import {sendOtp} from "../controllers/user.controller.js"
const AuthRoute= express.Router();

AuthRoute.post('/send-otp',sendOtp);


export default AuthRoute;