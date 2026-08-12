// import { redis } from "../../config/redis.js";
// import type { AppSocket, AppSocketServer } from "../types.js";
// import { getIdentityId } from "../utils.js";

// // Kept in Redis instead of a local Map: with multiple backend copies
// // running at once, "who is online" has to be shared, not per-copy memory.
// const ONLINE_COUNTS_KEY = "socket:online_counts";

// async function addOnlineSocket(userId: string): Promise<boolean> {
//   const count = await redis.hincrby(ONLINE_COUNTS_KEY, userId, 1);
//   return count === 1; // just came online
// }

// async function removeOnlineSocket(userId: string): Promise<boolean> {
//   const count = await redis.hincrby(ONLINE_COUNTS_KEY, userId, -1);
//   if (count <= 0) {
//     await redis.hdel(ONLINE_COUNTS_KEY, userId);
//     return true; // just went offline
//   }
//   return false;
// }

// async function getOnlineUserIds(): Promise<string[]> {
//   return redis.hkeys(ONLINE_COUNTS_KEY);
// }

// export function registerPresenceHandlers(io: AppSocketServer, socket: AppSocket): void {
//   const identityId = getIdentityId(socket);

//   socket.join(identityId);

//   addOnlineSocket(identityId)
//     .then((justCameOnline) => {
//       if (justCameOnline) {
//         return getOnlineUserIds().then((ids) => io.emit("getUsers", ids));
//       }
//     })
//     .catch((err) => console.error("presence: failed to mark online", err));

//   socket.on("disconnect", () => {
//     removeOnlineSocket(identityId)
//       .then((justWentOffline) => {
//         if (justWentOffline) {
//           return getOnlineUserIds().then((ids) => io.emit("getUsers", ids));
//         }
//       })
//       .catch((err) => console.error("presence: failed to mark offline", err));
//   });
// }