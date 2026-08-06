"use client";

import type { ReactNode } from "react";
import { useCurrentUser } from "../hooks/useCurrentUser";

export function AuthProvider({ children }: { children: ReactNode }) {
  useCurrentUser();
  return <>{children}</>;
}