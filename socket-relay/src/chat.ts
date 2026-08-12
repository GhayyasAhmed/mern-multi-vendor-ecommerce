import type { AppSocket } from "./types.js";

export function registerChatHandlers(socket: AppSocket): void {
  const identityId = socket.data.identity.id;

  socket.on("messageSeen", ({ receiverId, messageId }) => {
    if (!receiverId || !messageId) return;
    socket.to(receiverId).emit("messageSeen", {
      senderId: identityId,
      receiverId,
      messageId,
    });
  });
}