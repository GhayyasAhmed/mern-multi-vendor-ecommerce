import http from "http";
import mongoose from "mongoose";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { redis } from "./config/redis.js";
// import { initSocketServer } from "./socketServer.js";

const server = http.createServer(app);
// initSocketServer(server);

console.log(
  "Connecting to Mongo URI:",
  env.mongoUri.replace(/:([^@]+)@/, ":****@")
);

process.on("unhandledRejection", (reason: any) => {
  console.error("Unhandled promise rejection:", reason?.message || reason);
});

process.on("uncaughtException", (error: Error) => {
  console.error("Uncaught exception:", error.message);
  process.exit(1);
});


function shutdown(signal: string) {
  console.log(`${signal} received. Shutting down gracefully.`);
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));


// let server: http.Server | undefined;

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
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((err) => (err ? reject(err) : resolve()));
      });
      console.log("HTTP server closed. No longer accepting new requests.");
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


void startServer();