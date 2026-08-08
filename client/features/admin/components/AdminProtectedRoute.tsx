"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const router = useRouter();
  console.log("user, isAuthenticated, isLoading", user, isAuthenticated, isLoading)

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login?redirect=/admin");
      return;
    }
    if (user?.role !== "admin") {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="flex min-h-[40vh] w-full items-center justify-center">
        <p className="text-sm text-gray-500">Checking admin access...</p>
      </div>
    );
  }

  return <>{children}</>;
}