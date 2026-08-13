export type SocketRole = "user" | "seller" | "admin";

export interface SocketIdentity {
  role: SocketRole;
  id: string;
  name: string;
  avatar?: string;
}

export interface MessageImagePayload {
  public_id?: string;
  url?: string;
}

export interface SocketMessagePayload {
  _id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text?: string;
  images?: MessageImagePayload;
  seen: boolean;
  createdAt: string;
}

export interface LastMessagePayload {
  conversationId: string;
  lastMessage: string;
  lastMessageId: string;
  updatedAt: string;
}

export interface MessageSeenPayload {
  senderId: string;
  receiverId: string;
  messageId: string;
}

export interface NotificationPayload {
  _id: string;
  type: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}