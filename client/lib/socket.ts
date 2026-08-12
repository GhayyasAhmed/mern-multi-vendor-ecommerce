import { io, type Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

let socket: Socket | null = null;

export function isSocketConfigured(): boolean {
  return Boolean(SOCKET_URL);
}

async function fetchSocketTicket(): Promise<string> {
  const res = await fetch(`${API_URL}/socket/ticket`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Could not authenticate real-time connection");
  }
  const data = await res.json();
  return data.ticket as string;
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: false,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      auth: async (cb) => {
        try {
          const ticket = await fetchSocketTicket();
          cb({ ticket });
        } catch {
          cb({});
        }
      },
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected && !s.active) {
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}