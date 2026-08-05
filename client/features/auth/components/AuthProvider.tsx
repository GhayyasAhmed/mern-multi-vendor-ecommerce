"use client";

import type { ReactNode } from "react";
import { useCurrentUser } from "../hooks/useCurrentUser";

/**
 * Keeps a live subscription to the current-user query for the app's
 * lifetime so the session (backed by httpOnly cookies) is resolved once on
 * load and stays cached across client-side navigation. Mount once at the
 * root layout, inside StoreProvider.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  useCurrentUser();
  return <>{children}</>;
}