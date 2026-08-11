import http from "http";
import mongoose from "mongoose";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { redis } from "./config/redis.js";
import { initSocketServer } from "./socket/index.js";

const server = http.createServer(app);
const io = initSocketServer(server);


process.on("unhandledRejection", (reason: any) => {
  console.error("Unhandled promise rejection:", reason?.message || reason);
});

process.on("uncaughtException", (error: Error) => {
  console.error("Uncaught exception:", error.message);
  process.exit(1);
});

async function startServer() {
  try {
    await connectDatabase();
    console.log(`Connected to MongoDB`);

    server.listen(env.port, () => {
      console.log(`Server is running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

let isShuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  console.log(`${signal} received. Starting graceful shutdown...`);

  try {
    if (io) {
      await new Promise<void>((resolve) => {
        io.close(() => resolve());
      });
      console.log("HTTP server and Socket.IO connections closed. No longer accepting new requests.");
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log("MongoDB connection closed.");
    }

    await redis.quit();
    console.log("Redis connection closed.");

    process.exit(0);
  } catch (error) {
    console.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
}

process.on("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});

// On Vercel there is no long-running process — the platform invokes this
// module per request/connection instead. Calling .listen() would do
// nothing useful there, so only start the traditional listener for local
// dev / a real persistent host, and hand the raw server to Vercel's
// WebSocket support otherwise.
if (!process.env.VERCEL) {
  void startServer();
}

export default server;