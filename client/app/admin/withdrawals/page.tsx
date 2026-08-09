"use client";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import TableSkeleton from "@/components/ui/TableSkeleton";
import {
  useGetAllWithdrawsAdminQuery,
  useRejectWithdrawAdminMutation,
  useUpdateWithdrawAdminMutation,
} from "@/features/admin/adminApiSlice";
import { getErrorMessage } from "@/features/auth/utils";
import { useConfirm } from "@/providers/confirm-provider";
import { useState } from "react";
import { AiOutlineDollarCircle } from "react-icons/ai";
import { useToast } from "@/providers/toast-provider";

export default function AdminWithdrawalsPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const confirm = useConfirm();
  const { data, isLoading, isError } = useGetAllWithdrawsAdminQuery({
    page,
    limit: 20,
  });
  const [updateWithdraw, { isLoading: isUpdating }] = useUpdateWithdrawAdminMutation();
  const [rejectWithdraw, { isLoading: isRejecting }] = useRejectWithdrawAdminMutation();
  const [actionError, setActionError] = useState<string | null>(null);
  const withdraws = data?.withdraws ?? [];

  const handleApprove = async (id: string, sellerId: string, amount: number, sellerName: string) => {
    setActionError(null);
    const confirmed = await confirm({ title: "Mark Withdrawal as Paid", description: `Are you sure you want to mark the withdrawal of $${amount.toFixed(2)} for "${sellerName}" as paid?`, confirmLabel: "Mark as Paid", variant: "default" });
    if (!confirmed) return;
    try {
      await updateWithdraw({ id, sellerId }).unwrap();
      toast.showToast({ title: `Marked $${amount.toFixed(2)} withdrawal for "${sellerName}" as paid`, variant: "success" });
    } catch (err) {
      const message = getErrorMessage(err, "Could not approve withdrawal.");
      setActionError(message);
      toast.showToast({ title: message, variant: "error" });
    }
  };

  const handleReject = async (id: string, sellerName: string) => {
    setActionError(null);
    const confirmed = await confirm({ title: "Reject Withdrawal", description: `Are you sure you want to reject the withdrawal request for "${sellerName}"? This action cannot be undone.`, confirmLabel: "Reject", variant: "danger" });
    if (!confirmed) return;
    const reason = window.prompt("Reason for rejecting this withdrawal (optional):") ?? undefined;
    try {
      await rejectWithdraw({ id, reason }).unwrap();
      toast.showToast({ title: `Withdrawal request for "${sellerName}" rejected`, variant: "success" });
    } catch (err) {
      const message = getErrorMessage(err, "Could not reject withdrawal.");
      setActionError(message);
      toast.showToast({ title: message, variant: "error" });
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Withdrawal requests</h1>
      {actionError && <p className="text-sm text-error mb-4">{actionError}</p>}
      {isLoading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : isError ? (
        <p className="text-sm text-error">Could not load withdrawal requests.</p>
      ) : withdraws.length === 0 ? (
        <EmptyState icon={<AiOutlineDollarCircle size={26} />} title="No withdrawal requests" />
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="md:hidden divide-y divide-border rounded-lg bg-surface shadow-sm overflow-hidden">
            {withdraws.map((withdraw) => {
              const sellerName = withdraw.seller?.name || withdraw.seller?._id || "Unknown Seller";
              return (
                <div key={withdraw._id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{sellerName}</p>
                      <p className="text-xs text-muted-foreground">
                        Requested {new Date(withdraw.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${withdraw.amount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{withdraw.status}</p>
                    </div>
                  </div>
                  {withdraw.status === "Processing" && (
                    <div className="mt-3 flex gap-4">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleApprove(withdraw._id, withdraw.seller._id, withdraw.amount, sellerName)}
                        className="min-h-11 px-2 -ml-2 text-primary text-sm font-medium disabled:opacity-60 cursor-pointer"
                      >
                        Mark as paid
                      </button>
                      <button
                        type="button"
                        disabled={isRejecting}
                        onClick={() => handleReject(withdraw._id, sellerName)}
                        className="min-h-11 px-2 text-error text-sm font-medium disabled:opacity-60 cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block bg-surface rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
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
                    <tr key={withdraw._id} className="border-t border-border">
                      <td className="px-4 py-3">{sellerName}</td>
                      <td className="px-4 py-3">${withdraw.amount.toFixed(2)}</td>
                      <td className="px-4 py-3">{withdraw.status}</td>
                      <td className="px-4 py-3">{new Date(withdraw.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        {withdraw.status === "Processing" && (
                          <>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleApprove(withdraw._id, withdraw.seller._id, withdraw.amount, sellerName)}
                              className="text-primary hover:underline disabled:opacity-60 cursor-pointer"
                            >
                              Mark as paid
                            </button>
                            <button
                              type="button"
                              disabled={isRejecting}
                              onClick={() => handleReject(withdraw._id, sellerName)}
                              className="ml-3 text-error hover:underline disabled:opacity-60 cursor-pointer"
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