"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useAppDispatch } from "@/store/hooks";
import { switchUser } from "@/features/cart/cartSlice";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useCurrentUser();
  const dispatch = useAppDispatch();

  // Re-scopes the persisted cart to the current identity whenever it
  // changes (login, logout, or a different account signing in on the
  // same device), so one account never sees or checks out with another
  // account's cart contents on a shared device.
  useEffect(() => {
    if (isLoading) return;
    dispatch(switchUser({ userId: user?._id ?? null }));
  }, [isLoading, user?._id, dispatch]);

  return <>{children}</>;
}