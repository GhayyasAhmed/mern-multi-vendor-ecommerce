import type {
  AppSocket,
  AppSocketServer,
  SendMessagePayload,
  UpdateLastMessagePayload,
  SocketMessage,
} from "../types.js";
import { getIdentityId } from "../utils.js";

export function registerChatHandlers(io: AppSocketServer, socket: AppSocket): void {
  const identityId = getIdentityId(socket);

  socket.on("sendMessage", ({ receiverId, text, images }: SendMessagePayload) => {
    const message: SocketMessage = {
      senderId: identityId,
      receiverId,
      text,
      images,
      seen: false,
      createdAt: new Date().toISOString(),
    };

    // Room name === userId (joined in presence handler): reaches every
    // device the receiver has open, and simply no-ops if they're offline
    // instead of the reference implementation's global broadcast.
    io.to(receiverId).emit("getMessage", message);
  });

  socket.on("messageSeen", ({ senderId, messageId }) => {
    // The viewer is always the authenticated socket, never a client-
    // supplied value — prevents spoofing "X saw this" on another user's behalf.
    io.to(senderId).emit("messageSeen", {
      senderId,
      receiverId: identityId,
      messageId,
    });
  });

  socket.on("updateLastMessage", ({ receiverId, lastMessage, lastMessageId }: UpdateLastMessagePayload) => {
    // Scoped to the two conversation participants instead of io.emit to
    // every connected socket.
    io.to(receiverId).to(identityId).emit("getLastMessage", {
      receiverId,
      lastMessage,
      lastMessageId,
    });
  });
}