"use client";

import Footer from "@/components/Layout/Footer";
import Header from "@/components/Layout/Header";
import styles from "@/styles/styles";
import type { IAddress } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useState, type ChangeEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { RxAvatar } from "react-icons/rx";
import {
  useDeleteUserAddressMutation,
  useUpdateUserAddressMutation,
  useUpdateUserAvatarMutation,
  useUpdateUserPasswordMutation,
  useUpdateUserProfileMutation,
} from "../authApiSlice";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { getErrorMessage, readFileAsBase64 } from "../utils";
import {
  addressSchema,
  passwordChangeSchema,
  profileSchema,
  type AddressFormValues,
  type PasswordChangeFormValues,
  type ProfileFormValues,
} from "../validators";
import ProtectedRoute from "./ProtectedRoute";
import { useToast } from "@/providers/toast-provider";
import {
  blockNonIntegerKeys,
  getPasswordStrength,
  sanitizeDigitsOnly,
} from "@/lib/validation";

type Tab = "profile" | "addresses" | "security";

function AccountContent() {
  const { user } = useCurrentUser();
  const [tab, setTab] = useState<Tab>("profile");

  if (!user) return null;

  return (
    <div>
      <Header activeHeading={0} />
      <div className={`${styles.section} py-8 min-h-[60vh]`}>
        <div className={`${styles.heading}`}>
          <h1>Account settings</h1>
        </div>

        <div className="flex gap-4 border-b mb-6">
          {(["profile", "addresses", "security"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`min-h-11 pb-3 px-2 text-sm font-medium capitalize cursor-pointer ${
                tab === t
                  ? "border-b-2 border-[#3957db] text-[#3957db]"
                  : "text-gray-500"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "profile" && <ProfileTab />}
        {tab === "addresses" && <AddressesTab />}
        {tab === "security" && <SecurityTab />}
      </div>
      <Footer />
    </div>
  );
}

function ProfileTab() {
  const toast = useToast();
  const { user } = useCurrentUser();
  const [updateProfile, { isLoading: isSavingProfile }] =
    useUpdateUserProfileMutation();
  const [updateAvatar, { isLoading: isSavingAvatar }] =
    useUpdateUserAvatarMutation();
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      phoneNumber: user?.phoneNumber ? String(user.phoneNumber) : "",
    },
  });

  const onProfileSubmit = async (values: ProfileFormValues) => {
    setProfileError(null);
    setProfileSuccess(null);
    try {
      await updateProfile({
        name: values.name,
        phoneNumber: values.phoneNumber
          ? Number(values.phoneNumber)
          : undefined,
      }).unwrap();
      toast.showToast({
        title: "Profile updated successfully",
        variant: "success",
      });
    } catch (error) {
      setProfileError(getErrorMessage(error));
      toast.showToast({ title: getErrorMessage(error), variant: "error" });
    }
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    try {
      const base64 = await readFileAsBase64(file);
      await updateAvatar({ avatar: base64 }).unwrap();
    } catch (err) {
      setAvatarError(
        getErrorMessage(
          err,
          "Could not update avatar. Please try a different image.",
        ),
      );
    } finally {
      e.target.value = "";
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Profile photo
        </label>
        <div className="mt-2 flex items-center">
          <span className="inline-block h-16 w-16 rounded-full overflow-hidden border border-gray-300 relative">
            {user.avatar?.url ? (
              <Image
                src={user.avatar.url}
                alt={user.name}
                fill
                className="h-full w-full object-cover"
              />
            ) : (
              <RxAvatar className="h-full w-full text-gray-400" />
            )}
          </span>
          <label
            htmlFor="account-avatar-file-input"
            className="ml-5 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
          >
            <span>{isSavingAvatar ? "Uploading..." : "Upload a file"}</span>
            <input
              id="account-avatar-file-input"
              type="file"
              accept=".jpg,.jpeg,.png,image/*"
              onChange={handleAvatarChange}
              disabled={isSavingAvatar}
              className="sr-only"
            />
          </label>
        </div>
        {avatarError && (
          <p className="mt-1 text-sm text-red-600">{avatarError}</p>
        )}
      </div>

      <form
        onSubmit={handleProfileSubmit(onProfileSubmit)}
        className="space-y-4 bg-white rounded-lg shadow-sm p-6"
        noValidate
      >
        <h2 className="text-lg font-semibold text-[#333]">
          Personal information
        </h2>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Full name
          </label>
          <input
            className={`${styles.input} mt-1`}
            {...registerProfile("name")}
          />
          {profileErrors.name && (
            <p className="mt-1 text-sm text-red-600">
              {profileErrors.name.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Phone number
          </label>
          <input
            className={`${styles.input} mt-1`}
            inputMode="numeric"
            maxLength={15}
            onKeyDown={blockNonIntegerKeys}
            {...registerProfile("phoneNumber", {
              onChange: (e) => {
                e.target.value = sanitizeDigitsOnly(e.target.value);
              },
            })}
          />
        </div>
        {profileError && <p className="text-sm text-red-600">{profileError}</p>}
        {profileSuccess && (
          <p className="text-sm text-green-700">{profileSuccess}</p>
        )}
        <button
          type="submit"
          disabled={isSavingProfile}
          className={`${styles.submit_button} disabled:opacity-60`}
        >
          <span className="text-white font-[Poppins]">
            {isSavingProfile ? "Saving..." : "Save changes"}
          </span>
        </button>
      </form>
    </div>
  );
}

function AddressesTab() {
  const { user } = useCurrentUser();
  const [saveAddress, { isLoading: isSaving }] = useUpdateUserAddressMutation();
  const [deleteAddress, { isLoading: isDeleting }] =
    useDeleteUserAddressMutation();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressFormValues>({ resolver: zodResolver(addressSchema) });

  const openCreateForm = () => {
    setEditingId(null);
    reset({
      addressType: "",
      country: "",
      city: "",
      address1: "",
      address2: "",
      zipCode: "",
    });
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (address: IAddress) => {
    setEditingId(address._id || null);
    reset({
      addressType: address.addressType || "",
      country: address.country || "",
      city: address.city || "",
      address1: address.address1 || "",
      address2: address.address2 || "",
      zipCode: address.zipCode ? String(address.zipCode) : "",
    });
    setFormError(null);
    setShowForm(true);
  };

  const onSubmit = async (values: AddressFormValues) => {
    setFormError(null);
    try {
      await saveAddress({
        _id: editingId || undefined,
        addressType: values.addressType,
        country: values.country,
        city: values.city,
        address1: values.address1,
        address2: values.address2,
        zipCode: values.zipCode ? Number(values.zipCode) : undefined,
      }).unwrap();
      setShowForm(false);
      setEditingId(null);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAddress(id).unwrap();
    } catch {
      // list stays as-is on failure; user can retry
    }
  };

  if (!user) return null;
  const addresses = user.addresses ?? [];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-[#333]">Saved addresses</h2>
        <button
          type="button"
          onClick={() => (showForm ? setShowForm(false) : openCreateForm())}
          className="px-4 py-2 rounded-md bg-black text-white text-sm cursor-pointer"
        >
          {showForm ? "Cancel" : "Add address"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 bg-white rounded-lg shadow-sm p-6 mb-6"
          noValidate
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Label (e.g. Home, Work)
            </label>
            <input
              className={`${styles.input} mt-1`}
              {...register("addressType")}
            />
            {errors.addressType && (
              <p className="mt-1 text-sm text-red-600">
                {errors.addressType.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Street address
            </label>
            <input
              className={`${styles.input} mt-1`}
              {...register("address1")}
            />
            {errors.address1 && (
              <p className="mt-1 text-sm text-red-600">
                {errors.address1.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Apartment, suite, etc. (optional)
            </label>
            <input
              className={`${styles.input} mt-1`}
              {...register("address2")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                City
              </label>
              <input className={`${styles.input} mt-1`} {...register("city")} />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.city.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Zip code</label>
              <input
                className={`${styles.input} mt-1`}
                inputMode="numeric"
                maxLength={10}
                onKeyDown={blockNonIntegerKeys}
                {...register("zipCode", {
                  onChange: (e) => { e.target.value = sanitizeDigitsOnly(e.target.value); },
                })}
              />
              {errors.zipCode && <p className="mt-1 text-sm text-red-600">{errors.zipCode.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Country
            </label>
            <input
              className={`${styles.input} mt-1`}
              {...register("country")}
            />
            {errors.country && (
              <p className="mt-1 text-sm text-red-600">
                {errors.country.message}
              </p>
            )}
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <button
            type="submit"
            disabled={isSaving}
            className={`${styles.submit_button} disabled:opacity-60`}
          >
            <span className="text-white font-[Poppins]">
              {isSaving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Add address"}
            </span>
          </button>
        </form>
      )}

      {addresses.length === 0 ? (
        <p className="text-[15px] text-[#00000082] py-8">
          You haven&apos;t saved any addresses yet.
        </p>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <div
              key={address._id}
              className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4"
            >
              <div>
                <p className="font-medium">{address.addressType}</p>
                <p className="text-sm text-[#00000082]">
                  {[
                    address.address1,
                    address.address2,
                    address.city,
                    address.zipCode,
                    address.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => openEditForm(address)}
                  className="text-sm text-[#3957db] hover:underline cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => address._id && handleDelete(address._id)}
                  className="text-sm text-red-600 hover:underline cursor-pointer disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SecurityTab() {
  const [updatePassword, { isLoading }] = useUpdateUserPasswordMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // States for password visibility
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<PasswordChangeFormValues>({ resolver: zodResolver(passwordChangeSchema) });

  const newPasswordValue = useWatch({ control, name: "newPassword" }) || "";
  const newPasswordStrength = getPasswordStrength(newPasswordValue);

  const onSubmit = async (values: PasswordChangeFormValues) => {
    setFormError(null);
    setSuccessMessage(null);
    try {
      const result = await updatePassword(values).unwrap();
      setSuccessMessage(result.message || "Password updated successfully.");
      reset();
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <div className="max-w-2xl">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 bg-white rounded-lg shadow-sm p-6"
        noValidate
      >
        <h2 className="text-lg font-semibold text-[#333]">Change password</h2>

        {/* Current Password Field with Eye Icon */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Current password
          </label>
          <div className="relative mt-1">
            <input
              type={showOldPassword ? "text" : "password"}
              className={`${styles.input} pr-10`}
              {...register("oldPassword")}
            />
            <button
              type="button"
              onClick={() => setShowOldPassword(!showOldPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 focus:outline-none"
            >
              {showOldPassword ? (
                <AiOutlineEye size={20} />
              ) : (
                <AiOutlineEyeInvisible size={20} />
              )}
            </button>
          </div>
          {errors.oldPassword && (
            <p className="mt-1 text-sm text-red-600">
              {errors.oldPassword.message}
            </p>
          )}
        </div>

        {/* New Password Field with Eye Icon */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            New password
          </label>
          <div className="relative mt-1">
            <input
              type={showNewPassword ? "text" : "password"}
              className={`${styles.input} pr-10`}
              {...register("newPassword")}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 focus:outline-none"
            >
              {showNewPassword ? (
                <AiOutlineEye size={20} />
              ) : (
                <AiOutlineEyeInvisible size={20} />
              )}
            </button>
          </div>
          {errors.newPassword && (
            <p className="mt-1 text-sm text-red-600">
              {errors.newPassword.message}
            </p>
          )}
          {newPasswordValue && !errors.newPassword && (
            <p className="mt-1 text-xs text-gray-500">Password strength: {newPasswordStrength.label}</p>
          )}
        </div>

        {/* Confirm New Password Field with Eye Icon */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Confirm new password
          </label>
          <div className="relative mt-1">
            <input
              type={showConfirmPassword ? "text" : "password"}
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

        {formError && <p className="text-sm text-red-600">{formError}</p>}
        {successMessage && (
          <p className="text-sm text-green-700">{successMessage}</p>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className={`${styles.submit_button} disabled:opacity-60`}
        >
          <span className="text-white font-[Poppins]">
            {isLoading ? "Updating..." : "Update password"}
          </span>
        </button>
      </form>
    </div>
  );
}

export default function AccountSettings() {
  return (
    <ProtectedRoute>
      <AccountContent />
    </ProtectedRoute>
  );
}