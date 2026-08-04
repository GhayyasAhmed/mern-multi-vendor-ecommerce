import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import connectCloudinary from "./config/cloudinary.js";
import { env } from "./config/env.js";
import { redis } from "./config/redis.js";
import errorMiddleware from "./middlewares/error.js";
import { apiLimiter } from "./middlewares/rateLimiter.js";
import conversationRouter from "./routes/conversation.routes.js";
import couponCodeRouter from "./routes/couponCode.routes.js";
import eventRouter from "./routes/event.routes.js";
import messageRouter from "./routes/message.routes.js";
import orderRouter from "./routes/order.routes.js";
import productRouter from "./routes/product.routes.js";
import shopRouter from "./routes/shop.routes.js";
import userRouter from "./routes/user.routes.js";
import withdrawRouter from "./routes/withdraw.routes.js";
import paymentRouter from "./routes/payment.routes.js";


const app = express();

if (env.nodeEnv === "production") {
  app.set("trust proxy", 1);
}

connectCloudinary();

app.use((helmet as any)());
app.use(
  cors({
    origin: env.allowedOrigins,
    credentials: true,
  })
);
app.use(apiLimiter);
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());


// Lightweight CSRF mitigation: auth cookies use sameSite:"none" to support
// a separate frontend origin, so state-changing requests must be verified
// against an allowed origin. Requests using the Authorization header
// (non-cookie flow) are exempt, since only browsers auto-attach cookies
// cross-site — bearer-token clients are not CSRF-exposed.
app.use((req, res, next) => {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method) || req.headers.authorization) {
    return next();
  }
  const origin = req.headers.origin;
  if (!origin || !env.allowedOrigins.includes(origin)) {
    return res.status(403).json({
      success: false,
      message: "Request origin not allowed",
    });
  }
  return next();
});

// API Routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/shop", shopRouter);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/event", eventRouter);
app.use("/api/v1/conversation", conversationRouter);
app.use("/api/v1/coupon-code", couponCodeRouter);
app.use("/api/v1/message", messageRouter);
app.use("/api/v1/withdraw", withdrawRouter);
app.use("/api/v1/payment", paymentRouter);

app.get("/api/v1/health-check", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const isRedisReady = redis.status === "ready";
  const isHealthy = isDbConnected && isRedisReady;

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? "ok" : "unavailable",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    services: {
      db: isDbConnected ? "connected" : "disconnected",
      redis: isRedisReady ? "connected" : "disconnected",
    },
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorMiddleware);

export default app;