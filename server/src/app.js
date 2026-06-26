import "./configs/env.js";

import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express();

app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded())
app.use(express.static("public"))

//write api routes here
import errorHandler from "./middlewares/error.middleware.js";
import AuthRoute from "./routes/auth.route.js";
import WalletRoute from "./routes/wallet.route.js";
import roomRoute from "./routes/room.route.js";
import FollowersRoute from "./routes/follower.route.js";
import reportRouter from "./routes/report.route.js";
import ratingRouter from "./routes/rating.route.js";

app.use('/api/auth/v1',AuthRoute)
app.use('/api/rooms/v1',roomRoute);
app.use('/api/wallet/v1',WalletRoute);
app.use('/api/follower/v1', FollowersRoute)
app.use('/api/report/v1', reportRouter);
app.use('/api/rating/v1', ratingRouter);

app.use(errorHandler)

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to AddaLove API"
    })
})

export default app;
