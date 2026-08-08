import { io, type Socket } from "socket.io-client";
import { env } from "@/config/env";

let socket: Socket | null = null;
let socketConfigWarningLogged = false;

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

// The Socket.IO backend requires a persistent server process (Render) — it
// cannot run on Vercel serverless functions, which have no long-lived
// process to hold WebSocket/long-polling sessions. NEXT_PUBLIC_SOCKET_URL
// must be set to that persistent origin (not a serverless/Vercel URL, and
// not a relative path, since sockets connect cross-origin directly rather
// than through the Next.js cookie-forwarding rewrite).
export function isSocketConfigured(): boolean {
  return Boolean(env.socketUrl && !env.socketUrl.startsWith("/"));
}

export function getSocket(): Socket {
  if (!socket) {
    if (!isSocketConfigured()) {
      if (!socketConfigWarningLogged) {
        socketConfigWarningLogged = true;
        console.error(
          "NEXT_PUBLIC_SOCKET_URL is missing or invalid. Real-time features " +
            "(chat, notifications, presence) are disabled. It must point to " +
            "the persistent backend origin (e.g. the Render deployment)."
        );
      }
      // A disabled, never-connecting socket keeps the Socket interface
      // usable (on/off/emit/connect are all safe no-ops here) so consuming
      // components render normally instead of crashing.
      socket = io("http://localhost:0", {
        autoConnect: false,
        reconnection: false,
      });
      return socket;
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