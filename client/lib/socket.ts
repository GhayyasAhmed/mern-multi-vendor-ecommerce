import { io, type Socket } from "socket.io-client";
import { env } from "@/config/env";

let socket: Socket | null = null;

async function fetchSocketTicket(): Promise<string> {
  const response = await fetch(`${env.apiUrl}/socket/ticket`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Could not authenticate real-time connection");
  }

  const data = (await response.json()) as { ticket?: string };
  if (!data.ticket) {
    throw new Error("Real-time connection ticket was not issued");
  }
  return data.ticket;
}

export function getSocket(): Socket {
  if (!socket) {
    if (!env.socketUrl || env.socketUrl.startsWith("/")) {
      throw new Error(
        "NEXT_PUBLIC_SOCKET_URL must be set to the API server's absolute URL"
      );
    }

    socket = io(env.socketUrl, {
      autoConnect: false,
      auth: (callback) => {
        fetchSocketTicket()
          .then((ticket) => callback({ ticket }))
          .catch(() => callback({}));
      },
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}