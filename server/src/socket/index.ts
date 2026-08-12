import type { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env.js";
import { redis } from "../config/redis.js";
import type { IOrder } from "../models/order.model.js";

// Module-level singleton: on Vercel Fluid Compute a warm instance is reused
// across invocations, so this survives between the REST request that
// creates the order and the WebSocket connection the seller already holds.
let ioInstance: SocketIOServer | null = null;

function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }
  return undefined;
}

// Identity is derived only from the seller's own httpOnly cookie + Redis
// session (the same trust chain isSeller uses for REST) — never trusted
// from anything the client sends in the handshake payload.
async function authenticateSeller(socket: Socket): Promise<string | null> {
  try {
    const sellerToken = readCookie(socket.handshake.headers.cookie, "seller_token");
    if (!sellerToken) return null;

    const decoded = jwt.verify(sellerToken, env.jwtSecretKey) as JwtPayload;
    if (!decoded?.id) return null;

    const sessionRaw = await redis.get(`seller_${decoded.id}`);
    if (!sessionRaw) return null;

    return String(decoded.id);
  } catch {
    return null;
  }
}

export const initSocketServer = (server: HttpServer): SocketIOServer => {
  if (ioInstance) {
    return ioInstance;
  }

  const io = new SocketIOServer(server, {
    cors: {
      origin: env.allowedOrigins,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const sellerId = await authenticateSeller(socket);
    if (!sellerId) {
      return next(new Error("Unauthorized"));
    }
    socket.data.sellerId = sellerId;
    next();
  });

  io.on("connection", (socket) => {
    // Room-per-seller: survives reconnects/multiple tabs and lets the
    // order controller target the right seller without tracking socket ids.
    socket.join(`seller_${socket.data.sellerId}`);
  });

  ioInstance = io;
  return io;
};

export const emitOrderCreated = (shopId: string, order: IOrder): void => {
  if (!ioInstance) return;
  ioInstance.to(`seller_${shopId}`).emit("ORDER_CREATED", {
    orderId: String(order._id),
    totalPrice: order.totalPrice,
    createdAt: order.createdAt ?? new Date(),
  });
};