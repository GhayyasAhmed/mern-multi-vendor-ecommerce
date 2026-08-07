"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
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
  const [showPassword, setShowPassword] = useState(false);

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
      console.log(error)
      setFormError(getErrorMessage(error, "Please provide the correct credentials"));
    }
  };

  return (
    <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 shadow-sm">
      {/* Back Navigation Link */}
      <div>
        <Link href="/" className="text-sm text-gray-600 hover:text-[#3957db] hover:underline inline-flex items-center gap-1">
          Back to Home
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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

        {/* Password Field with Eye Icon */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className={`${styles.input} pr-10`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 focus:outline-none"
            >
              {showPassword ? <AiOutlineEye size={20} /> : <AiOutlineEyeInvisible size={20} />}
            </button>
          </div>
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

        <button type="submit" disabled={isLoading} className={`${styles.submit_button} w-full disabled:opacity-60`}>
          <span className="text-white font-[Poppins]">{isLoading ? "Logging in..." : "Login"}</span>
        </button>

        <p className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#3957db] hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}