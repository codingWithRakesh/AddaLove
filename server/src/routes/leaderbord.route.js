import { Router } from "express";
import { getLeaderboard } from "../controllers/leaderbord.controller.js";
import { verifyUser } from "../middlewares/user.middleware.js";

const router = Router();

router.get('/leaderboard/:userType', verifyUser, getLeaderboard);

export default router;