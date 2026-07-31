import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running",
  });
});

export default app;