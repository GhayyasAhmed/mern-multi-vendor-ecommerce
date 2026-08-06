"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type ChangeEvent } from "react";
import styles from "@/styles/styles";
import { useCreateShopMutation } from "../shopApiSlice";
import { shopRegisterSchema, type ShopRegisterFormValues } from "../validators";
import { getErrorMessage, readFileAsBase64 } from "@/features/auth/utils";

export default function RegisterShopForm() {
  const [createShop, { isLoading }] = useCreateShopMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarData, setAvatarData] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShopRegisterFormValues>({
    resolver: zodResolver(shopRegisterSchema),
  });

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    try {
      const base64 = await readFileAsBase64(file);
      setAvatarData(base64);
      setAvatarPreview(base64);
    } catch (err) {
      setAvatarError(getErrorMessage(err, "Could not read image. Please try a different file."));
      e.target.value = "";
    }
  };

  const onSubmit = async (values: ShopRegisterFormValues) => {
    setFormError(null);
    setSuccessMessage(null);

    if (!avatarData) {
      setAvatarError("Shop logo is required");
      return;
    }

    try {
      const result = await createShop({
        name: values.name,
        email: values.email,
        password: values.password,
        address: values.address,
        phoneNumber: Number(values.phoneNumber),
        zipCode: Number(values.zipCode),
        avatar: avatarData,
      }).unwrap();

      setSuccessMessage(result.message);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  if (successMessage) {
    return (
      <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-green-700">{successMessage}</p>
        <Link href="/seller/login" className="text-sm text-[#3957db] hover:underline">
          Back to seller login
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
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Shop name
        </label>
        <input id="name" type="text" className={`${styles.input} mt-1`} {...register("name")} />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

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
        <input id="password" type="password" autoComplete="new-password" className={`${styles.input} mt-1`} {...register("password")} />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          className={`${styles.input} mt-1`}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Address
        </label>
        <input id="address" type="text" className={`${styles.input} mt-1`} {...register("address")} />
        {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
            Phone number
          </label>
          <input id="phoneNumber" type="tel" className={`${styles.input} mt-1`} {...register("phoneNumber")} />
          {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>}
        </div>
        <div>
          <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
            Zip code
          </label>
          <input id="zipCode" type="text" className={`${styles.input} mt-1`} {...register("zipCode")} />
          {errors.zipCode && <p className="mt-1 text-sm text-red-600">{errors.zipCode.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">
          Shop logo
        </label>
        <input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="mt-1 w-full text-sm" />
        {avatarPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarPreview} alt="Avatar preview" className="mt-2 h-16 w-16 rounded-full border object-cover" />
        )}
        {avatarError && <p className="mt-1 text-sm text-red-600">{avatarError}</p>}
      </div>

      {formError && (
        <p role="alert" className="text-sm text-red-600">
          {formError}
        </p>
      )}

      <button type="submit" disabled={isLoading} className={`${styles.submit_button} w-full disabled:opacity-60`}>
        <span className="text-white font-[Poppins]">{isLoading ? "Creating shop..." : "Create shop"}</span>
      </button>

      <p className="text-center text-sm text-gray-600">
        Already have a shop?{" "}
        <Link href="/seller/login" className="text-[#3957db] hover:underline">
          Login
        </Link>
      </p>
    </form>
  );
}