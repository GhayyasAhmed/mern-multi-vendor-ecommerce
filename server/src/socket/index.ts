import type { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { env } from "../config/env.js";
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

  setSocketServer(io);

  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    registerPresenceHandlers(io, socket);
    registerChatHandlers(io, socket);
  });

  return io;
}