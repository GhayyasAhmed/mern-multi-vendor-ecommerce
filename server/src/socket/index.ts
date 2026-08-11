import type { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { env } from "../config/env.js";
import { redis } from "../config/redis.js";
import { socketAuthMiddleware } from "./auth.js";
import { registerPresenceHandlers } from "./handlers/presence.js";
import { registerChatHandlers } from "./handlers/chat.js";
import type { AppSocketServer } from "./types.js";
import { setSocketServer } from "./emitter.js";

export function initSocketServer(httpServer: HttpServer): AppSocketServer {
  const io: AppSocketServer = new SocketIOServer(httpServer, {
    cors: {
      origin: env.allowedOrigins,
      credentials: true,
    },
  });

  // Vercel can run multiple copies of the backend at once, and a given
  // socket connection only lives on one of them. Without this, a
  // notification emitted from the copy handling an HTTP request would
  // never reach a user whose socket landed on a different copy.
  const pubClient = redis.duplicate();
  const subClient = redis.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  setSocketServer(io);

  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    registerPresenceHandlers(io, socket);
    registerChatHandlers(io, socket);
  });

  return io;
}