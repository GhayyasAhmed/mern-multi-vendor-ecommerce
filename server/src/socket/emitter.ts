// import type { AppSocketServer, NotificationPayload } from "./types.js";

// let ioInstance: AppSocketServer | null = null;

// export function setSocketServer(io: AppSocketServer): void {
//   ioInstance = io;
// }

// export function emitNotification(recipientId: string, payload: NotificationPayload): void {
//   ioInstance?.to(recipientId).emit("notification", payload);
// }