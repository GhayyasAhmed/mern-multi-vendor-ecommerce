import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { IProduct } from "@/types";

export type CartItemKind = "product" | "event";

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  qty: number;
  stock: number;
  shopId: string;
  shopName?: string;
  kind: CartItemKind;
}

interface CartState {
  items: CartItem[];
  hydrated: boolean;
   userId: string | null;
}

const CART_STORAGE_PREFIX = "mve_cart_v1";

function getCartStorageKey(userId: string | null): string {
  return userId ? `${CART_STORAGE_PREFIX}_u_${userId}` : `${CART_STORAGE_PREFIX}_guest`;
}

const initialState: CartState = {
  items: [],
  hydrated: false,
  userId: null,
};

function readFromStorage(userId: string | null): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(getCartStorageKey(userId));
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeToStorage(userId: string | null, items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getCartStorageKey(userId), JSON.stringify(items));
  } catch {
    // storage unavailable (private mode, quota) — cart still works in-memory
  }
}

export function productToCartItem(
  product: IProduct,
  qty: number,
  kind: CartItemKind = "product"
): CartItem {
  return {
    productId: product._id,
    name: product.name,
    image: product.images?.[0]?.url || "/placeholder.png",
    price: product.discountPrice,
    originalPrice: product.originalPrice,
    qty,
    stock: product.stock,
    shopId: product.shopId || product.shop?._id || "",
    shopName: product.shop?.name,
    kind,
  };
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // Initial guest-scoped load on app mount, before identity is known.
    hydrate(state) {
      state.items = readFromStorage(state.userId);
      state.hydrated = true;
    },
    // Called whenever the authenticated identity changes (login, logout,
    // or switching to a different account on the same device). Each
    // mutation below already writes under the previous userId's key, so
    // this just swaps in the new identity's own cart.
    switchUser(state, action: PayloadAction<{ userId: string | null }>) {
      if (state.userId === action.payload.userId) {
        return;
      }
      state.userId = action.payload.userId;
      state.items = readFromStorage(state.userId);
      state.hydrated = true;
    },
    addItem(state, action: PayloadAction<{ item: CartItem }>) {
      const { item } = action.payload;
      const existing = state.items.find((i) => i.productId === item.productId);
      if (existing) {
        const cap = existing.stock > 0 ? existing.stock : item.qty;
        existing.qty = Math.min(existing.qty + item.qty, cap);
      } else {
        const cap = item.stock > 0 ? item.stock : item.qty;
        state.items.push({ ...item, qty: Math.min(item.qty, cap) });
      }
      writeToStorage(state.userId, state.items);
    },
    removeItem(state, action: PayloadAction<{ productId: string }>) {
      state.items = state.items.filter((i) => i.productId !== action.payload.productId);
      writeToStorage(state.userId, state.items);
    },
    updateQty(state, action: PayloadAction<{ productId: string; qty: number }>) {
      const item = state.items.find((i) => i.productId === action.payload.productId);
      if (item) {
        const maxQty = item.stock > 0 ? item.stock : action.payload.qty;
        item.qty = Math.min(Math.max(action.payload.qty, 1), maxQty);
      }
      writeToStorage(state.userId, state.items);
    },
    // Applies freshly-fetched stock/price for one cart line (used after a
    // checkAvailability revalidation), clamping qty to the new stock.
    syncItemAvailability(
      state,
      action: PayloadAction<{ productId: string; stock: number; price?: number; missing?: boolean }>
    ) {
      const { productId, stock, price, missing } = action.payload;
      if (missing) {
        state.items = state.items.filter((i) => i.productId !== productId);
        writeToStorage(state.userId, state.items);
        return;
      }
      const item = state.items.find((i) => i.productId === productId);
      if (item) {
        item.stock = stock;
        if (price !== undefined) item.price = price;
        if (stock > 0) {
          item.qty = Math.min(item.qty, stock);
        }
      }
      writeToStorage(state.userId, state.items);
    },
    clearCart(state) {
      state.items = [];
      writeToStorage(state.userId, state.items);
    },
  },
});

export const {
  hydrate,
  switchUser,
  addItem,
  removeItem,
  updateQty,
  syncItemAvailability,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;

export const selectCartItems = (state: { cart: CartState }) => state.cart.items;

export const selectCartCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, item) => sum + item.qty, 0);

export const selectCartSubtotal = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, item) => sum + item.price * item.qty, 0);

export const selectCartGroupedByShop = (state: { cart: CartState }) => {
  const groups = new Map<string, { shopId: string; shopName?: string; items: CartItem[] }>();
  for (const item of state.cart.items) {
    if (!groups.has(item.shopId)) {
      groups.set(item.shopId, { shopId: item.shopId, shopName: item.shopName, items: [] });
    }
    groups.get(item.shopId)!.items.push(item);
  }
  return Array.from(groups.values());
};