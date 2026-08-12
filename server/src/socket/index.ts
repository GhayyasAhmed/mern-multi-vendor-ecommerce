// import type { Server as HttpServer } from "http";
// import { Server as SocketIOServer } from "socket.io";
// import { createAdapter } from "@socket.io/redis-adapter";
// import { env } from "../config/env.js";
// import { redis } from "../config/redis.js";
// import { socketAuthMiddleware } from "./auth.js";
// import { registerPresenceHandlers } from "./handlers/presence.js";
// import { registerChatHandlers } from "./handlers/chat.js";
// import type { AppSocketServer } from "./types.js";
// import { setSocketServer } from "./emitter.js";

import { Server as SocketIOServer } from "socket.io";
import http from "http";

// export function initSocketServer(httpServer: HttpServer): AppSocketServer {
//   const io: AppSocketServer = new SocketIOServer(httpServer, {
//     cors: {
//       origin: env.allowedOrigins,
//       credentials: true,
//     },
//   });

//   // Vercel can run multiple copies of the backend at once, and a given
//   // socket connection only lives on one of them. Without this, a
//   // notification emitted from the copy handling an HTTP request would
//   // never reach a user whose socket landed on a different copy.
//   const pubClient = redis.duplicate();
//   const subClient = redis.duplicate();
//   io.adapter(createAdapter(pubClient, subClient));

//   setSocketServer(io);

//   io.use(socketAuthMiddleware);

//   io.on("connection", (socket) => {
//     registerPresenceHandlers(io, socket);
//     registerChatHandlers(io, socket);
//   });

//   return io;
// }

export const initSocketServer = (server: http.Server) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("socket connected:", socket.id);

    socket.on("ping", (data) => {
      console.log("ping received", data);
      socket.emit("pong", {...data, new: true});
    });

    socket.on("disconnect", () => {
      console.log("socket disconnected:", socket.id);
    });
  });

  return io;

}