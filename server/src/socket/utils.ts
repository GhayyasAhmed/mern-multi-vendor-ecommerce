import type { AppSocket } from "./types.js";

/**
 * Resolves the authenticated identity id (user or seller) for a socket.
 * Both roles share one id namespace for chat purposes, matching how
 * conversations already treat user/seller ids interchangeably.
 */
export function getIdentityId(socket: AppSocket): string {
  const id = socket.data.user?._id ?? socket.data.seller?._id;
  if (!id) {
    // Unreachable in practice: connection handlers only run after
    // socketAuthMiddleware has already populated socket.data.
    throw new Error("Socket is not authenticated");
  }
  return id.toString();
}