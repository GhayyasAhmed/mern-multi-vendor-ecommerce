"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLogoutUserMutation } from "../authApiSlice";
import { getErrorMessage } from "../utils";

interface LogoutButtonProps {
  className?: string;
  onLoggedOut?: () => void;
}

export default function LogoutButton({ className, onLoggedOut }: LogoutButtonProps) {
  const router = useRouter();
  const [logoutUser, { isLoading }] = useLogoutUserMutation();
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setError(null);
    try {
      await logoutUser().unwrap();
      onLoggedOut?.();
      router.push("/login");
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
        className={className ?? "text-sm font-medium text-gray-700 hover:text-red-600 disabled:opacity-60"}
      >
        {isLoading ? "Logging out..." : "Logout"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}