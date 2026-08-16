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

function statusBadgeClass(status) {
  if (status === "Delivered") return "bg-success-bg text-success";
  if (status === "Refund Success") return "bg-muted text-muted-foreground";
  return "bg-info-bg text-info";
}

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
      <main className={`${styles.section} py-8 min-h-[60vh]`}>
        <div className={`${styles.heading}`}>
          <h1>My Orders</h1>
        </div>

        {isLoading ? (
          <CardListSkeleton count={4} />
        ) : isError ? (
          <p className="text-center text-[15px] text-error py-12">
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
                  className="block rounded-lg bg-surface border border-border p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Order #{order._id.slice(-8).toUpperCase()}</p>
                      <p className="text-sm text-muted-foreground">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                      <p className="font-semibold text-[17px] pt-1 text-foreground">${order.totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{order.cart.length} item(s)</p>
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
      </main>
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