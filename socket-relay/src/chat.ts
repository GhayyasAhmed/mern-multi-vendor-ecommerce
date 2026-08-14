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


  // socket.on("sendMessage", ({ receiverId, text }) => {
  //   if (!receiverId) return;
  //   socket.to(receiverId).emit("getMessage", {
  //     senderId: identityId,
  //     receiverId,
  //     text,
  //     seen: false,
  //     createdAt: new Date().toISOString(),
  //   });
  // });

  // socket.on("updateLastMessage", ({ receiverId, lastMessage, lastMessageId }) => {
  //   if (!receiverId) return;
  //   socket.to(receiverId).to(identityId).emit("getLastMessage", {
  //     receiverId,
  //     lastMessage,
  //     lastMessageId,
  //   });
  // });
}