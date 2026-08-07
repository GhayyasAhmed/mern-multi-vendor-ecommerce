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
  NOTIFICATION: "notification",
} as const;

// Single source of truth for product/event categories, mirrored on the
// server at server/src/constants/categories.ts. Keep both lists in sync.
export const PRODUCT_CATEGORIES = [
  "Computers and Laptops",
  "cosmetics and body care",
  "Accesories",
  "Cloths",
  "Shoes",
  "Gifts",
  "Pet Care",
  "Mobile and Tablets",
  "Music and Gaming",
  "Others",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];