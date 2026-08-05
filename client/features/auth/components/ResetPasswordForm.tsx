"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import styles from "@/styles/styles";
import { useResetPasswordMutation } from "../authApiSlice";
import { resetPasswordSchema, type ResetPasswordFormValues } from "../validators";
import { getErrorMessage } from "../utils";

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (!successMessage) return;
    const timeout = setTimeout(() => router.push("/login"), 2000);
    return () => clearTimeout(timeout);
  }, [successMessage, router]);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setFormError(null);
    setSuccessMessage(null);
    try {
      const result = await resetPassword({ token, ...values }).unwrap();
      setSuccessMessage(result.message);
    } catch (error) {
      setFormError(getErrorMessage(error, "This reset link is invalid or has expired."));
    }
  };

  if (successMessage) {
    return (
      <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-green-700">{successMessage}</p>
        <Link href="/login" className="text-sm text-[#3957db] hover:underline">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 shadow-sm"
      noValidate
    >
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          New password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className={`${styles.input} mt-1`}
          {...register("password")}
        />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          className={`${styles.input} mt-1`}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      {formError && (
        <p role="alert" className="text-sm text-red-600">
          {formError}
        </p>
      )}

      <button type="submit" disabled={isLoading} className={`${styles.button} w-full disabled:opacity-60`}>
        <span className="text-white font-[Poppins]">{isLoading ? "Resetting..." : "Reset password"}</span>
      </button>
    </form>
  );
}