"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useActivateShopMutation } from "../shopApiSlice";
import { getErrorMessage } from "@/features/auth/utils";

type Status = "pending" | "success" | "error";

export default function ShopActivationHandler({ token }: { token: string }) {
  const [activateShop] = useActivateShopMutation();
  const [status, setStatus] = useState<Status>("pending");
  const [message, setMessage] = useState<string>("Activating your shop...");
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    activateShop({ activation_token: token })
      .unwrap()
      .then((result) => {
        setStatus("success");
        setMessage(result.message || "Your shop has been activated!");
      })
      .catch((error) => {
        setStatus("error");
        setMessage(getErrorMessage(error, "Activation link is invalid or has expired."));
      });
  }, [activateShop, token]);

  return (
    <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 text-center shadow-sm">
      <p
        role="status"
        className={
          status === "error"
            ? "text-sm text-red-600"
            : status === "success"
              ? "text-sm text-green-700"
              : "text-sm text-gray-600"
        }
      >
        {message}
      </p>
      {status === "success" && (
        <Link href="/seller/login" className="text-sm text-[#3957db] hover:underline">
          Continue to seller login
        </Link>
      )}
      {status === "error" && (
        <Link href="/seller" className="text-sm text-[#3957db] hover:underline">
          Back to shop signup
        </Link>
      )}
    </div>
  );
}