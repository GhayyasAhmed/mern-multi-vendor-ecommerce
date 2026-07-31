import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorMiddleware from "./middlewares/error.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

app.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running",
  });
});

app.use(errorMiddleware);

export default app;