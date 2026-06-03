import "./configs/env.js";

import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded())
app.use(express.static("public"))

//write api routes here
import errorHandler from "./middlewares/error.middleware.js";
import AuthRoute from "./routes/auth.route.js";

app.use(errorHandler)
app.use('/api/auth/v1',AuthRoute)

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to AddaLove API"
    })
})

export default app;
