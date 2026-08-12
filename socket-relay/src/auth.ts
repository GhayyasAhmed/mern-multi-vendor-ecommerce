import type { ExtendedError } from "socket.io";
import type { RedisClientType } from "redis";
import type { AppSocket, SocketIdentity } from "./types.js";

const TICKET_PREFIX = "socket_ticket:";

export function createSocketAuthMiddleware(redisClient: RedisClientType) {
  return async (socket: AppSocket, next: (err?: ExtendedError) => void): Promise<void> => {
    try {
      const ticket = socket.handshake.auth?.ticket as string | undefined;

      if (!ticket) {
        return next(new Error("Please login to access this resource"));
      }

      const key = `${TICKET_PREFIX}${ticket}`;
      const raw = await redisClient.get(key);

      if (!raw) {
        return next(new Error("Session expired. Please login again"));
      }

      await redisClient.del(key);

      const identity = JSON.parse(raw) as SocketIdentity;
      socket.data.identity = identity;

      return next();
    } catch {
      return next(new Error("Invalid or expired authentication"));
    }
  };
}