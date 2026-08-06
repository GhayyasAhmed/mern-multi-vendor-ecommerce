"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import styles from "@/styles/styles";
import { getErrorMessage, readFileAsBase64 } from "@/features/auth/utils";
import { useCurrentSeller } from "../hooks/useCurrentSeller";
import { useUpdateSellerInfoMutation, useUpdateShopAvatarMutation } from "../shopApiSlice";
import {
  useGetShopProductsQuery,
  useCreateProductMutation,
  useDeleteProductMutation,
} from "@/features/products/productApiSlice";
import {
  useGetShopEventsQuery,
  useCreateEventMutation,
  useDeleteEventMutation,
} from "@/features/events/eventApiSlice";
import ShopLogoutButton from "./ShopLogoutButton";
import {
  productFormSchema,
  eventFormSchema,
  type ProductFormValues,
  type EventFormValues,
} from "../validators";

type Tab = "profile" | "products" | "events";

export default function SellerDashboard() {
  const { seller } = useCurrentSeller();
  const [tab, setTab] = useState<Tab>("profile");

  if (!seller) return null;

  return (
    <div className="w-full min-h-screen bg-[#f5f5f5]">
      <div className="bg-[#3321c8] text-white">
        <div className="w-11/12 mx-auto py-6 flex flex-col md:flex-row items-center md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-15 h-15 rounded-full overflow-hidden border-2 border-white shrink-0">
              <Image src={seller.avatar?.url || "/placeholder.png"} alt={seller.name} fill className="object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{seller.name}</h1>
              <Link href={`/shop/preview/${seller._id}`} className="text-sm text-white/80 hover:underline">
                View public shop page
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm">
              Balance: <span className="font-semibold">${(seller.availableBalance || 0).toFixed(2)}</span>
            </p>
            <ShopLogoutButton className="text-sm font-medium text-white hover:text-red-200" />
          </div>
        </div>
      </div>

      <div className="w-11/12 mx-auto py-6">
        <div className="flex gap-4 border-b mb-6">
          {(["profile", "products", "events"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`pb-3 px-2 text-sm font-medium capitalize cursor-pointer ${
                tab === t ? "border-b-2 border-[#3957db] text-[#3957db]" : "text-gray-500"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "profile" && <ProfilePanel />}
        {tab === "products" && <ProductsPanel shopId={seller._id} />}
        {tab === "events" && <EventsPanel shopId={seller._id} />}
      </div>
    </div>
  );
}

function ProfilePanel() {
  const { seller } = useCurrentSeller();
  const [updateSellerInfo, { isLoading: isSavingInfo }] = useUpdateSellerInfoMutation();
  const [updateShopAvatar, { isLoading: isSavingAvatar }] = useUpdateShopAvatarMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: seller?.name || "",
      description: seller?.description || "",
      address: seller?.address || "",
      phoneNumber: seller?.phoneNumber ? String(seller.phoneNumber) : "",
      zipCode: seller?.zipCode ? String(seller.zipCode) : "",
    },
  });

  const onSubmit = async (values: {
    name: string;
    description: string;
    address: string;
    phoneNumber: string;
    zipCode: string;
  }) => {
    setFormError(null);
    setSuccessMessage(null);
    try {
      await updateSellerInfo({
        name: values.name,
        description: values.description,
        address: values.address,
        phoneNumber: values.phoneNumber ? Number(values.phoneNumber) : undefined,
        zipCode: values.zipCode ? Number(values.zipCode) : undefined,
      }).unwrap();
      setSuccessMessage("Shop information updated successfully.");
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    try {
      const base64 = await readFileAsBase64(file);
      await updateShopAvatar({ avatar: base64 }).unwrap();
    } catch (err) {
      setAvatarError(getErrorMessage(err, "Could not update avatar. Please try a different image."));
    } finally {
      e.target.value = "";
    }
  };

  if (!seller) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Shop logo</label>
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border">
            <Image src={seller.avatar?.url || "/placeholder.png"} alt={seller.name} fill className="object-cover" />
          </div>
          <input type="file" accept="image/*" onChange={handleAvatarChange} disabled={isSavingAvatar} className="text-sm" />
        </div>
        {avatarError && <p className="mt-1 text-sm text-red-600">{avatarError}</p>}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white rounded-lg shadow-sm p-6" noValidate>
        <div>
          <label className="block text-sm font-medium text-gray-700">Shop name</label>
          <input className={`${styles.input} mt-1`} {...register("name")} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea rows={3} className={`${styles.input} mt-1`} {...register("description")} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <input className={`${styles.input} mt-1`} {...register("address")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone number</label>
            <input className={`${styles.input} mt-1`} {...register("phoneNumber")} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Zip code</label>
            <input className={`${styles.input} mt-1`} {...register("zipCode")} />
          </div>
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}
        {successMessage && <p className="text-sm text-green-700">{successMessage}</p>}

        <button type="submit" disabled={isSavingInfo} className={`${styles.submit_button} disabled:opacity-60`}>
          <span className="text-white font-[Poppins]">{isSavingInfo ? "Saving..." : "Save changes"}</span>
        </button>
      </form>
    </div>
  );
}

function ProductsPanel({ shopId }: { shopId: string }) {
  const { data, isLoading, isError, error } = useGetShopProductsQuery(shopId);
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [showForm, setShowForm] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({ resolver: zodResolver(productFormSchema) });

  const handleImagesChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormError(null);
    try {
      const encoded = await Promise.all(files.map((file) => readFileAsBase64(file)));
      setImages(encoded);
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not read one or more images."));
    }
  };

  const onSubmit = async (values: ProductFormValues) => {
    setFormError(null);
    if (images.length === 0) {
      setFormError("Please add at least one product image");
      return;
    }
    try {
      await createProduct({
        name: values.name,
        description: values.description,
        category: values.category,
        tags: values.tags || undefined,
        originalPrice: values.originalPrice ? Number(values.originalPrice) : undefined,
        discountPrice: Number(values.discountPrice),
        stock: Number(values.stock),
        images,
        shopId,
      }).unwrap();
      reset();
      setImages([]);
      setShowForm(false);
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not create product."));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct({ id, shopId }).unwrap();
    } catch {
      // list stays as-is; a toast/notification system is a follow-up improvement
    }
  };

  const products = data?.products ?? [];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-[#333]">Your products</h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 rounded-md bg-black text-white text-sm cursor-pointer"
        >
          {showForm ? "Cancel" : "Add product"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white rounded-lg shadow-sm p-6 mb-6" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input className={`${styles.input} mt-1`} {...register("name")} />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea rows={3} className={`${styles.input} mt-1`} {...register("description")} />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <input className={`${styles.input} mt-1`} {...register("category")} />
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tags (optional)</label>
              <input className={`${styles.input} mt-1`} {...register("tags")} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Original price</label>
              <input className={`${styles.input} mt-1`} {...register("originalPrice")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Discount price</label>
              <input className={`${styles.input} mt-1`} {...register("discountPrice")} />
              {errors.discountPrice && <p className="mt-1 text-sm text-red-600">{errors.discountPrice.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stock</label>
              <input className={`${styles.input} mt-1`} {...register("stock")} />
              {errors.stock && <p className="mt-1 text-sm text-red-600">{errors.stock.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Images</label>
            <input type="file" accept="image/*" multiple onChange={handleImagesChange} className="mt-1 text-sm" />
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <button type="submit" disabled={isCreating} className={`${styles.submit_button} disabled:opacity-60`}>
            <span className="text-white font-[Poppins]">{isCreating ? "Creating..." : "Create product"}</span>
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-[15px] text-[#00000082] py-8">Loading products...</p>
      ) : isError ? (
        <p className="text-[15px] text-red-500 py-8">{getErrorMessage(error, "Could not load products.")}</p>
      ) : products.length === 0 ? (
        <p className="text-[15px] text-[#00000082] py-8">You haven&apos;t added any products yet.</p>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div key={product._id} className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 shrink-0">
                  <Image
                    src={product.images?.[0]?.url || "/placeholder.png"}
                    alt={product.name}
                    fill
                    className="object-cover rounded-[5px]"
                  />
                </div>
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-[#00000082]">
                    ${product.discountPrice} &middot; {product.stock} in stock
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(product._id)}
                className="text-sm text-red-600 hover:underline cursor-pointer"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventsPanel({ shopId }: { shopId: string }) {
  const { data, isLoading, isError, error } = useGetShopEventsQuery(shopId);
  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const [deleteEvent] = useDeleteEventMutation();
  const [showForm, setShowForm] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventFormValues>({ resolver: zodResolver(eventFormSchema) });

  const handleImagesChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormError(null);
    try {
      const encoded = await Promise.all(files.map((file) => readFileAsBase64(file)));
      setImages(encoded);
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not read one or more images."));
    }
  };

  const onSubmit = async (values: EventFormValues) => {
    setFormError(null);
    if (images.length === 0) {
      setFormError("Please add at least one event image");
      return;
    }
    try {
      await createEvent({
        name: values.name,
        description: values.description,
        category: values.category,
        tags: values.tags || undefined,
        originalPrice: values.originalPrice ? Number(values.originalPrice) : undefined,
        discountPrice: Number(values.discountPrice),
        stock: Number(values.stock),
        start_Date: values.start_Date,
        Finish_Date: values.Finish_Date,
        images,
        shopId,
      }).unwrap();
      reset();
      setImages([]);
      setShowForm(false);
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not create event."));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent({ id, shopId }).unwrap();
    } catch {
      // list stays as-is; a toast/notification system is a follow-up improvement
    }
  };

  const events = data?.events ?? [];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-[#333]">Your events</h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 rounded-md bg-black text-white text-sm cursor-pointer"
        >
          {showForm ? "Cancel" : "Add event"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white rounded-lg shadow-sm p-6 mb-6" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input className={`${styles.input} mt-1`} {...register("name")} />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea rows={3} className={`${styles.input} mt-1`} {...register("description")} />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <input className={`${styles.input} mt-1`} {...register("category")} />
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tags (optional)</label>
              <input className={`${styles.input} mt-1`} {...register("tags")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start date</label>
              <input type="date" className={`${styles.input} mt-1`} {...register("start_Date")} />
              {errors.start_Date && <p className="mt-1 text-sm text-red-600">{errors.start_Date.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End date</label>
              <input type="date" className={`${styles.input} mt-1`} {...register("Finish_Date")} />
              {errors.Finish_Date && <p className="mt-1 text-sm text-red-600">{errors.Finish_Date.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Original price</label>
              <input className={`${styles.input} mt-1`} {...register("originalPrice")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Discount price</label>
              <input className={`${styles.input} mt-1`} {...register("discountPrice")} />
              {errors.discountPrice && <p className="mt-1 text-sm text-red-600">{errors.discountPrice.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stock</label>
              <input className={`${styles.input} mt-1`} {...register("stock")} />
              {errors.stock && <p className="mt-1 text-sm text-red-600">{errors.stock.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Images</label>
            <input type="file" accept="image/*" multiple onChange={handleImagesChange} className="mt-1 text-sm" />
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <button type="submit" disabled={isCreating} className={`${styles.submit_button} disabled:opacity-60`}>
            <span className="text-white font-[Poppins]">{isCreating ? "Creating..." : "Create event"}</span>
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-[15px] text-[#00000082] py-8">Loading events...</p>
      ) : isError ? (
        <p className="text-[15px] text-red-500 py-8">{getErrorMessage(error, "Could not load events.")}</p>
      ) : events.length === 0 ? (
        <p className="text-[15px] text-[#00000082] py-8">You haven&apos;t created any events yet.</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event._id} className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 shrink-0">
                  <Image
                    src={event.images?.[0]?.url || "/placeholder.png"}
                    alt={event.name}
                    fill
                    className="object-cover rounded-[5px]"
                  />
                </div>
                <div>
                  <p className="font-medium">{event.name}</p>
                  <p className="text-sm text-[#00000082]">
                    ${event.discountPrice} &middot; {event.isActive ? "Active" : event.isUpcoming ? "Upcoming" : "Expired"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(event._id)}
                className="text-sm text-red-600 hover:underline cursor-pointer"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}