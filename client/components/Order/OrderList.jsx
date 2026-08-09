"use client";

import Footer from "@/components/Layout/Footer";
import Header from "@/components/Layout/Header";
import CardListSkeleton from "@/components/ui/CardListSkeleton";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getErrorMessage } from "@/features/auth/utils";
import { useGetMyOrdersQuery } from "@/features/orders/orderApiSlice";
import styles from "@/styles/styles";
import Link from "next/link";
import { useState } from "react";
import { AiOutlineFileText } from "react-icons/ai";

function OrderListContent() {
  const { user } = useCurrentUser();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useGetMyOrdersQuery(
    { id: user?._id, page },
    { skip: !user?._id }
  );

  const orders = data?.orders ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <Header activeHeading={0} />
      <div className={`${styles.section} py-8 min-h-[60vh]`}>
        <div className={`${styles.heading}`}>
          <h1>My Orders</h1>
        </div>

        {isLoading ? (
          <CardListSkeleton count={4} />
        ) : isError ? (
          <p className="text-center text-[15px] text-red-500 py-12">
            {getErrorMessage(error, "Could not load your orders.")}
          </p>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<AiOutlineFileText size={26} />}
            title="You haven't placed any orders yet"
            actionLabel="Start shopping"
            actionHref="/products"
          />
        ) : (
          <>
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
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${order.status === "Delivered"
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
            {pagination && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            )}
          </>
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