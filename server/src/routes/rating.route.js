import {Router} from "express";
import {
    createRating,
    checkRating,
    getRatingsForUser,
    getAllRatings,
    deleteRating
} from "../controllers/rating.controller.js";
import { verifyUser } from "../middlewares/user.middleware.js";

const router = Router();

router.route('/create').post(verifyUser, createRating);
router.route('/check').post(verifyUser, checkRating);
router.route('/user/:userId').get(getRatingsForUser);
router.route('/all').get(getAllRatings);
router.route('/delete/:ratingId').delete(verifyUser, deleteRating);

export default router;
