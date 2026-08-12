"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLogoutShopMutation } from "../shopApiSlice";
import { getErrorMessage } from "@/features/auth/utils";
// import { disconnectSocket } from "@/lib/socket";

interface ShopLogoutButtonProps {
  className?: string;
  onLoggedOut?: () => void;
}

export default function ShopLogoutButton({ className, onLoggedOut }: ShopLogoutButtonProps) {
  const router = useRouter();
  const [logoutShop, { isLoading }] = useLogoutShopMutation();
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setError(null);
    try {
      await logoutShop().unwrap();
      // disconnectSocket();
      onLoggedOut?.();
      router.push("/seller/login");
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err, "Could not log out. Please try again."));
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoading}
        className={className ?? "text-sm font-medium text-foreground cursor-pointer hover:text-error disabled:opacity-60"}
      >
        {isLoading ? "Logging out..." : "Logout"}
      </button>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}