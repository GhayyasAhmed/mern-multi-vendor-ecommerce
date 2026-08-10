"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import styles from "@/styles/styles";
import { useResetPasswordMutation } from "../authApiSlice";
import { resetPasswordSchema, type ResetPasswordFormValues } from "../validators";
import { getErrorMessage } from "../utils";
import { getPasswordStrength } from "@/lib/validation";

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const passwordValue = useWatch({ control, name: "password" }) || "";
  const passwordStrength = getPasswordStrength(passwordValue);

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
      <div className="w-full max-w-md space-y-4 rounded-lg bg-surface border border-border p-8 text-center shadow-sm">
        <p className="text-sm text-success">{successMessage}</p>
        <Link href="/login" className="text-sm text-primary hover:underline">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-md space-y-4 rounded-lg bg-surface border border-border p-8 shadow-sm"
      noValidate
    >
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          New password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className={`${styles.input} mt-1`}
          {...register("password")}
        />
        {errors.password && <p className="mt-1 text-sm text-error">{errors.password.message}</p>}
         {passwordValue && !errors.password && (
          <p className="mt-1 text-xs text-muted-foreground">Password strength: {passwordStrength.label}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
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
          <p className="mt-1 text-sm text-error">{errors.confirmPassword.message}</p>
        )}
      </div>

      {formError && (
        <p role="alert" className="text-sm text-error">
          {formError}
        </p>
      )}

      <button type="submit" disabled={isLoading} className={`${styles.submit_button} w-full disabled:opacity-60`}>
        <span className="font-[Poppins]">{isLoading ? "Resetting..." : "Reset password"}</span>
      </button>
    </form>
  );
}