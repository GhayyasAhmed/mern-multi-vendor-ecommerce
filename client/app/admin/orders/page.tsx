"use client";
import Link from "next/link";
import { useState } from "react";
import { useGetAllOrdersAdminQuery } from "@/features/admin/adminApiSlice";
import Pagination from "@/components/ui/Pagination";

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useGetAllOrdersAdminQuery({ page, limit: 20 });
  const orders = data?.orders ?? [];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Orders</h1>
      {isLoading ? (
        <p className="text-sm text-[#00000082]">Loading orders...</p>
      ) : isError ? (
        <p className="text-sm text-red-500">Could not load orders.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#f5f5f5] text-left">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="border-t">
                  <td className="px-4 py-3">
                    <Link href={`/orders/${order._id}`} className="text-[#3957db] hover:underline">
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