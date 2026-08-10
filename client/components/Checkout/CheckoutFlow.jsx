"use client";
import Footer from "@/components/Layout/Footer";
import Header from "@/components/Layout/Header";
import EmptyState from "@/components/ui/EmptyState";
import { useUpdateUserAddressMutation } from "@/features/auth/authApiSlice";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getErrorMessage } from "@/features/auth/utils";
import { clearCart, selectCartGroupedByShop, selectCartItems, selectCartSubtotal } from "@/features/cart/cartSlice";
import { useValidateCouponMutation } from "@/features/coupons/couponApiSlice";
import { useCreateOrderMutation } from "@/features/orders/orderApiSlice";
import { useCreatePaymentIntentMutation, useGetStripeApiKeyQuery } from "@/features/payment/paymentApiSlice";
import { blockNonIntegerKeys, sanitizeDigitsOnly } from "@/lib/validation";
import { useTheme } from "@/providers/theme-provider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import styles from "@/styles/styles";
import { zodResolver } from "@hookform/resolvers/zod";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { IoBagHandleOutline } from "react-icons/io5";
import * as z from "zod";
import Skeleton from "../ui/Skeleton";

const shippingSchema = z.object({
  address1: z.string().min(3, "Please enter your street address"),
  address2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  zipCode: z.string().min(1, "Zip code is required"),
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

  const [placedOrders, setPlacedOrders] = useState(null);
  const [updateUserAddress] = useUpdateUserAddressMutation();

  const [validateCoupon, { isLoading: isValidatingCoupon }] = useValidateCouponMutation();
  const [createOrder, { isLoading: isPlacingOrder }] = useCreateOrderMutation();

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [cardPaymentIntent, setCardPaymentIntent] = useState(null);
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);

  const { data: stripeKeyData } = useGetStripeApiKeyQuery();
  const stripePromise = useMemo(() => {
    return stripeKeyData?.stripeApikey ? loadStripe(stripeKeyData.stripeApikey) : null;
  }, [stripeKeyData]);


  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const [createPaymentIntent] = useCreatePaymentIntentMutation();


  const stripeOptions = useMemo(() => {
    if (!cardPaymentIntent?.clientSecret) return {};
    return {
      clientSecret: cardPaymentIntent.clientSecret,
      appearance: {
        theme: isDarkMode ? "night" : "stripe",
      },
    };
  }, [cardPaymentIntent, isDarkMode]);

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(shippingSchema),
  });

  const finalTotal = Math.max(subtotal - appliedDiscount, 0);

  const handleApplyCoupon = async () => {
    setCouponError(null);
    setAppliedDiscount(0);
    setCouponAppliedFor(null);

    const code = couponInput.trim();
    if (!code) {
      setCouponError("Please enter a coupon code");
      if (paymentMethod === "card") {
        updateCardIntent(subtotal);
      }
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

        if (paymentMethod === "card") {
          updateCardIntent(Math.max(subtotal - result.discountAmount, 0));
        }
        return;
      } catch (error) {
        lastError = getErrorMessage(error, "Coupon code is invalid");
      }
    }
    setCouponError(lastError);
    if (paymentMethod === "card") {
      updateCardIntent(subtotal);
    }
  };

  const updateCardIntent = async (amountToCharge) => {
    try {
      setIsPreparingPayment(true);
      const amountInCents = Math.round(amountToCharge * 100);
      const intent = await createPaymentIntent({ amount: amountInCents }).unwrap();
      setCardPaymentIntent({ clientSecret: intent.client_secret, paymentIntentId: intent.paymentIntentId });
    } catch (error) {
      setFormError(getErrorMessage(error, "Could not initialize payment. Please try again."));
    } finally {
      setIsPreparingPayment(false);
    }
  };

  const handlePaymentMethodChange = async (newMethod) => {
    setPaymentMethod(newMethod);
    setFormError(null);
    if (newMethod === "card") {
      await updateCardIntent(finalTotal);
    } else {
      setCardPaymentIntent(null);
    }
  };

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

  const placeOrder = async (values, paymentInfo) => {
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
        paymentInfo,
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
          // best-effort
        }
      }

      dispatch(clearCart());
      setCouponInput("");
      setAppliedDiscount(0);
      setCouponAppliedFor(null);
      setCardPaymentIntent(null);

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

  const onSubmitCod = async (values) => {
    setFormError(null);
    if (cartItems.length === 0) {
      setFormError("Your cart is empty");
      return;
    }
    await placeOrder(values, { type: "Cash On Delivery" });
  };

  if (placedOrders) {
    return (
      <div>
        <Header activeHeading={0} />
        <div className="w-full flex flex-col items-center justify-center py-24 min-h-[50vh] gap-4 text-center px-4">
          <p className="text-[20px] font-semibold text-foreground">Your order has been placed!</p>
          <p className="text-[15px] text-muted-foreground">
            Since your cart included items from {placedOrders.length} different shops, we created {placedOrders.length} separate orders.
          </p>
          <div className="w-full max-w-md space-y-3">
            {placedOrders.map((order, index) => (
              <Link
                key={order._id}
                href={`/orders/${order._id}`}
                className="block rounded-lg bg-surface p-4 shadow-sm hover:shadow-md transition text-left"
              >
                <p className="text-sm text-muted-foreground">Order {index + 1} of {placedOrders.length}</p>
                <p className="font-medium text-primary">#{order._id.slice(-8).toUpperCase()}</p>
                <p className="text-sm text-muted-foreground">${order.totalPrice.toFixed(2)}</p>
              </Link>
            ))}
          </div>
          <Link href="/orders" className="text-primary hover:underline">
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
          <EmptyState icon={<IoBagHandleOutline size={26} />} title="Your cart is empty" />
          <div className="text-center pb-8 -mt-8">
            <Link href="/products" className="text-primary hover:underline">
              Browse products
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header activeHeading={0} />
      <div className={`${styles.section} py-8 max-w-7xl mx-auto px-4`}>
        <div className={`${styles.heading} mb-6`}>
          <h1 className="text-2xl font-bold">Checkout</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmitCod)} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left Column: Shipping Address & Payment Method */}
            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-xl bg-surface p-6 shadow-sm border border-border/40">
                <h2 className="text-lg font-semibold text-foreground mb-4">Shipping address</h2>

                {savedAddresses.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-foreground mb-1">Use a saved address</label>
                    <select
                      className={`${styles.input} w-full`}
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

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground">Street address</label>
                    <input className={`${styles.input} mt-1 w-full`} {...register("address1")} />
                    {errors.address1 && <p className="mt-1 text-sm text-error">{errors.address1.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground">Apartment, suite, etc. (optional)</label>
                    <input className={`${styles.input} mt-1 w-full`} {...register("address2")} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground">City</label>
                      <input className={`${styles.input} mt-1 w-full`} {...register("city")} />
                      {errors.city && <p className="mt-1 text-sm text-error">{errors.city.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground">Zip code</label>
                      <input
                        className={`${styles.input} mt-1 w-full`}
                        inputMode="numeric"
                        maxLength={10}
                        onKeyDown={blockNonIntegerKeys}
                        {...register("zipCode", {
                          onChange: (e) => { e.target.value = sanitizeDigitsOnly(e.target.value); },
                        })}
                      />
                      {errors.zipCode && <p className="mt-1 text-sm text-error">{errors.zipCode.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground">Country</label>
                    <input className={`${styles.input} mt-1 w-full`} {...register("country")} />
                    {errors.country && <p className="mt-1 text-sm text-error">{errors.country.message}</p>}
                  </div>

                  <label className="flex items-center gap-2 text-sm text-foreground pt-2">
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                    />
                    Save this address to my account
                  </label>

                  {/* Payment Method Selector right below Save this address */}
                  <div className="pt-4 border-t border-border/30 mt-4">
                    <label className="block text-sm font-medium text-foreground mb-2">Payment method</label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={paymentMethod === "cod"}
                          onChange={() => handlePaymentMethodChange("cod")}
                        />
                        Cash on Delivery
                      </label>
                      <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          checked={paymentMethod === "card"}
                          onChange={() => handlePaymentMethodChange("card")}
                        />
                        Pay by card
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Order Summary & Card Details Form */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
              <div className="rounded-xl bg-surface p-6 shadow-sm border border-border/40">
                <h2 className="text-lg font-semibold text-foreground mb-4">Order summary</h2>

                <div className="max-h-60 overflow-y-auto space-y-3 mb-4 pr-1">
                  {shopGroups.map((group) => (
                    <div key={group.shopId} className="border-b border-border/20 pb-3 last:border-b-0">
                      <h3 className="text-sm font-medium text-primary mb-2">{group.shopName || "Shop"}</h3>
                      {group.items.map((item) => (
                        <div key={item.productId} className="flex justify-between text-sm py-1">
                          <span className="text-muted-foreground">
                            {item.name} × {item.qty}
                          </span>
                          <span className="font-medium">${(item.price * item.qty).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className={`${styles.input} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isValidatingCoupon}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary-hover text-sm disabled:opacity-60 cursor-pointer font-medium"
                  >
                    {isValidatingCoupon ? "Checking..." : "Apply"}
                  </button>
                </div>
                {couponError && <p className="mb-2 text-sm text-error">{couponError}</p>}
                {appliedDiscount > 0 && (
                  <p className="mb-2 text-sm text-success">Coupon applied: -${appliedDiscount.toFixed(2)}</p>
                )}

                <div className="pt-4 border-t border-border/30 space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {appliedDiscount > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Discount</span>
                      <span>-${appliedDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border/20">
                    <span>Total</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Enter card details section directly below Total when Pay by card is selected */}
                {paymentMethod === "card" && (
                  <div className="mt-4 pt-4 border-t border-border/30">
                    <h3 className="text-md font-medium text-foreground mb-3">Enter card details</h3>
                    {isPreparingPayment || !cardPaymentIntent ? (
                      // <CardListSkeleton count={2} />
                      <div className="flex flex-col items-center justify-between gap-4">
                        <Skeleton className="h-8.5 w-full" />
                        <Skeleton className="h-8.5 w-full" />
                        <Skeleton className="h-8.5 w-full" />
                      </div>
                      // CardListSkeleton
                      // <p className="text-sm text-muted-foreground py-4 text-center">Preparing payment form...</p>
                    ) : cardPaymentIntent && stripePromise ? (
                      <Elements stripe={stripePromise} options={stripeOptions}>
                        <CardPaymentForm
                          isPlacingOrder={isPlacingOrder}
                          onSuccess={async (paymentIntent) => {
                            const shippingValues = getValues();
                            await placeOrder(shippingValues, { type: "Card", id: paymentIntent.id });
                          }}
                          onError={(message) => setFormError(message)}
                          trigger={trigger}
                        />
                      </Elements>
                    ) : null}
                  </div>
                )}

                {formError && (
                  <p role="alert" className="mt-4 text-sm text-error bg-error/10 p-3 rounded-md">
                    {formError}
                  </p>
                )}

                {/* Main Action Button for Cash on Delivery */}
                {paymentMethod === "cod" && (
                  <button
                    type="submit"
                    disabled={isPlacingOrder}
                    className={`${styles.submit_button} w-full mt-6 disabled:opacity-60`}
                  >
                    <span className="font-[Poppins]">
                      {isPlacingOrder ? "Placing order..." : "Place Order (Cash on Delivery)"}
                    </span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}

function CardPaymentForm({ isPlacingOrder, onSuccess, onError, trigger }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isConfirming, setIsConfirming] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate shipping fields before executing card charge
    const isValid = await trigger();
    if (!isValid) {
      onError("Please fill out all required shipping address fields before paying.");
      return;
    }

    if (!stripe || !elements) return;

    setIsConfirming(true);
    onError(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      setIsConfirming(false);
      onError(error.message || "Your card was not charged. Please try again.");
      return;
    }

    if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
      await onSuccess(paymentIntent);
    } else {
      onError("Payment was not completed. Please try again.");
    }
    setIsConfirming(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || isConfirming || isPlacingOrder}
        className={`${styles.submit_button} w-full mt-2 disabled:opacity-60`}
      >
        <span className="font-[Poppins]">
          {isConfirming || isPlacingOrder ? "Processing payment..." : "Pay and Place Order"}
        </span>
      </button>
    </form>
  );
}

export default function CheckoutFlow() {
  return (
    <ProtectedRoute>
      <CheckoutContent />
    </ProtectedRoute>
  );
}