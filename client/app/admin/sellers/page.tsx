"use client";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { NOTIFICATION_SOUND } from "@/constants";
import {
  adminApiSlice,
  useDeleteSellerAdminMutation,
  useGetAllSellersAdminQuery,
  useUpdateSellerStatusAdminMutation,
} from "@/features/admin/adminApiSlice";
import { getErrorMessage } from "@/features/auth/utils";
import { useSocket } from "@/hooks/use-socket";
import { useConfirm } from "@/providers/confirm-provider";
import { useToast } from "@/providers/toast-provider";
import type { RootState } from "@/store";
import { useAppDispatch } from "@/store/hooks";
import type { IShop } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { AiOutlineShop } from "react-icons/ai";
import { useStore } from "react-redux";

export default function AdminSellersPage() {
  const store = useStore<RootState>();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const toast = useToast();
  const socket = useSocket(true);
  const dispatch = useAppDispatch();
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio(NOTIFICATION_SOUND);
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    audioRef.current?.play().catch(() => {});
  }, []);

  useEffect(() => {
    const handleNotification = (payload: {
      type: string;
      data?: { seller?: IShop };
    }) => {
      if (payload.type === "admin_new_seller" && payload.data?.seller) {
        // unchanged existing logic
        return;
      }
      if (payload.type === "admin_seller_status" && payload.data?.seller) {
        const seller = payload.data.seller;
        adminApiSlice.util
          .selectCachedArgsForQuery(store.getState(), "getAllSellersAdmin")
          .forEach((arg) => {
            dispatch(
              adminApiSlice.util.updateQueryData(
                "getAllSellersAdmin",
                arg,
                (draft) => {
                  const existing = draft.sellers.find(
                    (s) => s._id === seller._id,
                  );
                  if (existing) existing.status = seller.status;
                },
              ),
            );
          });
        playNotificationSound();
      }
    };
    socket.on("notification", handleNotification);
    return () => {
      socket.off("notification", handleNotification);
    };
  }, [socket, dispatch, playNotificationSound, store]);

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
      toast.showToast({
        title: `"${sellerName}" was deleted`,
        variant: "success",
      });
    } catch (err) {
      const message = getErrorMessage(err, "Could not delete seller.");
      setActionError(message);
      toast.showToast({ title: message, variant: "error" });
    }
  };

  const handleStatusChange = async (
    id: string,
    status: "pending" | "active" | "suspended",
    sellerName: string,
  ) => {
    try {
      await updateStatus({ id, status }).unwrap();
      toast.showToast({
        title: `${sellerName} is now ${status}`,
        variant: "success",
      });
    } catch (err) {
      toast.showToast({
        title: getErrorMessage(err, "Could not update seller status."),
        variant: "error",
      });
    }
  };

  const statusSelect = (seller: (typeof sellers)[number]) => (
    <select
      value={seller.status}
      disabled={isUpdatingStatus}
      onChange={(e) =>
        handleStatusChange(
          seller._id,
          e.target.value as "pending" | "active" | "suspended",
          seller.name,
        )
      }
      className="min-h-11 border border-border rounded-md px-2 text-sm bg-surface"
    >
      <option value="pending">Pending</option>
      <option value="active">Active</option>
      <option value="suspended">Suspended</option>
    </select>
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Sellers</h1>
      {actionError && <p className="text-sm text-error mb-4">{actionError}</p>}
      {isLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : isError ? (
        <p className="text-sm text-error">Could not load sellers.</p>
      ) : sellers.length === 0 ? (
        <EmptyState icon={<AiOutlineShop size={26} />} title="No sellers yet" />
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="md:hidden divide-y divide-border rounded-lg bg-surface shadow-sm overflow-hidden">
            {sellers.map((seller) => (
              <div key={seller._id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{seller.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {seller.email}
                    </p>
                  </div>
                  <p className="font-medium shrink-0">
                    ${(seller.availableBalance || 0).toFixed(2)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Joined{" "}
                  {seller.createdAt
                    ? new Date(seller.createdAt).toLocaleDateString()
                    : "-"}
                </p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  {statusSelect(seller)}
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => handleDelete(seller._id, seller.name)}
                    className="min-h-11 px-2 text-error text-sm font-medium disabled:opacity-60 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block bg-surface rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
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
                  <tr key={seller._id} className="border-t border-border">
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
                    <td className="px-4 py-3">{statusSelect(seller)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleDelete(seller._id, seller.name)}
                        className="text-error hover:underline disabled:opacity-60 cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
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
