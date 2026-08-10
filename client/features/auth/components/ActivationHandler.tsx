"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { getErrorMessage } from "../utils";
import {
  useActivateUserMutation,
  useResendActivationMutation,
} from "../authApiSlice";

type Status = "pending" | "success" | "error";

export default function ActivationHandler({ token }: { token: string }) {
  const [activateUser] = useActivateUserMutation();
  const [status, setStatus] = useState<Status>("pending");
  const [message, setMessage] = useState<string>("Activating your account...");
  const hasRun = useRef(false);

  // add state + handler inside component, after hasRun ref declaration
  const [resendActivation, { isLoading: isResending }] =
    useResendActivationMutation();
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
    // Activation tokens are single-use (deleted from Redis on first use), so
    // guard against React StrictMode's double-invoked effects in dev.
    if (hasRun.current) return;
    hasRun.current = true;

    activateUser({ activation_token: token })
      .unwrap()
      .then((result) => {
        setStatus("success");
        setMessage(result.message || "Your account has been activated!");
      })
      .catch((error) => {
        setStatus("error");
        setMessage(
          getErrorMessage(error, "Activation link is invalid or has expired."),
        );
      });
  }, [activateUser, token]);

  return (
    <div className="w-full max-w-md space-y-4 rounded-lg bg-surface border border-border p-8 text-center shadow-sm">
      <p
        role="status"
        className={
          status === "error"
            ? "text-sm text-error"
            : status === "success"
              ? "text-sm text-success"
              : "text-sm text-muted-foreground"
        }
      >
        {message}
      </p>
      {status === "success" && (
        <Link href="/login" className="text-sm text-primary hover:underline">
          Continue
        </Link>
      )}
      {status === "error" && (
        <div className="space-y-4 text-left">
          <Link
            href="/signup"
            className="block text-center text-sm text-primary hover:underline"
          >
            Back to sign up
          </Link>
          <form onSubmit={handleResend} className="space-y-2 border-t pt-4">
            <label
              htmlFor="resend-email"
              className="block text-sm font-medium text-foreground"
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
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={isResending}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-blue-700 disabled:opacity-60"
            >
              {isResending ? "Sending..." : "Resend activation email"}
            </button>
            {resendMessage && (
              <p className="text-sm text-success">{resendMessage}</p>
            )}
            {resendError && (
              <p className="text-sm text-error">{resendError}</p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
