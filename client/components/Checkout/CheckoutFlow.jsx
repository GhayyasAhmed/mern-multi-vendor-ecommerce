"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import * as z from "zod";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import styles from "@/styles/styles";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearCart, selectCartGroupedByShop, selectCartItems, selectCartSubtotal } from "@/features/cart/cartSlice";
import { useCreateOrderMutation } from "@/features/orders/orderApiSlice";
import { useValidateCouponMutation } from "@/features/coupons/couponApiSlice";
import { getErrorMessage } from "@/features/auth/utils";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useUpdateUserAddressMutation } from "@/features/auth/authApiSlice";

const shippingSchema = z.object({
  address1: z.string("Address is required").min(3, "Please enter your street address"),
  address2: z.string().optional(),
  city: z.string("City is required").min(1, "City is required"),
  country: z.string("Country is required").min(1, "Country is required"),
  zipCode: z.string("Zip code is required").min(1, "Zip code is required"),
});

function CheckoutContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const shopGroups = useAppSelector(selectCartGroupedByShop);
  const cartItems = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);

  const [couponInput, setCouponInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponError, setCouponError] = useState(null);
  const [couponAppliedFor, setCouponAppliedFor] = useState(null);
  const [formError, setFormError] = useState(null);
  const { user } = useCurrentUser();
  const savedAddresses = user?.addresses ?? [];
  const [selectedAddressId, setSelectedAddressId] = useState("new");
  const [saveAddress, setSaveAddress] = useState(false);

  const [placedOrders, setPlacedOrders] = useState(null)

  const [updateUserAddress] = useUpdateUserAddressMutation();

  const [validateCoupon, { isLoading: isValidatingCoupon }] = useValidateCouponMutation();
  const [createOrder, { isLoading: isPlacingOrder }] = useCreateOrderMutation();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(shippingSchema),
  });

  const handleApplyCoupon = async () => {
    setCouponError(null);
    setAppliedDiscount(0);
    setCouponAppliedFor(null);

    const code = couponInput.trim();
    if (!code) {
      setCouponError("Please enter a coupon code");
      return;
    }

    let lastError = "Coupon code is invalid";
    for (const group of shopGroups) {
      try {
        const result = await validateCoupon({
          name: code,
          shopId: group.shopId,
          subtotal: group.items.reduce((sum, item) => sum + item.price * item.qty, 0),
          productIds: group.items.map((item) => item.productId),
        }).unwrap();

        setAppliedDiscount(result.discountAmount);
        setCouponAppliedFor(group.shopId);
        return;
      } catch (error) {
        lastError = getErrorMessage(error, "Coupon code is invalid");
      }
    }

    setCouponError(lastError);
  };

  // add handler, after handleApplyCoupon
  const handleSelectSavedAddress = (id) => {
    setSelectedAddressId(id);
    if (id === "new") return;
    const address = savedAddresses.find((a) => a._id === id);
    if (!address) return;
    setValue("address1", address.address1 || "");
    setValue("address2", address.address2 || "");
    setValue("city", address.city || "");
    setValue("country", address.country || "");
    setValue("zipCode", address.zipCode ? String(address.zipCode) : "");
  };

  const onSubmit = async (values) => {
    setFormError(null);

    if (cartItems.length === 0) {
      setFormError("Your cart is empty");
      return;
    }

    try {
      const result = await createOrder({
        cart: cartItems.map((item) => ({
          _id: item.productId,
          shopId: item.shopId,
          qty: item.qty,
          kind: item.kind,
          name: item.name,
          discountPrice: item.price,
          images: [{ url: item.image }],
        })),
        shippingAddress: {
          address1: values.address1,
          address2: values.address2,
          city: values.city,
          country: values.country,
          zipCode: values.zipCode,
        },
        paymentInfo: { type: "Cash On Delivery", status: "Pending" },
        couponCode: couponAppliedFor ? couponInput.trim() : undefined,
      }).unwrap();

      if (saveAddress && selectedAddressId === "new") {
        try {
          await updateUserAddress({
            addressType: "Home",
            address1: values.address1,
            address2: values.address2,
            city: values.city,
            country: values.country,
            zipCode: values.zipCode ? Number(values.zipCode) : undefined,
          }).unwrap();
        } catch {
          // best-effort: order already placed successfully; address save failure shouldn't block checkout
        }
      }

      dispatch(clearCart());
      setCouponInput("");
      setAppliedDiscount(0);
      setCouponAppliedFor(null);

      const orders = result.orders || [];
      if (orders.length > 1) {
        setPlacedOrders(orders);
      } else {
        const firstOrderId = orders[0]?._id;
        router.push(firstOrderId ? `/orders/${firstOrderId}` : "/orders");
      }
    } catch (error) {
      setFormError(getErrorMessage(error, "Could not place your order. Please try again."));
    }
  };

  if (placedOrders) {
    return (
      <div>
        <Header activeHeading={0} />
        <div className="w-full flex flex-col items-center justify-center py-24 min-h-[50vh] gap-4 text-center px-4">
          <p className="text-[20px] font-semibold text-[#333]">Your order has been placed!</p>
          <p className="text-[15px] text-[#00000082]">
            Since your cart included items from {placedOrders.length} different shops, we created {placedOrders.length} separate orders.
          </p>
          <div className="w-full max-w-md space-y-3">
            {placedOrders.map((order, index) => (
              <Link
                key={order._id}
                href={`/orders/${order._id}`}
                className="block rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition text-left"
              >
                <p className="text-sm text-[#00000082]">Order {index + 1} of {placedOrders.length}</p>
                <p className="font-medium text-[#3957db]">#{order._id.slice(-8).toUpperCase()}</p>
                <p className="text-sm text-[#00000082]">${order.totalPrice.toFixed(2)}</p>
              </Link>
            ))}
          </div>
          <Link href="/orders" className="text-[#3957db] hover:underline">
            View all my orders
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div>
        <Header activeHeading={0} />
        <div className="w-full flex flex-col items-center justify-center py-24 min-h-[50vh] gap-4">
          <p className="text-[18px] text-[#00000082]">Your cart is empty.</p>
          <Link href="/products" className="text-[#3957db] hover:underline">
            Browse products
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const finalTotal = Math.max(subtotal - appliedDiscount, 0);

  return (
    <div>
      <Header activeHeading={0} />
      <div className={`${styles.section} py-8`}>
        <div className={`${styles.heading}`}>
          <h1>Checkout</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full lg:w-1/2 space-y-4 rounded-lg bg-white p-6 shadow-sm"
            noValidate
          >
            <h2 className="text-lg font-semibold text-[#333]">Shipping address</h2>

            {savedAddresses.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Use a saved address</label>
                <select
                  className={`${styles.input} mt-1`}
                  value={selectedAddressId}
                  onChange={(e) => handleSelectSavedAddress(e.target.value)}
                >
                  <option value="new">Enter a new address</option>
                  {savedAddresses.map((address) => (
                    <option key={address._id} value={address._id}>
                      {address.addressType}: {[address.address1, address.city].filter(Boolean).join(", ")}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Street address</label>
              <input className={`${styles.input} mt-1`} {...register("address1")} />
              {errors.address1 && <p className="mt-1 text-sm text-red-600">{errors.address1.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Apartment, suite, etc. (optional)</label>
              <input className={`${styles.input} mt-1`} {...register("address2")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input className={`${styles.input} mt-1`} {...register("city")} />
                {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Zip code</label>
                <input className={`${styles.input} mt-1`} {...register("zipCode")} />
                {errors.zipCode && <p className="mt-1 text-sm text-red-600">{errors.zipCode.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <input className={`${styles.input} mt-1`} {...register("country")} />
              {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>}
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
              />
              Save this address to my account
            </label>

            {formError && (
              <p role="alert" className="text-sm text-red-600">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={isPlacingOrder}
              className={`${styles.submit_button} w-full disabled:opacity-60`}
            >
              <span className="text-white font-[Poppins]">
                {isPlacingOrder ? "Placing order..." : "Place order (Cash on Delivery)"}
              </span>
            </button>
          </form>

          <div className="w-full lg:w-1/2 space-y-4">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#333] mb-4">Order summary</h2>

              {shopGroups.map((group) => (
                <div key={group.shopId} className="mb-4 border-b pb-3 last:border-b-0">
                  <h3 className="text-sm font-medium text-[#3957db] mb-2">{group.shopName || "Shop"}</h3>
                  {group.items.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm py-1">
                      <span>
                        {item.name} x {item.qty}
                      </span>
                      <span>${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ))}

              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Coupon code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className={`${styles.input}`}
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={isValidatingCoupon}
                  className="px-4 py-2 rounded-md bg-black text-white text-sm disabled:opacity-60 cursor-pointer"
                >
                  {isValidatingCoupon ? "Checking..." : "Apply"}
                </button>
              </div>
              {couponError && <p className="mt-1 text-sm text-red-600">{couponError}</p>}
              {appliedDiscount > 0 && (
                <p className="mt-1 text-sm text-green-700">Coupon applied: -${appliedDiscount.toFixed(2)}</p>
              )}

              <div className="mt-4 pt-4 border-t space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Discount</span>
                    <span>-${appliedDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[17px] font-semibold pt-1">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function CheckoutFlow() {
  return (
    <ProtectedRoute>
      <CheckoutContent />
    </ProtectedRoute>
  );
}