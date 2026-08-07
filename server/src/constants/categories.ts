// Single source of truth for product/event categories, mirrored on the
// client at client/constants/categories.ts. Keep both lists in sync.
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