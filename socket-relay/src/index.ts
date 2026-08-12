import { Server } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import "dotenv/config";
import { createSocketAuthMiddleware } from "./auth.js";
import { createPresenceHandlers } from "./presence.js";
import { registerChatHandlers } from "./chat.js";
import type {
  AppSocketServer,
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "./types.js";

const PORT = process.env.PORT || 3001;
const REDIS_URL = process.env.REDIS_URL;
const EVENTS_CHANNEL = "socket_events";

if (!REDIS_URL) {
  console.error("Missing REDIS_URL environment variable.");
  process.exit(1);
}

const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const io: AppSocketServer = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(Number(PORT), {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  },
});

const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();
const dataClient = pubClient.duplicate();

async function start() {
  await Promise.all([pubClient.connect(), subClient.connect(), dataClient.connect()]);

  io.adapter(createAdapter(pubClient, subClient));
  console.log("Socket.IO Redis Adapter connected.");

  io.use(createSocketAuthMiddleware(dataClient));

  const registerPresenceHandlers = createPresenceHandlers(io, dataClient);

  io.on("connection", (socket) => {
    console.log(
      `Socket connected: ${socket.id} (${socket.data.identity.role}:${socket.data.identity.id})`
    );

    registerPresenceHandlers(socket);
    registerChatHandlers(socket);

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  const eventsSubClient = pubClient.duplicate();
  await eventsSubClient.connect();
  await eventsSubClient.subscribe(EVENTS_CHANNEL, (message) => {
    try {
      const { identityId, event, payload } = JSON.parse(message) as {
        identityId: string;
        event: string;
        payload: unknown;
      };
      if (!identityId || !event) return;
      io.to(identityId).emit(event as any, payload as any);
    } catch (err) {
      console.error("Failed to parse relayed socket event", err);
    }
  });

  console.log(`Socket relay server running on port ${PORT}`);
}

start().catch((err) => {
  console.error("Failed to start socket relay", err);
  process.exit(1);
});