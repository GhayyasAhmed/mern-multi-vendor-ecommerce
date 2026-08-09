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
        <p className="text-center text-[15px] text-[#00000082] py-20 min-h-[50vh]">Loading order...</p>
        <Footer />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div>
        <Header activeHeading={0} />
        <div className="w-full flex flex-col items-center justify-center py-20 min-h-[50vh] gap-4">
          <p className="text-[18px] text-red-500">
            {getErrorMessage(error, "This order could not be found.")}
          </p>
          <Link href="/orders" className="text-[#3957db] hover:underline">
            Back to my orders
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header activeHeading={0} />
      <div className={`${styles.section} py-8`}>
        <div className={`${styles.heading}`}>
          <h1>Order #{order._id.slice(-8).toUpperCase()}</h1>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm mb-6">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="text-sm text-[#00000082]">Status</p>
              <p className="font-medium">{order.status}</p>
            </div>
            <div>
              <p className="text-sm text-[#00000082]">Placed on</p>
              <p className="font-medium">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-[#00000082]">Payment</p>
              <p className="font-medium">
                {order.paymentInfo?.type || "N/A"} ({order.paymentInfo?.status || "Pending"})
              </p>
            </div>
          </div>

          {order.status === "Delivered" && (
            <div className="mt-4 pt-4 border-t">
              {refundSuccess ? (
                <p className="text-sm text-amber-600 font-medium">Refund requested. We&apos;ll review it shortly.</p>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleRequestRefund}
                    disabled={isRequestingRefund}
                    className="px-4 py-2 rounded-md bg-black text-white text-sm disabled:opacity-60 cursor-pointer"
                  >
                    {isRequestingRefund ? "Requesting..." : "Request refund"}
                  </button>
                  {refundError && <p className="mt-2 text-sm text-red-600">{refundError}</p>}
                </>
              )}
            </div>
          )}
          {order.status === "Processing Refund" && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-amber-600 font-medium">Refund requested. Awaiting seller approval.</p>
            </div>
          )}
          {order.status === "Refund Success" && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500 font-medium">This order has been refunded.</p>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-[#333] mb-4">Items</h2>
          {order.cart.map((item, index) => (
            <div key={item._id || index} className="flex items-center py-3 border-b last:border-b-0">
              <div className="relative w-16 h-16 mr-3 shrink-0">
                <Image
                  src={item.images?.[0]?.url || "/placeholder.png"}
                  alt={item.name || "Product"}
                  fill
                  className="object-cover rounded-[5px]"
                />
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.name || "Product"}</p>
                <p className="text-sm text-[#00000082]">Qty: {item.qty}</p>
              </div>
              {item.discountPrice !== undefined && (
                <p className="font-semibold">${(item.discountPrice * item.qty).toFixed(2)}</p>
              )}
            </div>
          ))}

          <div className="mt-4 pt-4 border-t space-y-1">
            {order.coupon && (
              <div className="flex justify-between text-sm text-green-700">
                <span>Coupon ({order.coupon.name})</span>
                <span>-${order.coupon.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-[17px] font-semibold">
              <span>Total</span>
              <span>${order.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#333] mb-2">Shipping address</h2>
          <p className="text-sm text-[#00000082]">
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
          <Link href="/orders" className="text-[#3957db] hover:underline">
            &larr; Back to my orders
          </Link>
        </div>
      </div>
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