"use client";

import { SOCKET_EVENTS } from "@/constants";
import { switchUser, syncItemAvailability } from "@/features/cart/cartSlice";
import { eventApiSlice } from "@/features/events/eventApiSlice";
import { orderApiSlice } from "@/features/orders/orderApiSlice";
import { productApiSlice } from "@/features/products/productApiSlice";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import type { RootState } from "@/store";
import { useAppDispatch } from "@/store/hooks";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useStore } from "react-redux";
import { useCurrentUser } from "../hooks/useCurrentUser";

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isSellerOnlyRoute = pathname?.startsWith("/seller") ?? false;

  const { user, isLoading } = useCurrentUser({ skip: isSellerOnlyRoute });
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();

  useEffect(() => {
    if (isSellerOnlyRoute) return;
    if (isLoading) return;
    dispatch(switchUser({ userId: user?._id ?? null }));
  }, [isSellerOnlyRoute, isLoading, user?._id, dispatch]);

  useEffect(() => {
    if (isSellerOnlyRoute) return;
    if (isLoading) return;
    if (user?._id) {
      connectSocket();
    } else {
      disconnectSocket();
    }
  }, [isSellerOnlyRoute, isLoading, user?._id]);

  // Real-time order status sync: patches cached order queries directly
  // (no refetch of the order list) whenever the seller changes an order's
  // status, so "My Orders" / order details stay in sync live.
  useEffect(() => {
    if (isSellerOnlyRoute || !user?._id) return;

    const socket = getSocket();
    const handleOrderStatusUpdated = (payload: {
      orderId: string;
      status: string;
      deliveredAt?: string;
    }) => {
      dispatch(
        orderApiSlice.util.updateQueryData(
          "getOrderById",
          payload.orderId,
          (draft) => {
            draft.order.status = payload.status;
            if (payload.deliveredAt)
              draft.order.deliveredAt = payload.deliveredAt;
          },
        ),
      );

      const cachedArgs = orderApiSlice.util.selectCachedArgsForQuery(
        store.getState(),
        "getMyOrders",
      );
      cachedArgs.forEach((arg) => {
        dispatch(
          orderApiSlice.util.updateQueryData("getMyOrders", arg, (draft) => {
            const order = draft.orders.find((o) => o._id === payload.orderId);
            if (order) {
              order.status = payload.status;
              if (payload.deliveredAt) order.deliveredAt = payload.deliveredAt;
            }
          }),
        );
      });
    };

    socket.on(SOCKET_EVENTS.ORDER_STATUS_UPDATED, handleOrderStatusUpdated);
    return () => {
      socket.off(SOCKET_EVENTS.ORDER_STATUS_UPDATED, handleOrderStatusUpdated);
    };
  }, [isSellerOnlyRoute, user?._id, dispatch, store]);

  useEffect(() => {
    if (isSellerOnlyRoute) return;
    if (!user?._id) return;

    const socket = getSocket();
    const handleStockUpdated = (payload: {
      id: string;
      stock: number;
      kind?: "product" | "event";
    }) => {
      const state = store.getState();
      if (payload.kind === "event") {
        dispatch(
          eventApiSlice.util.updateQueryData(
            "getEventById",
            payload.id,
            (draft) => {
              if (draft.event) draft.event.stock = payload.stock;
            },
          ),
        );
        eventApiSlice.util
          .selectCachedArgsForQuery(state, "getShopEvents")
          .forEach((arg) =>
            dispatch(
              eventApiSlice.util.updateQueryData(
                "getShopEvents",
                arg,
                (draft) => {
                  const e = draft.events.find((e) => e._id === payload.id);
                  if (e) e.stock = payload.stock;
                },
              ),
            ),
          );
        eventApiSlice.util
          .selectCachedArgsForQuery(state, "getAllEvents")
          .forEach((arg) =>
            dispatch(
              eventApiSlice.util.updateQueryData(
                "getAllEvents",
                arg,
                (draft) => {
                  const e = draft.events.find((e) => e._id === payload.id);
                  if (e) e.stock = payload.stock;
                },
              ),
            ),
          );
      } else {
        dispatch(
          productApiSlice.util.updateQueryData(
            "getProductById",
            payload.id,
            (draft) => {
              if (draft.product) draft.product.stock = payload.stock;
            },
          ),
        );
        productApiSlice.util
          .selectCachedArgsForQuery(state, "getShopProducts")
          .forEach((arg) =>
            dispatch(
              productApiSlice.util.updateQueryData(
                "getShopProducts",
                arg,
                (draft) => {
                  const p = draft.products.find((p) => p._id === payload.id);
                  if (p) p.stock = payload.stock;
                },
              ),
            ),
          );
        productApiSlice.util
          .selectCachedArgsForQuery(state, "getAllProducts")
          .forEach((arg) =>
            dispatch(
              productApiSlice.util.updateQueryData(
                "getAllProducts",
                arg,
                (draft) => {
                  const p = draft.products.find((p) => p._id === payload.id);
                  if (p) p.stock = payload.stock;
                },
              ),
            ),
          );
        productApiSlice.util
          .selectCachedArgsForQuery(state, "getRelatedProducts")
          .forEach((arg) =>
            dispatch(
              productApiSlice.util.updateQueryData(
                "getRelatedProducts",
                arg,
                (draft) => {
                  const p = draft.products.find((p) => p._id === payload.id);
                  if (p) p.stock = payload.stock;
                },
              ),
            ),
          );
      }
      dispatch(
        syncItemAvailability({ productId: payload.id, stock: payload.stock }),
      );
    };

    socket.on("stockUpdated", handleStockUpdated);
    return () => {
      socket.off("stockUpdated", handleStockUpdated);
    };
  }, [isSellerOnlyRoute, user?._id, dispatch, store]);

  return <>{children}</>;
}
