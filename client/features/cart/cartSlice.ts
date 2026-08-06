import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { IProduct } from "@/types";

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
}

interface CartState {
  items: CartItem[];
  hydrated: boolean;
}

const CART_STORAGE_KEY = "mve_cart_v1";

const initialState: CartState = {
  items: [],
  hydrated: false,
};

function readFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeToStorage(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage unavailable (private mode, quota) — cart still works in-memory
  }
}

export function productToCartItem(product: IProduct, qty: number): CartItem {
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
  };
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    hydrate(state) {
      state.items = readFromStorage();
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
      writeToStorage(state.items);
    },
    removeItem(state, action: PayloadAction<{ productId: string }>) {
      state.items = state.items.filter((i) => i.productId !== action.payload.productId);
      writeToStorage(state.items);
    },
    updateQty(state, action: PayloadAction<{ productId: string; qty: number }>) {
      const item = state.items.find((i) => i.productId === action.payload.productId);
      if (item) {
        const maxQty = item.stock > 0 ? item.stock : action.payload.qty;
        item.qty = Math.min(Math.max(action.payload.qty, 1), maxQty);
      }
      writeToStorage(state.items);
    },
    clearCart(state) {
      state.items = [];
      writeToStorage(state.items);
    },
  },
});

export const { hydrate, addItem, removeItem, updateQty, clearCart } = cartSlice.actions;
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