export const APP_NAME = "Multi Vendor Ecommerce";

export const ROLES = {
  USER: "user",
  SELLER: "Seller",
  ADMIN: "admin",
} as const;

export const SOCKET_EVENTS = {
  SEND_MESSAGE: "sendMessage",
  GET_MESSAGE: "getMessage",
  MESSAGE_SEEN: "messageSeen",
  UPDATE_LAST_MESSAGE: "updateLastMessage",
  GET_LAST_MESSAGE: "getLastMessage",
  GET_USERS: "getUsers",
} as const;