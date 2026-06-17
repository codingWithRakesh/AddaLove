import {Router} from "express";
import {
    createRoom,
    destroyRoom,
    joinRoom,
    leaveRoom,
    getOpenRooms,
    getRoomMessages,
    getGirlHistory,
    getBoyHistory,
    getRoomDetails
} from "../controllers/room.controller.js";
import {
    sendMessage
} from "../controllers/message.controller.js";
import { verifyUser } from "../middlewares/user.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

//room routes
router.route("/create").post(verifyUser, createRoom);
router.route("/destroy/:roomId").delete(verifyUser, destroyRoom);
router.route("/join/:roomId").post(verifyUser, joinRoom);
router.route("/leave/:roomId").post(verifyUser, leaveRoom);
router.route("/openRooms").get(verifyUser, getOpenRooms);
router.route("/:roomId/details").get(verifyUser, getRoomDetails);

//message routes
router.route("/:roomId/messages").get(verifyUser, getRoomMessages);
router.route("/:roomId/message").post(verifyUser, upload.single('file'), sendMessage);

//history routes
router.route("/history/girl").get(verifyUser, getGirlHistory);
router.route("/history/boy").get(verifyUser, getBoyHistory);

export default router;