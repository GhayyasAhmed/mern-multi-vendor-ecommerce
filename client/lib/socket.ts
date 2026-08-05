import { io, type Socket } from "socket.io-client";
import { env } from "@/config/env";

let socket: Socket | null = null;

/**
 * Returns a singleton socket connection. Auth is cookie-based (same
 * accessToken/seller_token cookies used by the REST API), matching
 * server/src/socket/auth.ts — no client-side token handling needed.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(env.socketUrl, {
      withCredentials: true,
      autoConnect: false,
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}