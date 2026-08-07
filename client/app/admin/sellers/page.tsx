"use client";
import { useState } from "react";
import {
  useGetAllSellersAdminQuery,
  useDeleteSellerAdminMutation,
  useUpdateSellerStatusAdminMutation,
} from "@/features/admin/adminApiSlice";
import Pagination from "@/components/ui/Pagination";

export default function AdminSellersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useGetAllSellersAdminQuery({
    page,
    limit: 20,
  });
  const [deleteSeller, { isLoading: isDeleting }] =
    useDeleteSellerAdminMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] =
    useUpdateSellerStatusAdminMutation();
  const sellers = data?.sellers ?? [];

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Delete this seller and all their listings? This cannot be undone.",
      )
    )
      return;
    try {
      await deleteSeller(id).unwrap();
    } catch {
      // list stays as-is on failure; admin can retry
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Sellers</h1>
      {isLoading ? (
        <p className="text-sm text-[#00000082]">Loading sellers...</p>
      ) : isError ? (
        <p className="text-sm text-red-500">Could not load sellers.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#f5f5f5] text-left">
              <tr>
                <th className="px-4 py-3">Shop</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sellers.map((seller) => (
                <tr key={seller._id} className="border-t">
                  <td className="px-4 py-3">{seller.name}</td>
                  <td className="px-4 py-3">{seller.email}</td>
                  <td className="px-4 py-3">
                    ${(seller.availableBalance || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    {seller.createdAt
                      ? new Date(seller.createdAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={seller.status}
                      disabled={isUpdatingStatus}
                      onChange={(e) =>
                        updateStatus({
                          id: seller._id,
                          status: e.target.value as
                            | "pending"
                            | "active"
                            | "suspended",
                        })
                      }
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleDelete(seller._id)}
                      className="text-red-600 hover:underline disabled:opacity-60 cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
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
