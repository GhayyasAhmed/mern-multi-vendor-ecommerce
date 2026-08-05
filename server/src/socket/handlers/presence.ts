import type { AppSocket, AppSocketServer } from "../types.js";
import { getIdentityId } from "../utils.js";

/**
 * userId -> set of active socket ids. A Set (vs. the reference
 * implementation's single-socket array) correctly supports one user being
 * connected from multiple tabs/devices at once.
 */
const onlineUsers = new Map<string, Set<string>>();

function addOnlineSocket(userId: string, socketId: string): boolean {
  const existing = onlineUsers.get(userId);
  if (existing) {
    existing.add(socketId);
    return false; // already online
  }
  onlineUsers.set(userId, new Set([socketId]));
  return true; // just came online
}

function removeOnlineSocket(userId: string, socketId: string): boolean {
  const existing = onlineUsers.get(userId);
  if (!existing) return false;

  existing.delete(socketId);
  if (existing.size === 0) {
    onlineUsers.delete(userId);
    return true; // just went offline
  }
  return false;
}

function getOnlineUserIds(): string[] {
  return Array.from(onlineUsers.keys());
}

export function registerPresenceHandlers(io: AppSocketServer, socket: AppSocket): void {
  const identityId = getIdentityId(socket);

  // All sockets for this identity share a room, so chat handlers can reach
  // every open tab/device with a single emit instead of tracking raw ids.
  socket.join(identityId);

  if (addOnlineSocket(identityId, socket.id)) {
    io.emit("getUsers", getOnlineUserIds());
  }

  socket.on("disconnect", () => {
    if (removeOnlineSocket(identityId, socket.id)) {
      io.emit("getUsers", getOnlineUserIds());
    }
  });
}