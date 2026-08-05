"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import styles from "@/styles/styles";
import { useLoginUserMutation } from "../authApiSlice";
import { loginSchema, type LoginFormValues } from "../validators";
import { getErrorMessage } from "../utils";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [loginUser, { isLoading }] = useLoginUserMutation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    try {
      await loginUser(values).unwrap();
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      setFormError(getErrorMessage(error, "Please provide the correct credentials"));
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 shadow-sm"
      noValidate
    >
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

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className={`${styles.input} mt-1`}
          {...register("password")}
        />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
      </div>

      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm text-[#3957db] hover:underline">
          Forgot password?
        </Link>
      </div>

      {formError && (
        <p role="alert" className="text-sm text-red-600">
          {formError}
        </p>
      )}

      <button type="submit" disabled={isLoading} className={`${styles.button} w-full disabled:opacity-60`}>
        <span className="text-white font-[Poppins]">{isLoading ? "Logging in..." : "Login"}</span>
      </button>

      <p className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-[#3957db] hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}