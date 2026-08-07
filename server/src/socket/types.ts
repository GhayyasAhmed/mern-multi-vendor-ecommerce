import type { Server as SocketIOServer, Socket as SocketIOSocket } from "socket.io";
import type { IUser } from "../models/user.model.js";
import type { IShop } from "../models/shop.model.js";

export type SocketRole = "user" | "seller";

export interface SocketData {
  role: SocketRole;
  user?: IUser;
  seller?: IShop;
}

export interface MessageImagePayload {
  public_id?: string;
  url?: string;
}

export interface SendMessagePayload {
  receiverId: string;
  text?: string;
  images?: MessageImagePayload;
}

export interface SocketMessage {
  senderId: string;
  receiverId: string;
  text?: string;
  images?: MessageImagePayload;
  seen: boolean;
  createdAt: string;
}

export interface MessageSeenPayload {
  senderId: string;
  receiverId: string;
  messageId: string;
}

export interface UpdateLastMessagePayload {
  receiverId: string;
  lastMessage: string;
  lastMessageId: string;
}

export interface ClientToServerEvents {
  sendMessage: (payload: SendMessagePayload) => void;
  messageSeen: (payload: Pick<MessageSeenPayload, "senderId" | "messageId">) => void;
  updateLastMessage: (payload: UpdateLastMessagePayload) => void;
}

export interface ServerToClientEvents {
  getUsers: (onlineUserIds: string[]) => void;
  getMessage: (message: SocketMessage) => void;
  messageSeen: (payload: MessageSeenPayload) => void;
  getLastMessage: (payload: UpdateLastMessagePayload) => void;
}

export type InterServerEvents = Record<string, never>;

export type AppSocketServer = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type AppSocket = SocketIOSocket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export interface NotificationPayload {
  _id: string;
  type: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface ServerToClientEvents {
  getUsers: (onlineUserIds: string[]) => void;
  getMessage: (message: SocketMessage) => void;
  messageSeen: (payload: MessageSeenPayload) => void;
  getLastMessage: (payload: UpdateLastMessagePayload) => void;
  notification: (payload: NotificationPayload) => void;
}