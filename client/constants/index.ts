export const APP_NAME = "Mercovia";

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
  ORDER_STATUS_UPDATED: "orderStatusUpdated",
  SELLER_BALANCE_UPDATED: "sellerBalanceUpdated",
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

// export const NOTIFICATION_SOUND = "https://res.cloudinary.com/dasdrngo1/video/upload/v1715355770/notifications/mixkit-bubble-pop-up-alert-notification-2357_wbwviv.wav"
export const NOTIFICATION_SOUND = "https://res.cloudinary.com/hkiilsuh/video/upload/v1786640806/new-notification_zulm5o.mp3"

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];