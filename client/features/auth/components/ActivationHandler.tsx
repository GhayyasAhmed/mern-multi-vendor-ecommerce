"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useActivateUserMutation } from "../authApiSlice";
import { getErrorMessage } from "../utils";

type Status = "pending" | "success" | "error";

export default function ActivationHandler({ token }: { token: string }) {
  const [activateUser] = useActivateUserMutation();
  const [status, setStatus] = useState<Status>("pending");
  const [message, setMessage] = useState<string>("Activating your account...");
  const hasRun = useRef(false);

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
        setMessage(getErrorMessage(error, "Activation link is invalid or has expired."));
      });
  }, [activateUser, token]);

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
        <Link href="/login" className="text-sm text-[#3957db] hover:underline">
          Continue to login
        </Link>
      )}
      {status === "error" && (
        <Link href="/signup" className="text-sm text-[#3957db] hover:underline">
          Back to sign up
        </Link>
      )}
    </div>
  );
}