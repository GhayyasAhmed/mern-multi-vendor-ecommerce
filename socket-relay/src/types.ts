import type { Server as SocketIOServer, Socket as SocketIOSocket } from "socket.io";

export type SocketRole = "user" | "seller";

export interface SocketIdentity {
    role: SocketRole;
    id: string;
    name: string;
    avatar?: string;
}

export interface SocketData {
    identity: SocketIdentity;
}

export interface ClientToServerEvents {
    messageSeen: (payload: { receiverId: string; messageId: string }) => void;
    sendMessage: (payload: { receiverId: string; text?: string }) => void;
    updateLastMessage: (payload: { receiverId: string; lastMessage: string; lastMessageId: string }) => void;
}

export interface ServerToClientEvents {
    getUsers: (onlineUserIds: string[]) => void;
    getMessage: (message: unknown) => void;
    getLastMessage: (payload: unknown) => void;
    messageSeen: (payload: { senderId: string; receiverId: string; messageId: string }) => void;
    notification: (payload: unknown) => void;
}

export interface ClientToServerEvents {
    messageSeen: (payload: { receiverId: string; messageId: string }) => void;
    sendMessage: (payload: { receiverId: string; text?: string }) => void;
    updateLastMessage: (payload: { receiverId: string; lastMessage: string; lastMessageId: string }) => void;
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