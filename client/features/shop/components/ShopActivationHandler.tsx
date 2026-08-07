"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  useActivateShopMutation,
  useResendShopActivationMutation,
} from "../shopApiSlice";
import { getErrorMessage } from "@/features/auth/utils";

type Status = "pending" | "success" | "error";

export default function ShopActivationHandler({ token }: { token: string }) {
  const [activateShop] = useActivateShopMutation();
  const [status, setStatus] = useState<Status>("pending");
  const [message, setMessage] = useState<string>("Activating your shop...");
  const hasRun = useRef(false);

  const [resendActivation, { isLoading: isResending }] =
    useResendShopActivationMutation();
  const [resendEmail, setResendEmail] = useState("");
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleResend = async (e: FormEvent) => {
    e.preventDefault();
    setResendError(null);
    setResendMessage(null);
    try {
      const result = await resendActivation({ email: resendEmail }).unwrap();
      setResendMessage(
        result.message || "A new activation link has been sent.",
      );
    } catch (error) {
      setResendError(
        getErrorMessage(error, "Could not resend activation email."),
      );
    }
  };

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
        setMessage(
          getErrorMessage(error, "Activation link is invalid or has expired."),
        );
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
        <Link
          href="/seller/login"
          className="text-sm text-[#3957db] hover:underline"
        >
          Continue
        </Link>
      )}
      {status === "error" && (
        <div className="space-y-4 text-left">
          <Link
            href="/seller"
            className="block text-center text-sm text-[#3957db] hover:underline"
          >
            Back to shop signup
          </Link>
          <form onSubmit={handleResend} className="space-y-2 border-t pt-4">
            <label
              htmlFor="resend-email"
              className="block text-sm font-medium text-gray-700"
            >
              Resend activation link
            </label>
            <input
              id="resend-email"
              type="email"
              required
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={isResending}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isResending ? "Sending..." : "Resend activation email"}
            </button>
            {resendMessage && (
              <p className="text-sm text-green-700">{resendMessage}</p>
            )}
            {resendError && (
              <p className="text-sm text-red-600">{resendError}</p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
