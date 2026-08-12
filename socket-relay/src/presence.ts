import type { RedisClientType } from "redis";
import type { AppSocket, AppSocketServer } from "./types.js";

const ONLINE_COUNTS_KEY = "socket:online_counts";

export function createPresenceHandlers(io: AppSocketServer, redisClient: RedisClientType) {
  async function addOnlineSocket(userId: string): Promise<boolean> {
    const count = await redisClient.hIncrBy(ONLINE_COUNTS_KEY, userId, 1);
    return count === 1;
  }

  async function removeOnlineSocket(userId: string): Promise<boolean> {
    const count = await redisClient.hIncrBy(ONLINE_COUNTS_KEY, userId, -1);
    if (count <= 0) {
      await redisClient.hDel(ONLINE_COUNTS_KEY, userId);
      return true;
    }
    return false;
  }

  async function getOnlineUserIds(): Promise<string[]> {
    const map = await redisClient.hGetAll(ONLINE_COUNTS_KEY);
    return Object.keys(map);
  }

  return function registerPresenceHandlers(socket: AppSocket): void {
    const identityId = socket.data.identity.id;

    socket.join(identityId);

    addOnlineSocket(identityId)
      .then((justCameOnline) => {
        if (justCameOnline) {
          return getOnlineUserIds().then((ids) => io.emit("getUsers", ids));
        }
      })
      .catch((err) => console.error("presence: failed to mark online", err));

    getOnlineUserIds()
      .then((ids) => socket.emit("getUsers", ids))
      .catch(() => {});

    socket.on("disconnect", () => {
      removeOnlineSocket(identityId)
        .then((justWentOffline) => {
          if (justWentOffline) {
            return getOnlineUserIds().then((ids) => io.emit("getUsers", ids));
          }
        })
        .catch((err) => console.error("presence: failed to mark offline", err));
    });
  };
}