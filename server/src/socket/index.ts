import { redis } from "../config/redis.js";
import type { IOrder } from "../models/order.model.js";

// Vercel-safe publisher: publishes events to Redis channel instead of local memory sockets
export const emitOrderCreated = async (shopId: string, order: IOrder): Promise<void> => {
  const payload = JSON.stringify({
    event: "ORDER_CREATED",
    data: {
      orderId: String(order._id),
      totalPrice: order.totalPrice,
      createdAt: order.createdAt ?? new Date(),
    },
  });

  // Publish to Redis channel targeted at this shop
  await redis.publish(`shop_channel_${shopId}`, payload);
};