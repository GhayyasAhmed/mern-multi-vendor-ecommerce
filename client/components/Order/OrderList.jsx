"use client";

import Link from "next/link";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import styles from "@/styles/styles";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useGetMyOrdersQuery } from "@/features/orders/orderApiSlice";
import { getErrorMessage } from "@/features/auth/utils";

function OrderListContent() {
  const { user } = useCurrentUser();
  const { data, isLoading, isError, error } = useGetMyOrdersQuery(user?._id, {
    skip: !user?._id,
  });

  const orders = data?.orders ?? [];

  return (
    <div>
      <Header activeHeading={0} />
      <div className={`${styles.section} py-8 min-h-[60vh]`}>
        <div className={`${styles.heading}`}>
          <h1>My Orders</h1>
        </div>

        {isLoading ? (
          <p className="text-center text-[15px] text-[#00000082] py-12">Loading your orders...</p>
        ) : isError ? (
          <p className="text-center text-[15px] text-red-500 py-12">
            {getErrorMessage(error, "Could not load your orders.")}
          </p>
        ) : orders.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-[15px] text-[#00000082]">You haven&apos;t placed any orders yet.</p>
            <Link href="/products" className="text-[#3957db] hover:underline">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order._id}
                href={`/orders/${order._id}`}
                className="block rounded-lg bg-white p-5 shadow-sm hover:shadow-md transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-[#00000082]">Order #{order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-sm text-[#00000082]">
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === "Delivered"
                          ? "bg-green-100 text-green-700"
                          : order.status === "Refund Success"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {order.status}
                    </span>
                    <p className="font-semibold text-[17px] pt-1">${order.totalPrice.toFixed(2)}</p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-[#00000082]">{order.cart.length} item(s)</p>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default function OrderList() {
  return (
    <ProtectedRoute>
      <OrderListContent />
    </ProtectedRoute>
  );
}