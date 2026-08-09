"use client";
import { useState } from "react";
import {
  useGetAllWithdrawsAdminQuery,
  useRejectWithdrawAdminMutation,
  useUpdateWithdrawAdminMutation,
} from "@/features/admin/adminApiSlice";
import Pagination from "@/components/ui/Pagination";
import { getErrorMessage } from "@/features/auth/utils";
import { useConfirm } from "@/providers/confirm-provider";

export default function AdminWithdrawalsPage() {
  const [page, setPage] = useState(1);
  const confirm = useConfirm();
  const { data, isLoading, isError } = useGetAllWithdrawsAdminQuery({
    page,
    limit: 20,
  });
  const [updateWithdraw, { isLoading: isUpdating }] =
    useUpdateWithdrawAdminMutation();
  const [rejectWithdraw, { isLoading: isRejecting }] =
    useRejectWithdrawAdminMutation();
  const [actionError, setActionError] = useState<string | null>(null);
  const withdraws = data?.withdraws ?? [];

  const handleApprove = async (id: string, sellerId: string, amount: number, sellerName: string) => {
    setActionError(null);
    const confirmed = await confirm({
      title: "Mark Withdrawal as Paid",
      description: `Are you sure you want to mark the withdrawal of $${amount.toFixed(2)} for "${sellerName}" as paid?`,
      confirmLabel: "Mark as Paid",
      variant: "default",
    });

    if (!confirmed) return;

    try {
      await updateWithdraw({ id, sellerId }).unwrap();
    } catch (err) {
      setActionError(getErrorMessage(err, "Could not approve withdrawal."));
    }
  };

  const handleReject = async (id: string, sellerName: string) => {
    setActionError(null);
    const confirmed = await confirm({
      title: "Reject Withdrawal",
      description: `Are you sure you want to reject the withdrawal request for "${sellerName}"? This action cannot be undone.`,
      confirmLabel: "Reject",
      variant: "danger",
    });

    if (!confirmed) return;

    const reason =
      window.prompt("Reason for rejecting this withdrawal (optional):") ??
      undefined;

    try {
      await rejectWithdraw({ id, reason }).unwrap();
    } catch (err) {
      setActionError(getErrorMessage(err, "Could not reject withdrawal."));
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Withdrawal requests</h1>
      {actionError && (
        <p className="text-sm text-red-600 mb-4">{actionError}</p>
      )}
      {isLoading ? (
        <p className="text-sm text-[#00000082]">
          Loading withdrawal requests...
        </p>
      ) : isError ? (
        <p className="text-sm text-red-500">
          Could not load withdrawal requests.
        </p>
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
              {withdraws.map((withdraw) => {
                const sellerName = withdraw.seller?.name || withdraw.seller?._id || "Unknown Seller";
                return (
                  <tr key={withdraw._id} className="border-t">
                    <td className="px-4 py-3">
                      {sellerName}
                    </td>
                    <td className="px-4 py-3">${withdraw.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">{withdraw.status}</td>
                    <td className="px-4 py-3">
                      {new Date(withdraw.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {withdraw.status === "Processing" && (
                        <>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              handleApprove(withdraw._id, withdraw.seller._id, withdraw.amount, sellerName)
                            }
                            className="text-[#3957db] hover:underline disabled:opacity-60 cursor-pointer"
                          >
                            Mark as paid
                          </button>
                          <button
                            type="button"
                            disabled={isRejecting}
                            onClick={() => handleReject(withdraw._id, sellerName)}
                            className="ml-3 text-red-600 hover:underline disabled:opacity-60 cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
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