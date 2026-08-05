"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type ChangeEvent } from "react";
import styles from "@/styles/styles";
import { useRegisterUserMutation } from "../authApiSlice";
import { registerSchema, type RegisterFormValues } from "../validators";
import { getErrorMessage, readFileAsBase64 } from "../utils";

export default function RegisterForm() {
  const [registerUser, { isLoading }] = useRegisterUserMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarData, setAvatarData] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
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

  const onSubmit = async (values: RegisterFormValues) => {
    setFormError(null);
    setSuccessMessage(null);

    if (!avatarData) {
      setAvatarError("Profile photo is required");
      return;
    }

    try {
      const result = await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
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
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Full name
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          className={`${styles.input} mt-1`}
          {...register("name")}
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

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
          autoComplete="new-password"
          className={`${styles.input} mt-1`}
          {...register("password")}
        />
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
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">
          Profile photo
        </label>
        <input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="mt-1 w-full text-sm" />
        {avatarPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarPreview}
            alt="Avatar preview"
            className="mt-2 h-16 w-16 rounded-full border object-cover"
          />
        )}
        {avatarError && <p className="mt-1 text-sm text-red-600">{avatarError}</p>}
      </div>

      {formError && (
        <p role="alert" className="text-sm text-red-600">
          {formError}
        </p>
      )}

      <button type="submit" disabled={isLoading} className={`${styles.button} w-full disabled:opacity-60`}>
        <span className="text-white font-[Poppins]">{isLoading ? "Creating account..." : "Create account"}</span>
      </button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="text-[#3957db] hover:underline">
          Login
        </Link>
      </p>
    </form>
  );
}