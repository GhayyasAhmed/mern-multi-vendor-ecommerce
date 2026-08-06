import type { AppSocket } from "./types.js";


export function getIdentityId(socket: AppSocket): string {
  const id = socket.data.user?._id ?? socket.data.seller?._id;
  if (!id) {
    throw new Error("Socket is not authenticated");
  }
  return id.toString();
}