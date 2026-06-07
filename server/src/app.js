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
import messageRoute from "./routes/message.route.js";
import callRoute from "./routes/call.route.js";
import WalletRoute from "./routes/wallet.route.js";

app.use('/api/auth/v1',AuthRoute)
app.use('/api/message/v1',messageRoute)
app.use('/api/calls/v1',callRoute)
app.use('/api/wallet/v1',WalletRoute);



app.use(errorHandler)

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to AddaLove API"
    })
})

export default app;
