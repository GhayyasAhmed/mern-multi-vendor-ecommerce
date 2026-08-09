"use client";
import Pagination from "@/components/ui/Pagination";
import {
  useDeleteSellerAdminMutation,
  useGetAllSellersAdminQuery,
  useUpdateSellerStatusAdminMutation,
} from "@/features/admin/adminApiSlice";
import { getErrorMessage } from "@/features/auth/utils";
import { useConfirm } from "@/providers/confirm-provider";
import { useState } from "react";
import TableSkeleton from "@/components/ui/TableSkeleton";

export default function AdminSellersPage() {
  const [page, setPage] = useState(1);
  const confirm = useConfirm();
  const { data, isLoading, isError } = useGetAllSellersAdminQuery({
    page,
    limit: 20,
  });
  const [deleteSeller, { isLoading: isDeleting }] =
    useDeleteSellerAdminMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] =
    useUpdateSellerStatusAdminMutation();
  const [actionError, setActionError] = useState<string | null>(null);
  const sellers = data?.sellers ?? [];

  const handleDelete = async (id: string, sellerName: string) => {
    setActionError(null);
    const confirmed = await confirm({
      title: "Delete Seller",
      description: `Are you sure you want to delete "${sellerName}" and all their listings? This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await deleteSeller(id).unwrap();
    } catch (err) {
      setActionError(getErrorMessage(err, "Could not delete seller."));
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Sellers</h1>
      {actionError && (
        <p className="text-sm text-red-600 mb-4">{actionError}</p>
      )}
      {isLoading ? (
        <TableSkeleton rows={8} cols={5} />
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
                      onClick={() => handleDelete(seller._id, seller.name)}
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