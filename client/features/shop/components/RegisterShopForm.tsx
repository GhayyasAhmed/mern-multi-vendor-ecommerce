"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type ChangeEvent } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { RxAvatar } from "react-icons/rx";
import styles from "@/styles/styles";
import { useCreateShopMutation } from "../shopApiSlice";
import { shopRegisterSchema, type ShopRegisterFormValues } from "../validators";
import { getErrorMessage, readFileAsBase64 } from "@/features/auth/utils";
import {
  blockNonIntegerKeys,
  sanitizeDigitsOnly,
  validateImageFile,
} from "@/lib/validation";

export default function RegisterShopForm() {
  const [createShop, { isLoading }] = useCreateShopMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // States for avatar and password visibility
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarData, setAvatarData] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setAvatarError(validation.error ?? "Invalid image file.");
      e.target.value = "";
      return;
    }
    try {
      const base64 = await readFileAsBase64(file);
      setAvatarData(base64);
      setAvatarPreview(base64);
    } catch (err) {
      setAvatarError(
        getErrorMessage(
          err,
          "Could not read image. Please try a different file.",
        ),
      );
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
        <Link
          href="/seller/login"
          className="text-sm text-[#3957db] hover:underline"
        >
          Back to seller login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 shadow-sm">
      {/* Back Navigation Link */}
      <div>
        <Link
          href="/"
          className="text-sm text-gray-600 hover:text-[#3957db] hover:underline inline-flex items-center gap-1"
        >
          Back to Home
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Shop name
          </label>
          <input
            id="name"
            type="text"
            className={`${styles.input} mt-1`}
            {...register("name")}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
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
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field with Eye Icon */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className={`${styles.input} pr-10`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 focus:outline-none"
            >
              {showPassword ? (
                <AiOutlineEye size={20} />
              ) : (
                <AiOutlineEyeInvisible size={20} />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password Field with Eye Icon */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700"
          >
            Confirm password
          </label>
          <div className="relative mt-1">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              className={`${styles.input} pr-10`}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 focus:outline-none"
            >
              {showConfirmPassword ? (
                <AiOutlineEye size={20} />
              ) : (
                <AiOutlineEyeInvisible size={20} />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700"
          >
            Address
          </label>
          <input
            id="address"
            type="text"
            className={`${styles.input} mt-1`}
            {...register("address")}
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">
              {errors.address.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-gray-700"
            >
              Phone number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              inputMode="numeric"
              maxLength={15}
              className={`${styles.input} mt-1`}
              onKeyDown={blockNonIntegerKeys}
              {...register("phoneNumber", {
                onChange: (e) => {
                  e.target.value = sanitizeDigitsOnly(e.target.value);
                },
              })}
            />
            {errors.phoneNumber && (
              <p className="mt-1 text-sm text-red-600">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="zipCode"
              className="block text-sm font-medium text-gray-700"
            >
              Zip code
            </label>
            <input
              id="zipCode"
              type="text"
              inputMode="numeric"
              maxLength={10}
              className={`${styles.input} mt-1`}
              onKeyDown={blockNonIntegerKeys}
              {...register("zipCode", {
                onChange: (e) => {
                  e.target.value = sanitizeDigitsOnly(e.target.value);
                },
              })}
            />
            {errors.zipCode && (
              <p className="mt-1 text-sm text-red-600">
                {errors.zipCode.message}
              </p>
            )}
          </div>
        </div>

        {/* Custom Avatar Upload UI matching signup layout */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Shop logo
          </label>
          <div className="mt-2 flex items-center">
            <span className="inline-block h-10 w-10 rounded-full overflow-hidden border border-gray-300">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <RxAvatar className="h-full w-full text-gray-400" />
              )}
            </span>
            <label
              htmlFor="file-input"
              className="ml-5 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              <span>Upload a file</span>
              <input
                id="file-input"
                type="file"
                accept=".jpg,.jpeg,.png,image/*"
                onChange={handleAvatarChange}
                className="sr-only"
              />
            </label>
          </div>
          {avatarError && (
            <p className="mt-1 text-sm text-red-600">{avatarError}</p>
          )}
        </div>

        {formError && (
          <p role="alert" className="text-sm text-red-600">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`${styles.submit_button} w-full disabled:opacity-60`}
        >
          <span className="text-white font-[Poppins]">
            {isLoading ? "Creating shop..." : "Create shop"}
          </span>
        </button>

        <p className="text-center text-sm text-gray-600">
          Already have a shop?{" "}
          <Link href="/seller/login" className="text-[#3957db] hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
