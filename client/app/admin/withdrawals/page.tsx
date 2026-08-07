"use client";
import { useState } from "react";
import { useGetAllWithdrawsAdminQuery, useUpdateWithdrawAdminMutation } from "@/features/admin/adminApiSlice";
import Pagination from "@/components/ui/Pagination";

export default function AdminWithdrawalsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useGetAllWithdrawsAdminQuery({ page, limit: 20 });
  const [updateWithdraw, { isLoading: isUpdating }] = useUpdateWithdrawAdminMutation();
  const withdraws = data?.withdraws ?? [];

  const handleApprove = async (id: string, sellerId: string) => {
    try {
      await updateWithdraw({ id, sellerId }).unwrap();
    } catch {
      // list stays as-is on failure; admin can retry
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Withdrawal requests</h1>
      {isLoading ? (
        <p className="text-sm text-[#00000082]">Loading withdrawal requests...</p>
      ) : isError ? (
        <p className="text-sm text-red-500">Could not load withdrawal requests.</p>
      ) : withdraws.length === 0 ? (
        <p className="text-sm text-[#00000082]">No withdrawal requests.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#f5f5f5] text-left">
              <tr>
                <th className="px-4 py-3">Seller</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {withdraws.map((withdraw) => (
                <tr key={withdraw._id} className="border-t">
                  <td className="px-4 py-3">{withdraw.seller?.name || withdraw.seller?._id}</td>
                  <td className="px-4 py-3">${withdraw.amount.toFixed(2)}</td>
                  <td className="px-4 py-3">{withdraw.status}</td>
                  <td className="px-4 py-3">{new Date(withdraw.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    {withdraw.status === "Processing" && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleApprove(withdraw._id, withdraw.seller._id)}
                        className="text-[#3957db] hover:underline disabled:opacity-60 cursor-pointer"
                      >
                        Mark as paid
                      </button>
                    )}
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