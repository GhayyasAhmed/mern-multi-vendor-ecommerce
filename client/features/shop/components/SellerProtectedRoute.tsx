"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentSeller } from "../hooks/useCurrentSeller";

export default function SellerProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useCurrentSeller();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/seller/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[40vh] w-full items-center justify-center">
        <p className="text-sm text-gray-500">Checking your seller session...</p>
      </div>
    );
  }

  return <>{children}</>;
}