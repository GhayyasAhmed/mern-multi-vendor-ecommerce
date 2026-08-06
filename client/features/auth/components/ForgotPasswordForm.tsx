"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import styles from "@/styles/styles";
import { useForgotPasswordMutation } from "../authApiSlice";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "../validators";
import { getErrorMessage } from "../utils";

export default function ForgotPasswordForm() {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setFormError(null);
    setSuccessMessage(null);
    try {
      const result = await forgotPassword(values).unwrap();
      setSuccessMessage(result.message);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  if (successMessage) {
    return (
      <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-green-700">{successMessage}</p>
        <Link href="/login" className="text-sm text-[#3957db] hover:underline">
          Back to login
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
      <p className="text-sm text-gray-600">
        Enter the email associated with your account and we&apos;ll send you a link to reset your password.
      </p>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className={`${styles.input} mt-1`}
          {...register("email")}
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
      </div>

      {formError && (
        <p role="alert" className="text-sm text-red-600">
          {formError}
        </p>
      )}

      <button type="submit" disabled={isLoading} className={`${styles.submit_button} w-full disabled:opacity-60`}>
        <span className="text-white font-[Poppins]">{isLoading ? "Sending link..." : "Send reset link"}</span>
      </button>

      <p className="text-center text-sm text-gray-600">
        Remembered your password?{" "}
        <Link href="/login" className="text-[#3957db] hover:underline">
          Login
        </Link>
      </p>
    </form>
  );
}