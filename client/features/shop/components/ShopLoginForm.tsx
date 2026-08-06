"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import styles from "@/styles/styles";
import { useLoginShopMutation } from "../shopApiSlice";
import { shopLoginSchema, type ShopLoginFormValues } from "../validators";
import { getErrorMessage } from "@/features/auth/utils";

export default function ShopLoginForm() {
  const router = useRouter();
  const [loginShop, { isLoading }] = useLoginShopMutation();
  const [formError, setFormError] = useState<string | null>(null);

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
        <input id="email" type="email" autoComplete="email" className={`${styles.input} mt-1`} {...register("email")} />
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

      {formError && (
        <p role="alert" className="text-sm text-red-600">
          {formError}
        </p>
      )}

      <button type="submit" disabled={isLoading} className={`${styles.submit_button} w-full disabled:opacity-60`}>
        <span className="text-white font-[Poppins]">{isLoading ? "Logging in..." : "Login"}</span>
      </button>

      <p className="text-center text-sm text-gray-600">
        Don&apos;t have a shop yet?{" "}
        <Link href="/seller" className="text-[#3957db] hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}