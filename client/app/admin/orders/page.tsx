"use client";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { useGetAllOrdersAdminQuery } from "@/features/admin/adminApiSlice";
import Link from "next/link";
import { useState } from "react";
import { AiOutlineFileText } from "react-icons/ai";

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useGetAllOrdersAdminQuery({
    page,
    limit: 20,
  });
  const orders = data?.orders ?? [];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Orders</h1>
      {isLoading ? (
        <TableSkeleton rows={8} cols={4} />
      ) : isError ? (
        <p className="text-sm text-error">Could not load orders.</p>
      ) : orders.length === 0 ? (
        <EmptyState icon={<AiOutlineFileText size={26} />} title="No orders yet" />
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="md:hidden divide-y divide-border rounded-lg bg-surface shadow-sm overflow-hidden">
            {orders.map((order) => (
              <Link
                key={order._id}
                href={`/orders/${order._id}`}
                className="block p-4 min-h-11"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-primary">
                    #{order._id.slice(-8).toUpperCase()}
                  </span>
                  <span className="font-semibold">${order.totalPrice.toFixed(2)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
                  <span>{order.status}</span>
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block bg-surface rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Placed</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <Link href={`/orders/${order._id}`} className="text-primary hover:underline">
                        #{order._id.slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{order.status}</td>
                    <td className="px-4 py-3">${order.totalPrice.toFixed(2)}</td>
                    <td className="px-4 py-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {data?.pagination && (
        <Pagination
          currentPage={data.pagination.currentPage}
          totalPages={data.pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}