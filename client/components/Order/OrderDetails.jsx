"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import styles from "@/styles/styles";
import { getErrorMessage } from "@/features/auth/utils";
import { useGetOrderByIdQuery, useRequestOrderRefundMutation } from "@/features/orders/orderApiSlice";
import { useToast } from "@/providers/toast-provider"

function OrderDetailsContent({ orderId }) {
  const toast = useToast();
  const { data, isLoading, isError, error } = useGetOrderByIdQuery(orderId, {
    skip: !orderId,
  });

  const order = data?.order;

  const [requestRefund, { isLoading: isRequestingRefund }] = useRequestOrderRefundMutation();
  const [refundError, setRefundError] = useState(null);
  const [refundSuccess, setRefundSuccess] = useState(false);

  const handleRequestRefund = async () => {
    setRefundError(null);
    try {
      await requestRefund({ id: order._id }).unwrap();
      setRefundSuccess(true);
      toast.showToast({
        title: "Refund requested",
        description: "We'll review your request shortly.",
        variant: "info",
      });
    } catch (error) {
      setRefundError(getErrorMessage(error, "Could not request a refund. Please try again."));
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header activeHeading={0} />
        <main>
          <p className="text-center text-[15px] text-muted-foreground py-20 min-h-[50vh]">Loading order...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div>
        <Header activeHeading={0} />
        <main className="w-full flex flex-col items-center justify-center py-20 min-h-[50vh] gap-4">
          <p className="text-[18px] text-error">
            {getErrorMessage(error, "This order could not be found.")}
          </p>
          <Link href="/orders" className="text-primary hover:underline">
            Back to my orders
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header activeHeading={0} />
      <main className={`${styles.section} py-8`}>
        <div className={`${styles.heading}`}>
          <h1>Order #{order._id.slice(-8).toUpperCase()}</h1>
        </div>

        <div className="rounded-lg bg-surface border border-border p-6 shadow-sm mb-6">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium text-foreground">{order.status}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Placed on</p>
              <p className="font-medium text-foreground">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment</p>
              <p className="font-medium text-foreground">
                {order.paymentInfo?.type || "N/A"} ({order.paymentInfo?.status || "Pending"})
              </p>
            </div>
          </div>

          {order.status === "Delivered" && (
            <div className="mt-4 pt-4 border-t border-border">
              {refundSuccess ? (
                <p className="text-sm text-warning font-medium">Refund requested. We&apos;ll review it shortly.</p>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleRequestRefund}
                    disabled={isRequestingRefund}
                    className="px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary-hover transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {isRequestingRefund ? "Requesting..." : "Request refund"}
                  </button>
                  {refundError && <p className="mt-2 text-sm text-error">{refundError}</p>}
                </>
              )}
            </div>
          )}
          {order.status === "Processing Refund" && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-warning font-medium">Refund requested. Awaiting seller approval.</p>
            </div>
          )}
          {order.status === "Refund Success" && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground font-medium">This order has been refunded.</p>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-surface border border-border p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Items</h2>
          {order.cart.map((item, index) => (
            <div key={item._id || index} className="flex items-center py-3 border-b border-border last:border-b-0">
              <div className="relative w-16 h-16 mr-3 shrink-0 rounded-md overflow-hidden bg-muted">
                <Image
                  src={item.images?.[0]?.url || "/placeholder.png"}
                  alt={item.name || "Product"}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{item.name || "Product"}</p>
                <p className="text-sm text-muted-foreground">Qty: {item.qty}</p>
              </div>
              {item.discountPrice !== undefined && (
                <p className="font-semibold text-foreground">${(item.discountPrice * item.qty).toFixed(2)}</p>
              )}
            </div>
          ))}

          <div className="mt-4 pt-4 border-t border-border space-y-1">
            {order.coupon && (
              <div className="flex justify-between text-sm text-success">
                <span>Coupon ({order.coupon.name})</span>
                <span>-${order.coupon.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-[17px] font-semibold text-foreground">
              <span>Total</span>
              <span>${order.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-surface border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-2">Shipping address</h2>
          <p className="text-sm text-muted-foreground">
            {[
              order.shippingAddress?.address1,
              order.shippingAddress?.address2,
              order.shippingAddress?.city,
              order.shippingAddress?.zipCode,
              order.shippingAddress?.country,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>

        <div className="mt-6">
          <Link href="/orders" className="text-primary hover:underline">
            &larr; Back to my orders
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function OrderDetails({ orderId }) {
  return (
    <ProtectedRoute>
      <OrderDetailsContent orderId={orderId} />
    </ProtectedRoute>
  );
}