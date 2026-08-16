"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import styles from "@/styles/styles";
import { useLoginShopMutation } from "../shopApiSlice";
import { shopLoginSchema, type ShopLoginFormValues } from "../validators";
import { getErrorMessage } from "@/features/auth/utils";

export default function ShopLoginForm() {
  const router = useRouter();
  const [loginShop, { isLoading }] = useLoginShopMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShopLoginFormValues>({
    resolver: zodResolver(shopLoginSchema),
  });

  const onSubmit = async (values: ShopLoginFormValues) => {
    setFormError(null);
    try {
      await loginShop(values).unwrap();
      router.push("/seller/dashboard");
      router.refresh();
    } catch (error) {
      setFormError(
        getErrorMessage(error, "Please provide the correct credentials"),
      );
    }
  };

  return (
    <div className="w-full max-w-md space-y-4 rounded-lg bg-surface border border-border p-8 shadow-sm">
      {/* Back Navigation Link */}
      <div>
        <Link
          href="/"
          className="text-sm text-foreground hover:text-primary hover:underline inline-flex items-center gap-1"
        >
          Back to Home
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={`${styles.input} mt-1`}
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-error">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field with Eye Icon */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-foreground"
          >
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
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground focus:outline-none"
            >
              {showPassword ? (
                <AiOutlineEye size={20} />
              ) : (
                <AiOutlineEyeInvisible size={20} />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-error">{errors.password.message}</p>
          )}
        </div>

        {formError && (
          <p role="alert" className="text-sm text-error">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`${styles.submit_button} w-full disabled:opacity-60`}
        >
          <span className="font-[Poppins]">
            {isLoading ? "Logging in..." : "Login"}
          </span>
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have a shop yet?{" "}
          <Link href="/seller" className="text-primary hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}
