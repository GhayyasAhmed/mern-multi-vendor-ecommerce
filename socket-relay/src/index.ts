// socket-relay/src/index.ts
import { Server } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import "dotenv/config";

const PORT = process.env.PORT || 3001;
const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.error("Missing REDIS_URL environment variable.");
  process.exit(1);
}

const io = new Server(Number(PORT), {
  cors: {
    origin: process.env.FRONTEND_URL, // Or specify your Vercel frontend URL for security
    credentials: true,
  },
});

const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();

async function start() {
  await Promise.all([pubClient.connect(), subClient.connect()]);
  
  io.adapter(createAdapter(pubClient, subClient));
  console.log("Socket.IO Redis Adapter connected.");

  // Listen to messages published by your Express backend on Vercel
  subClient.pSubscribe("shop_channel_*", (message, channel) => {
    const shopId = channel.split("_")[2];
    try {
      const parsed = JSON.parse(message);
      io.to(`seller_${shopId}`).emit(parsed.event, parsed.data);
    } catch (err) {
      console.error("Failed to parse redis message", err);
    }
  });

  io.on("connection", (socket) => {
    // Read sellerId passed from frontend during connection handshake
    const sellerId = socket.handshake.auth?.sellerId;
    if (sellerId) {
      socket.join(`seller_${sellerId}`);
      console.log(`Seller connected: ${sellerId}`);
    }

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  console.log(`Socket relay server running on port ${PORT}`);
}

start().catch(console.error);