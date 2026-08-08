"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useAppDispatch } from "@/store/hooks";
import { switchUser } from "@/features/cart/cartSlice";

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isSellerOnlyRoute = pathname?.startsWith("/seller") ?? false;

  const { user, isLoading } = useCurrentUser({ skip: isSellerOnlyRoute });
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (isSellerOnlyRoute) return;
    if (isLoading) return;
    dispatch(switchUser({ userId: user?._id ?? null }));
  }, [isSellerOnlyRoute, isLoading, user?._id, dispatch]);

  return <>{children}</>;
}