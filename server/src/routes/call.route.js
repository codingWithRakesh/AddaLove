import {Router} from 'express';
import {
    createRoom,
    getRoomDetails,
    getCallHistory,
    getActiveRoom
} from '../controllers/call.controller.js';
import { verifyUser } from '../middlewares/user.middleware.js';

const router = Router();

router.route("/create").post(verifyUser, createRoom)
router.route("/room/:roomId").get(getRoomDetails)
router.route("/history/user").get(verifyUser, getCallHistory)
router.route("/history/girl").get(verifyUser, getCallHistory)
router.route("/active").get(verifyUser, getActiveRoom)

export default router;