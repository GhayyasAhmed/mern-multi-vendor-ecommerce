import mongoose from "mongoose";
import { env } from "./env.js";

// Disable buffering globally so Mongoose immediately fails if not connected,
// rather than hanging for 10 seconds.
mongoose.set("bufferCommands", false);

let isConnected = false;

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const db = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout faster in production (5s)
      autoIndex: false, // Prevent performance hit on free tier Atlas
    });

    isConnected = true;
    console.log("MongoDB connected successfully");

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
      isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Reconnecting...");
      isConnected = false;
    });

    return db;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}