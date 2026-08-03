import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import errorMiddleware from "./middlewares/error.js";
import userRouter from "./routes/user.routes.js";
import shopRouter from "./routes/shop.routes.js";
import connectCloudinary from "./config/cloudinary.js";
import { env } from "./config/env.js";

const app = express();

connectCloudinary();

app.use(helmet());
app.use(
  cors({
    origin: env.allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
// app.use("/", express.static("uploads"))

// API Routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/shop", shopRouter);

app.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running",
  });
});

app.use(errorMiddleware);

export default app;