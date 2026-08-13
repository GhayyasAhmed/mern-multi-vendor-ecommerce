"use client";

import InboxPanel from "@/components/Inbox/InboxPanel";
import NotificationBell from "@/components/Layout/NotificationBell";
import CardListSkeleton from "@/components/ui/CardListSkeleton";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { NOTIFICATION_SOUND, PRODUCT_CATEGORIES } from "@/constants";
import { getErrorMessage, readFileAsBase64 } from "@/features/auth/utils";
import {
  useCreateCouponCodeMutation,
  useDeleteCouponCodeMutation,
  useGetShopCouponsQuery,
} from "@/features/coupons/couponApiSlice";
import type { IEvent } from "@/features/events/eventApiSlice";
import {
  useCreateEventMutation,
  useDeleteEventMutation,
  useGetShopEventsQuery,
  useUpdateEventMutation,
} from "@/features/events/eventApiSlice";
import {
  useGetSellerOrdersQuery,
  useOrderRefundSuccessMutation,
  useUpdateOrderStatusMutation,
} from "@/features/orders/orderApiSlice";
import {
  useCreateProductMutation,
  useDeleteProductMutation,
  useGetShopProductsQuery,
  useUpdateProductMutation,
} from "@/features/products/productApiSlice";
import {
  useDeleteWithdrawMethodMutation,
  useUpdatePaymentMethodsMutation,
  WithdrawMethodInput,
} from "@/features/shop/shopApiSlice";
import {
  useCreateWithdrawRequestMutation,
  useGetMyWithdrawRequestsQuery,
} from "@/features/withdraw/withdrawApiSlice";
import { shopApiSlice } from "@/features/shop/shopApiSlice";
import { apiSlice } from "@/lib/api/apiSlice";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import {
  blockNonIntegerKeys,
  blockNonPriceKeys,
  sanitizeDigitsOnly,
  sanitizePriceString,
  todayDateString,
  validateImageFile,
} from "@/lib/validation";
import { useConfirm } from "@/providers/confirm-provider";
import { useToast } from "@/providers/toast-provider";
import { useAppDispatch } from "@/store/hooks";
import styles from "@/styles/styles";
import type { IProduct, IShop } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import {
  AiOutlineCalendar, AiOutlineFileText, AiOutlineShoppingCart,
  AiOutlineTag
} from "react-icons/ai";
import { RxAvatar } from "react-icons/rx";
import { useCurrentSeller } from "../hooks/useCurrentSeller";
import {
  useUpdateSellerInfoMutation,
  useUpdateShopAvatarMutation,
} from "../shopApiSlice";
import {
  eventFormSchema,
  imageListValidation,
  productFormSchema,
  type EventFormValues,
  type ProductFormValues,
} from "../validators";
import ShopLogoutButton from "./ShopLogoutButton";

type Tab =
  | "profile"
  | "products"
  | "events"
  | "orders"
  | "payouts"
  | "coupons"
  | "messages";

const TABS: Tab[] = [
  "profile",
  "products",
  "events",
  "orders",
  "payouts",
  "coupons",
  "messages",
];

const ORDER_STATUSES = [
  "Processing",
  "Transferred to delivery partner",
  "Shipped",
  "On the way",
  "Delivered",
];

export default function SellerDashboard() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { seller } = useCurrentSeller();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  
  const tabFromUrl = searchParams.get("tab") as Tab | null;
  const tab: Tab =
    tabFromUrl && TABS.includes(tabFromUrl) ? tabFromUrl : "profile";

  const setTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    if (next !== "messages") {
      params.delete("conversation");
    }
    router.replace(`/seller/dashboard?${params.toString()}`, { scroll: false });
  };

  const toast = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio(NOTIFICATION_SOUND);
    }
  }, []);

   const playNotificationSound = useCallback(() => {
    audioRef.current?.play().catch(() => {});
  }, []);

  useEffect(() => {
    if (!seller?._id) return;

    const socket = connectSocket();

    const handleNotification = (payload: { type: string; message: string; link?: string }) => {
      // dispatch(apiSlice.util.invalidateTags([{ type: "Notification", id: "LIST" }]));

      if (payload.type === "new_order") {
        dispatch(apiSlice.util.invalidateTags([
          { type: "Order", id: "SELLER-LIST" },
          { type: "AdminStats", id: "OVERVIEW" },
        ]));
        toast.showToast({ title: "New order received", description: payload.message, variant: "success" });
      } else if (payload.type === "refund_requested") {
        dispatch(apiSlice.util.invalidateTags([{ type: "Order", id: "SELLER-LIST" }]));
        toast.showToast({ title: "Refund requested", description: payload.message, variant: "warning" });
      } else if (payload.type === "withdraw_approved" || payload.type === "withdraw_rejected") {
        dispatch(apiSlice.util.invalidateTags([{ type: "Withdraw", id: "MY-LIST" }]));
        toast.showToast({
          title: payload.message,
          variant: payload.type === "withdraw_approved" ? "success" : "warning",
        });
      } else if (payload.type === "shop_status") {
        dispatch(apiSlice.util.invalidateTags(["Shop"]));
        toast.showToast({ title: payload.message, variant: "info" });
      } else if (payload.type === "new_message") {
        dispatch(apiSlice.util.invalidateTags([{ type: "Conversation", id: "SELLER-LIST" }]));
      }

      playNotificationSound();
    };

    // Real-time balance sync: patches the cached seller/shop details
    // directly (no manual refetch) e.g. when an admin rejects a withdrawal
    // and the reserved amount is returned to availableBalance.
    const handleBalanceUpdated = (payload: { availableBalance: number; owedBalance?: number }) => {
      dispatch(
        shopApiSlice.util.updateQueryData("getSellerDetails", undefined, (draft) => {
          draft.seller.availableBalance = payload.availableBalance;
          if (payload.owedBalance !== undefined) draft.seller.owedBalance = payload.owedBalance;
        })
      );
    };

   
    socket.on("notification", handleNotification);
    socket.on("sellerBalanceUpdated", handleBalanceUpdated);

    return () => {
      socket.off("notification", handleNotification);
      socket.off("sellerBalanceUpdated", handleBalanceUpdated);
      disconnectSocket();
    };
  }, [seller?._id, toast, dispatch, playNotificationSound]);

  if (!seller) return null;

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="bg-brand text-brand-foreground">
        <div className="w-11/12 mx-auto py-6 flex flex-col md:flex-row items-center md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-15 h-15 rounded-full overflow-hidden border-2 border-brand-foreground/30 shrink-0">
              <Image
                src={seller.avatar?.url || "/placeholder.png"}
                alt={seller.name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{seller.name}</h1>
              <Link
                href={`/shop/preview/${seller._id}`}
                className="text-sm text-brand-foreground/80 hover:underline"
              >
                View public shop page
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <p className="hidden sm:block text-sm">
              Balance:{" "}
              <span className="font-semibold">
                ${(seller.availableBalance || 0).toFixed(2)}
              </span>
            </p>
            <ThemeToggle className="h-9 w-9 flex items-center justify-center rounded-full text-brand-foreground/90 hover:bg-brand-foreground/10 cursor-pointer" />
            <NotificationBell enabled={true} />
            <ShopLogoutButton className="text-sm font-medium cursor-pointer text-brand-foreground hover:text-red-200" />
          </div>
        </div>
      </div>

      {seller.status !== "active" && (
        <div className="w-11/12 mx-auto mt-4 rounded-md bg-warning-bg border border-warning/30 text-warning text-sm px-4 py-3">
          {seller.status === "pending"
            ? "Your shop is awaiting admin approval. You can't create products or events until it's approved."
            : "Your shop has been suspended. Listing management is disabled."}
        </div>
      )}

      <div className="w-11/12 mx-auto py-6">
        <div className="flex gap-4 border-b border-border mb-6 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`shrink-0 whitespace-nowrap min-h-11 pb-3 px-2 text-sm font-medium capitalize cursor-pointer ${
                tab === t
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "profile" && <ProfilePanel />}
        {tab === "products" && (
          <ProductsPanel seller={seller} shopId={seller._id} />
        )}
        {tab === "events" && (
          <EventsPanel seller={seller} shopId={seller._id} />
        )}
        {tab === "orders" && <OrdersPanel shopId={seller._id} />}
        {tab === "payouts" && (
          <PayoutsPanel
            availableBalance={seller.availableBalance}
            owedBalance={seller.owedBalance}
          />
        )}
        {tab === "messages" && <MessagesPanel sellerId={seller._id} />}
        {tab === "coupons" && <CouponsPanel />}
      </div>
    </div>
  );
}

function OrdersPanel({ shopId }: { shopId: string }) {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useGetSellerOrdersQuery({
    id: shopId,
    page,
    limit: 10,
  });
  const [updateOrderStatus, { isLoading: isUpdating }] =
    useUpdateOrderStatusMutation();
  const [approveRefund, { isLoading: isRefunding }] =
    useOrderRefundSuccessMutation();
  const [actionError, setActionError] = useState<string | null>(null);

  const orders = data?.orders ?? [];
  const pagination = data?.pagination;

  const handleStatusChange = async (orderId: string, status: string) => {
    setActionError(null);
    try {
      await updateOrderStatus({ id: orderId, shopId, status }).unwrap();
    } catch (err) {
      setActionError(getErrorMessage(err, "Could not update order status."));
    }
  };

  const handleApproveRefund = async (orderId: string) => {
    setActionError(null);
    try {
      await approveRefund({ id: orderId }).unwrap();
      toast.showToast({ title: "Refund approved", variant: "success" });
    } catch (err) {
      setActionError(getErrorMessage(err, "Could not approve refund."));
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">Orders</h2>
      {actionError && <p className="text-sm text-error mb-3">{actionError}</p>}

      {isLoading ? (
        <CardListSkeleton count={4} />
      ) : isError ? (
        <p className="text-[15px] text-error py-8">
          {getErrorMessage(error, "Could not load orders.")}
        </p>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<AiOutlineFileText size={26} />}
          title="No orders for your shop yet"
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-surface border border-border rounded-lg shadow-sm p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Order #{order._id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Placed {new Date(order.createdAt).toLocaleString()} &middot;{" "}
                    {order.cart.length} item(s)
                  </p>
                </div>
                <p className="font-semibold text-foreground">
                  ${order.totalPrice.toFixed(2)}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {order.status === "Processing Refund" ? (
                  <>
                    <span className="text-sm text-warning font-medium">
                      Refund requested
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApproveRefund(order._id)}
                      disabled={isRefunding}
                      className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm disabled:opacity-60 cursor-pointer"
                    >
                      {isRefunding ? "Approving..." : "Approve refund"}
                    </button>
                  </>
                ) : order.status === "Refund Success" ? (
                  <span className="text-sm text-muted-foreground">
                    Refunded
                  </span>
                ) : (
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order._id, e.target.value)
                    }
                    disabled={isUpdating || order.status === "Delivered"}
                    className="border border-input bg-surface text-foreground rounded-md px-2 py-1.5 text-sm disabled:opacity-60"
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

function MessagesPanel({ sellerId }: { sellerId: string }) {
  return <InboxPanel role="seller" identityId={sellerId} />;
}

const WITHDRAW_STATUS_STYLES: Record<string, string> = {
  Processing: "bg-warning-bg text-warning border border-warning/30",
  succeed: "bg-success-bg text-success border border-success/30",
};

function PayoutsPanel({
  availableBalance,
  owedBalance,
}: {
  availableBalance: number;
  owedBalance?: number;
}) {
  const { seller } = useCurrentSeller();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useGetMyWithdrawRequestsQuery({
    page,
    limit: 10,
  });
  const [createWithdrawRequest, { isLoading: isRequesting }] =
    useCreateWithdrawRequestMutation();
  const [amount, setAmount] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const withdraws = data?.withdraws ?? [];
  const pagination = data?.pagination;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setFormError("Please enter a valid amount");
      return;
    }
    if (numericAmount > availableBalance) {
      setFormError(`You can withdraw at most $${availableBalance.toFixed(2)}`);
      return;
    }

    try {
      await createWithdrawRequest({ amount: numericAmount }).unwrap();
      setSuccessMessage("Withdrawal request submitted.");
      setAmount("");
    } catch (err) {
      setFormError(
        getErrorMessage(err, "Could not submit withdrawal request."),
      );
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {seller?.withdrawMethod && (
        <BankDetailsForm withdrawMethod={seller.withdrawMethod} />
      )}
      {!seller?.withdrawMethod && (
        <BankDetailsForm withdrawMethod={undefined} />
      )}
      <div className="bg-surface border border-border rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Request a payout
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Available balance:{" "}
          <span className="font-semibold text-foreground">
            ${availableBalance.toFixed(2)}
          </span>
        </p>
        {Boolean(owedBalance && owedBalance > 0) && (
          <p className="mb-4 rounded-md bg-warning-bg border border-warning/30 text-warning text-sm px-3 py-2">
            ${owedBalance!.toFixed(2)} from recent refunds could not be
            recovered from your available balance and will be deducted from
            future order earnings before they become available to withdraw.
          </p>
        )}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            type="number"
            min="0.01"
            step="0.01"
            max={availableBalance}
            placeholder="Amount"
            inputMode="decimal"
            aria-describedby="withdraw-amount-hint"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${styles.input} sm:max-w-40`}
          />
          <button
            type="submit"
            disabled={isRequesting}
            className={`${styles.submit_button} sm:w-auto disabled:opacity-60`}
          >
            <span className="font-[Poppins]">
              {isRequesting ? "Requesting..." : "Request withdrawal"}
            </span>
          </button>
        </form>
        <p id="withdraw-amount-hint" className="sr-only">
          Enter an amount up to your available balance of $
          {availableBalance.toFixed(2)}
        </p>
        {formError && <p className="mt-2 text-sm text-error">{formError}</p>}
        {successMessage && (
          <p className="mt-2 text-sm text-success">{successMessage}</p>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Withdrawal history
        </h2>
        {isLoading ? (
          <p className="text-[15px] text-muted-foreground py-4">
            Loading withdrawal requests...
          </p>
        ) : isError ? (
          <p className="text-[15px] text-error py-4">
            {getErrorMessage(error, "Could not load withdrawal requests.")}
          </p>
        ) : withdraws.length === 0 ? (
          <p className="text-[15px] text-muted-foreground py-4">
            You haven&apos;t requested any withdrawals yet.
          </p>
        ) : (
          <div className="space-y-3">
            {withdraws.map((withdraw) => (
              <div
                key={withdraw._id}
                className="flex items-center justify-between bg-surface border border-border rounded-lg shadow-sm p-4"
              >
                <div>
                  <p className="font-medium text-foreground">
                    ${withdraw.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Requested{" "}
                    {new Date(withdraw.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    WITHDRAW_STATUS_STYLES[withdraw.status] ||
                    "bg-surface border border-border text-muted-foreground"
                  }`}
                >
                  {withdraw.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      {pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

function BankDetailsForm({
  withdrawMethod,
}: {
  withdrawMethod?: WithdrawMethodInput;
}) {
  const toast = useToast();
  const [updatePaymentMethods, { isLoading: isSaving }] =
    useUpdatePaymentMethodsMutation();
  const [deleteWithdrawMethod, { isLoading: isDeleting }] =
    useDeleteWithdrawMethodMutation();
  const [editing, setEditing] = useState(!withdrawMethod);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    withdrawMethodName: "",
    bankName: "",
    bankCountry: "",
    bankSwiftCode: "",
    bankAccountNumber: "",
    bankHolderName: "",
    bankAddress: "",
  });

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await updatePaymentMethods({ withdrawMethod: form }).unwrap();
      setEditing(false);
      toast.showToast({ title: "Bank details saved", variant: "success" });
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not save bank details."));
    }
  };

  const handleRemove = async () => {
    try {
      await deleteWithdrawMethod().unwrap();
      setEditing(true);
      toast.showToast({
        title: "Payout bank account removed",
        variant: "success",
      });
    } catch (err) {
      toast.showToast({
        title: getErrorMessage(err, "Could not remove bank details."),
        variant: "error",
      });
    }
  };

  if (!editing && withdrawMethod) {
    return (
      <div className="bg-surface border border-border rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Payout bank account
        </h2>
        <p className="text-sm text-muted-foreground">
          {withdrawMethod.bankHolderName} &middot; {withdrawMethod.bankName}
        </p>
        <p className="text-sm text-muted-foreground">
          Account: {withdrawMethod.bankAccountNumber}
        </p>
        <div className="flex gap-4 mt-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-primary hover:underline cursor-pointer"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleRemove}
            className="text-sm text-error hover:underline cursor-pointer disabled:opacity-60"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface border border-border rounded-lg shadow-sm p-6 space-y-3"
    >
      <h2 className="text-lg font-semibold text-foreground">
        Payout bank account
      </h2>
      <input
        required
        placeholder="Withdraw method name"
        className={`${styles.input}`}
        value={form.withdrawMethodName}
        onChange={handleChange("withdrawMethodName")}
      />
      <input
        required
        placeholder="Bank name"
        className={`${styles.input}`}
        value={form.bankName}
        onChange={handleChange("bankName")}
      />
      <input
        required
        placeholder="Bank country"
        className={`${styles.input}`}
        value={form.bankCountry}
        onChange={handleChange("bankCountry")}
      />
      <input
        placeholder="SWIFT code (optional)"
        className={`${styles.input}`}
        value={form.bankSwiftCode}
        onChange={handleChange("bankSwiftCode")}
      />
      <input
        required
        placeholder="Account number"
        className={`${styles.input}`}
        value={form.bankAccountNumber}
        onChange={handleChange("bankAccountNumber")}
      />
      <input
        required
        placeholder="Account holder name"
        className={`${styles.input}`}
        value={form.bankHolderName}
        onChange={handleChange("bankHolderName")}
      />
      <input
        placeholder="Bank address (optional)"
        className={`${styles.input}`}
        value={form.bankAddress}
        onChange={handleChange("bankAddress")}
      />
      {formError && <p className="text-sm text-error">{formError}</p>}
      <button
        type="submit"
        disabled={isSaving}
        className={`${styles.submit_button} disabled:opacity-60`}
      >
        <span className="font-[Poppins]">
          {isSaving ? "Saving..." : "Save bank details"}
        </span>
      </button>
    </form>
  );
}

function ProfilePanel() {
  const toast = useToast();
  const { seller } = useCurrentSeller();
  const [updateSellerInfo, { isLoading: isSavingInfo }] =
    useUpdateSellerInfoMutation();
  const [updateShopAvatar, { isLoading: isSavingAvatar }] =
    useUpdateShopAvatarMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: seller?.name || "",
      description: seller?.description || "",
      address: seller?.address || "",
      phoneNumber: seller?.phoneNumber ? String(seller.phoneNumber) : "",
      zipCode: seller?.zipCode ? String(seller.zipCode) : "",
    },
  });

  const onSubmit = async (values: {
    name: string;
    description: string;
    address: string;
    phoneNumber: string;
    zipCode: string;
  }) => {
    setFormError(null);
    setSuccessMessage(null);
    try {
      await updateSellerInfo({
        name: values.name,
        description: values.description,
        address: values.address,
        phoneNumber: values.phoneNumber
          ? Number(values.phoneNumber)
          : undefined,
        zipCode: values.zipCode ? Number(values.zipCode) : undefined,
      }).unwrap();
      setSuccessMessage("Shop information updated successfully.");
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setAvatarError(validation.error ?? "Invalid image file.");
      e.target.value = "";
      return;
    }
    try {
      const base64 = await readFileAsBase64(file);
      await updateShopAvatar({ avatar: base64 }).unwrap();
      toast.showToast({ title: "Shop logo updated", variant: "success" });
    } catch (err) {
      const message = getErrorMessage(
        err,
        "Could not update avatar. Please try a different image.",
      );
      setAvatarError(message);
      toast.showToast({ title: message, variant: "error" });
    } finally {
      e.target.value = "";
    }
  };

  if (!seller) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Shop logo
        </label>
        <div className="mt-2 flex items-center">
          <span className="inline-block w-16 h-16 rounded-full overflow-hidden border border-border relative bg-surface">
            {seller.avatar?.url ? (
              <Image
                src={seller.avatar.url}
                alt={seller.name}
                fill
                className="h-full w-full object-cover"
              />
            ) : (
              <RxAvatar className="h-full w-full text-muted-foreground" />
            )}
          </span>
          <label
            htmlFor="seller-account-avatar-file-input"
            className="ml-5 flex items-center justify-center px-4 py-2 border border-input rounded-md shadow-sm text-sm font-medium text-foreground bg-surface hover:bg-surface-hover cursor-pointer"
          >
            <span>{isSavingAvatar ? "Uploading..." : "Upload a file"}</span>
            <input
              id="seller-account-avatar-file-input"
              type="file"
              accept=".jpg,.jpeg,.png,image/*"
              onChange={handleAvatarChange}
              disabled={isSavingAvatar}
              className="sr-only"
            />
          </label>
        </div>
        {avatarError && (
          <p className="mt-1 text-sm text-error">{avatarError}</p>
        )}
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 bg-surface border border-border rounded-lg shadow-sm p-6"
        noValidate
      >
        <div>
          <label className="block text-sm font-medium text-foreground">
            Shop name
          </label>
          <input className={`${styles.input} mt-1`} {...register("name")} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">
            Description
          </label>
          <textarea
            rows={3}
            className={`${styles.input} mt-1`}
            {...register("description")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">
            Address
          </label>
          <input className={`${styles.input} mt-1`} {...register("address")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground">
              Phone number
            </label>
            <input
              className={`${styles.input} mt-1`}
              inputMode="numeric"
              maxLength={15}
              onKeyDown={blockNonIntegerKeys}
              {...register("phoneNumber", {
                onChange: (e) => {
                  e.target.value = sanitizeDigitsOnly(e.target.value);
                },
              })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Zip code
            </label>
            <input
              className={`${styles.input} mt-1`}
              inputMode="numeric"
              maxLength={10}
              onKeyDown={blockNonIntegerKeys}
              {...register("zipCode", {
                onChange: (e) => {
                  e.target.value = sanitizeDigitsOnly(e.target.value);
                },
              })}
            />
          </div>
        </div>

        {formError && <p className="text-sm text-error">{formError}</p>}
        {successMessage && (
          <p className="text-sm text-success">{successMessage}</p>
        )}

        <button
          type="submit"
          disabled={isSavingInfo}
          className={`${styles.submit_button} disabled:opacity-60`}
        >
          <span className="font-[Poppins]">
            {isSavingInfo ? "Saving..." : "Save changes"}
          </span>
        </button>
      </form>
    </div>
  );
}

function ProductsPanel({ seller, shopId }: { shopId: string; seller: IShop }) {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const confirm = useConfirm();
  const { data, isLoading, isError, error } = useGetShopProductsQuery({
    shopId,
    page,
    limit: 12,
  });
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({ resolver: zodResolver(productFormSchema) });

  const handleImagesChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormError(null);
    if (files.length === 0) return;

    if (images.length + files.length > 8) {
      setFormError("Maximum 8 images allowed");
      e.target.value = "";
      return;
    }

    const invalidFile = files.find((file) => !validateImageFile(file).valid);
    if (invalidFile) {
      setFormError(
        validateImageFile(invalidFile).error ??
          "One or more files are invalid.",
      );
      e.target.value = "";
      return;
    }

    try {
      const encoded = await Promise.all(
        files.map((file) => readFileAsBase64(file)),
      );

      setImages((prev) => {
        const updated = [...prev, ...encoded];
        if (updated.length > 8) {
          setFormError("Maximum 8 images allowed");
          return prev;
        }
        return updated;
      });
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not read one or more images."));
    } finally {
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setFormError(null);
  };

  const openCreateForm = () => {
    setEditingProduct(null);
    reset({
      name: "",
      description: "",
      tags: "",
      originalPrice: "",
      discountPrice: "",
      stock: "",
    } as ProductFormValues);
    setImages([]);
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (product: IProduct) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      description: product.description,
      category: product.category as ProductFormValues["category"],
      tags: product.tags || "",
      originalPrice: product.originalPrice ? String(product.originalPrice) : "",
      discountPrice: String(product.discountPrice),
      stock: String(product.stock),
    });
    setImages([]);
    setFormError(null);
    setShowForm(true);
  };

  const onSubmit = async (values: ProductFormValues) => {
    setFormError(null);
    const wasEditing = Boolean(editingProduct);

    if (!editingProduct && images.length === 0) {
      setFormError("At least one image is required");
      return;
    }

    const imageValidationResult = imageListValidation.safeParse(images);
    if (!imageValidationResult.success && images.length > 0) {
      setFormError(imageValidationResult.error.issues[0].message);
      return;
    }

    try {
      if (editingProduct) {
        await updateProduct({
          id: editingProduct._id,
          shopId,
          name: values.name,
          description: values.description,
          category: values.category,
          tags: values.tags || undefined,
          originalPrice: values.originalPrice
            ? Number(values.originalPrice)
            : undefined,
          discountPrice: Number(values.discountPrice),
          stock: Number(values.stock),
          ...(images.length > 0 ? { images } : {}),
        }).unwrap();
      } else {
        await createProduct({
          name: values.name,
          description: values.description,
          category: values.category,
          tags: values.tags || undefined,
          originalPrice: values.originalPrice
            ? Number(values.originalPrice)
            : undefined,
          discountPrice: Number(values.discountPrice),
          stock: Number(values.stock),
          images,
          shopId,
        }).unwrap();
      }
      reset();
      setImages([]);
      setEditingProduct(null);
      setShowForm(false);
      toast.showToast({
        title: wasEditing ? "Product updated" : "Product created",
        variant: "success",
      });
    } catch (err) {
      setFormError(
        getErrorMessage(
          err,
          editingProduct
            ? "Could not update product."
            : "Could not create product.",
        ),
      );
    }
  };

  const handleDelete = async (id: string, productName: string) => {
    const confirmed = await confirm({
      title: "Delete Product",
      description: `Are you sure you want to delete "${productName}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await deleteProduct({ id, shopId }).unwrap();
      toast.showToast({
        title: `"${productName}" was deleted`,
        variant: "success",
      });
    } catch (err) {
      toast.showToast({
        title: getErrorMessage(err, "Could not delete product."),
        variant: "error",
      });
    }
  };

  const products = data?.products ?? [];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-foreground">Your products</h2>
        <button
          type="button"
          disabled={seller?.status !== "active"}
          onClick={() => (showForm ? setShowForm(false) : openCreateForm())}
          className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {showForm ? "Cancel" : "Add product"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 bg-surface border border-border rounded-lg shadow-sm p-6 mb-6"
          noValidate
        >
          {editingProduct && (
            <p className="text-sm text-primary font-medium">
              Editing &quot;{editingProduct.name}&quot;
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Name
            </label>
            <input className={`${styles.input} mt-1`} {...register("name")} />
            {errors.name && (
              <p className="mt-1 text-sm text-error">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              rows={3}
              className={`${styles.input} mt-1`}
              {...register("description")}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-error">
                {errors.description.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Category
              </label>
              <select
                className={`${styles.input} mt-1`}
                defaultValue=""
                {...register("category")}
              >
                <option value="" disabled>
                  Select a category
                </option>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-error">
                  {errors.category.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                Tags (optional)
              </label>
              <input className={`${styles.input} mt-1`} {...register("tags")} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Original price
              </label>
              <input
                className={`${styles.input} mt-1`}
                inputMode="decimal"
                onKeyDown={blockNonPriceKeys}
                {...register("originalPrice", {
                  onChange: (e) => {
                    e.target.value = sanitizePriceString(e.target.value);
                  },
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                Discount price
              </label>
              <input
                className={`${styles.input} mt-1`}
                inputMode="decimal"
                onKeyDown={blockNonPriceKeys}
                {...register("discountPrice", {
                  onChange: (e) => {
                    e.target.value = sanitizePriceString(e.target.value);
                  },
                })}
              />
              {errors.discountPrice && (
                <p className="mt-1 text-sm text-error">
                  {errors.discountPrice.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                Stock
              </label>
              <input
                className={`${styles.input} mt-1`}
                inputMode="numeric"
                onKeyDown={blockNonIntegerKeys}
                {...register("stock", {
                  onChange: (e) => {
                    e.target.value = sanitizeDigitsOnly(e.target.value);
                  },
                })}
              />
              {errors.stock && (
                <p className="mt-1 text-sm text-error">
                  {errors.stock.message}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Images{" "}
              {editingProduct && (
                <span className="font-normal text-muted-foreground">
                  (leave empty to keep current images)
                </span>
              )}
            </label>
            <label className="inline-flex items-center px-4 py-2 bg-surface border border-input rounded-md font-medium text-sm text-foreground hover:bg-surface-hover cursor-pointer shadow-xs transition-colors">
              Upload Images
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagesChange}
                className="hidden"
              />
            </label>

            {images.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className="relative w-16 h-16 rounded-md overflow-hidden border border-border shadow-xs bg-surface"
                  >
                    <Image
                      src={img}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-error text-error-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs hover:opacity-90 transition-colors"
                      title="Remove image"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {formError && <p className="text-sm text-error">{formError}</p>}

          <button
            type="submit"
            disabled={isCreating || isUpdating}
            className={`${styles.submit_button} disabled:opacity-60`}
          >
            <span className="font-[Poppins]">
              {editingProduct
                ? isUpdating
                  ? "Saving..."
                  : "Save changes"
                : isCreating
                  ? "Creating..."
                  : "Create product"}
            </span>
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-[15px] text-muted-foreground py-8">
          Loading products...
        </p>
      ) : isError ? (
        <p className="text-[15px] text-error py-8">
          {getErrorMessage(error, "Could not load products.")}
        </p>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<AiOutlineShoppingCart size={24} />}
          title="You haven't added any products yet"
        />
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product._id}
              className="flex items-center justify-between bg-surface border border-border rounded-lg shadow-sm p-4"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 shrink-0">
                  <Image
                    src={product.images?.[0]?.url || "/placeholder.png"}
                    alt={product.name}
                    fill
                    className="object-cover rounded-[5px]"
                  />
                </div>
                <div>
                  <p className="font-medium text-foreground">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    ${product.discountPrice} &middot; {product.stock} in stock
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => openEditForm(product)}
                  className="text-sm text-primary hover:underline cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(product._id, product.name)}
                  className="text-sm text-error hover:underline cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
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

function EventsPanel({ seller, shopId }: { shopId: string; seller: IShop }) {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const confirm = useConfirm();
  const { data, isLoading, isError, error } = useGetShopEventsQuery({
    shopId,
    page,
    limit: 12,
  });

  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();
  const [deleteEvent] = useDeleteEventMutation();
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<IEvent | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventFormValues>({ resolver: zodResolver(eventFormSchema) });

  const handleImagesChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormError(null);
    if (files.length === 0) return;

    if (images.length + files.length > 8) {
      setFormError("Maximum 8 images allowed");
      e.target.value = "";
      return;
    }

    const invalidFile = files.find((file) => !validateImageFile(file).valid);
    if (invalidFile) {
      setFormError(
        validateImageFile(invalidFile).error ??
          "One or more files are invalid.",
      );
      e.target.value = "";
      return;
    }

    try {
      const encoded = await Promise.all(
        files.map((file) => readFileAsBase64(file)),
      );

      setImages((prev) => {
        const updated = [...prev, ...encoded];
        if (updated.length > 8) {
          setFormError("Maximum 8 images allowed");
          return prev;
        }
        return updated;
      });
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not read one or more images."));
    } finally {
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setFormError(null);
  };

  const openCreateForm = () => {
    setEditingEvent(null);
    reset({
      name: "",
      description: "",
      tags: "",
      originalPrice: "",
      discountPrice: "",
      stock: "",
      start_Date: "",
      Finish_Date: "",
    } as EventFormValues);
    setImages([]);
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (event: IEvent) => {
    setEditingEvent(event);
    reset({
      name: event.name,
      description: event.description,
      category: event.category as EventFormValues["category"],
      tags: event.tags || "",
      originalPrice: event.originalPrice ? String(event.originalPrice) : "",
      discountPrice: String(event.discountPrice),
      stock: String(event.stock),
      start_Date: event.start_Date ? event.start_Date.slice(0, 10) : "",
      Finish_Date: event.Finish_Date ? event.Finish_Date.slice(0, 10) : "",
    });
    setImages([]);
    setFormError(null);
    setShowForm(true);
  };

  const onSubmit = async (values: EventFormValues) => {
    setFormError(null);
    const wasEditing = Boolean(editingEvent);
    if (!editingEvent && images.length === 0) {
      setFormError("At least one image is required");
      return;
    }

    const imageValidationResult = imageListValidation.safeParse(images);
    if (!imageValidationResult.success && images.length > 0) {
      setFormError(imageValidationResult.error.issues[0].message);
      return;
    }

    try {
      if (editingEvent) {
        await updateEvent({
          id: editingEvent._id,
          shopId,
          name: values.name,
          description: values.description,
          category: values.category,
          tags: values.tags || undefined,
          originalPrice: values.originalPrice
            ? Number(values.originalPrice)
            : undefined,
          discountPrice: Number(values.discountPrice),
          stock: Number(values.stock),
          start_Date: values.start_Date,
          Finish_Date: values.Finish_Date,
          ...(images.length > 0 ? { images } : {}),
        }).unwrap();
      } else {
        await createEvent({
          name: values.name,
          description: values.description,
          category: values.category,
          tags: values.tags || undefined,
          originalPrice: values.originalPrice
            ? Number(values.originalPrice)
            : undefined,
          discountPrice: Number(values.discountPrice),
          stock: Number(values.stock),
          start_Date: values.start_Date,
          Finish_Date: values.Finish_Date,
          images,
          shopId,
        }).unwrap();
      }
      reset();
      setImages([]);
      setEditingEvent(null);
      setShowForm(false);
      toast.showToast({
        title: wasEditing ? "Event updated" : "Event created",
        variant: "success",
      });
    } catch (err) {
      setFormError(
        getErrorMessage(
          err,
          editingEvent ? "Could not update event." : "Could not create event.",
        ),
      );
    }
  };

  const handleDelete = async (id: string, eventName: string) => {
    const confirmed = await confirm({
      title: "Delete Event",
      description: `Are you sure you want to delete "${eventName}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await deleteEvent({ id, shopId }).unwrap();
      toast.showToast({
        title: `"${eventName}" was deleted`,
        variant: "success",
      });
    } catch (err) {
      toast.showToast({
        title: getErrorMessage(err, "Could not delete event."),
        variant: "error",
      });
    }
  };

  const events = data?.events ?? [];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-foreground">Your events</h2>
        <button
          type="button"
          disabled={seller?.status !== "active"}
          onClick={() => (showForm ? setShowForm(false) : openCreateForm())}
          className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {showForm ? "Cancel" : "Add event"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 bg-surface border border-border rounded-lg shadow-sm p-6 mb-6"
          noValidate
        >
          {editingEvent && (
            <p className="text-sm text-primary font-medium">
              Editing &quot;{editingEvent.name}&quot;
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Name
            </label>
            <input className={`${styles.input} mt-1`} {...register("name")} />
            {errors.name && (
              <p className="mt-1 text-sm text-error">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              rows={3}
              className={`${styles.input} mt-1`}
              {...register("description")}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-error">
                {errors.description.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Category
              </label>
              <select
                className={`${styles.input} mt-1`}
                defaultValue=""
                {...register("category")}
              >
                <option value="" disabled>
                  Select a category
                </option>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-error">
                  {errors.category.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                Tags (optional)
              </label>
              <input className={`${styles.input} mt-1`} {...register("tags")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Start date
              </label>
              <input
                type="date"
                min={todayDateString()}
                className={`${styles.input} mt-1`}
                {...register("start_Date")}
              />
              {errors.start_Date && (
                <p className="mt-1 text-sm text-error">
                  {errors.start_Date.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                End date
              </label>
              <input
                type="date"
                min={todayDateString()}
                className={`${styles.input} mt-1`}
                {...register("Finish_Date")}
              />
              {errors.Finish_Date && (
                <p className="mt-1 text-sm text-error">
                  {errors.Finish_Date.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Original price
              </label>
              <input
                className={`${styles.input} mt-1`}
                inputMode="decimal"
                onKeyDown={blockNonPriceKeys}
                {...register("originalPrice", {
                  onChange: (e) => {
                    e.target.value = sanitizePriceString(e.target.value);
                  },
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                Discount price
              </label>
              <input
                className={`${styles.input} mt-1`}
                inputMode="decimal"
                onKeyDown={blockNonPriceKeys}
                {...register("discountPrice", {
                  onChange: (e) => {
                    e.target.value = sanitizePriceString(e.target.value);
                  },
                })}
              />
              {errors.discountPrice && (
                <p className="mt-1 text-sm text-error">
                  {errors.discountPrice.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                Stock
              </label>
              <input
                className={`${styles.input} mt-1`}
                inputMode="numeric"
                onKeyDown={blockNonIntegerKeys}
                {...register("stock", {
                  onChange: (e) => {
                    e.target.value = sanitizeDigitsOnly(e.target.value);
                  },
                })}
              />
              {errors.stock && (
                <p className="mt-1 text-sm text-error">
                  {errors.stock.message}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Images{" "}
              {editingEvent && (
                <span className="font-normal text-muted-foreground">
                  (leave empty to keep current images)
                </span>
              )}
            </label>
            <label className="inline-flex items-center px-4 py-2 bg-surface border border-input rounded-md font-medium text-sm text-foreground hover:bg-surface-hover cursor-pointer shadow-xs transition-colors">
              Upload Images
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagesChange}
                className="hidden"
              />
            </label>

            {images.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className="relative w-16 h-16 rounded-md overflow-hidden border border-border shadow-xs bg-surface"
                  >
                    <Image
                      src={img}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-error text-error-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs hover:opacity-90 transition-colors"
                      title="Remove image"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {formError && <p className="text-sm text-error">{formError}</p>}

          <button
            type="submit"
            disabled={isCreating || isUpdating}
            className={`${styles.submit_button} disabled:opacity-60`}
          >
            <span className="font-[Poppins]">
              {editingEvent
                ? isUpdating
                  ? "Saving..."
                  : "Save changes"
                : isCreating
                  ? "Creating..."
                  : "Create event"}
            </span>
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-[15px] text-muted-foreground py-8">
          Loading events...
        </p>
      ) : isError ? (
        <p className="text-[15px] text-error py-8">
          {getErrorMessage(error, "Could not load events.")}
        </p>
      ) : events.length === 0 ? (
        <EmptyState
          icon={<AiOutlineCalendar size={24} />}
          title="You haven't created any events yet"
        />
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event._id}
              className="flex items-center justify-between bg-surface border border-border rounded-lg shadow-sm p-4"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 shrink-0">
                  <Image
                    src={event.images?.[0]?.url || "/placeholder.png"}
                    alt={event.name}
                    fill
                    className="object-cover rounded-[5px]"
                  />
                </div>
                <div>
                  <p className="font-medium text-foreground">{event.name}</p>
                  <p className="text-sm text-muted-foreground">
                    ${event.discountPrice} &middot;{" "}
                    {event.isActive
                      ? "Active"
                      : event.isUpcoming
                        ? "Upcoming"
                        : "Expired"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => openEditForm(event)}
                  className="text-sm text-primary hover:underline cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(event._id, event.name)}
                  className="text-sm text-error hover:underline cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
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

function CouponsPanel() {
  const toast = useToast();
  const { data, isLoading, isError } = useGetShopCouponsQuery();
  const confirm = useConfirm();
  const [createCouponCode, { isLoading: isCreating }] =
    useCreateCouponCodeMutation();
  const [deleteCouponCode] = useDeleteCouponCodeMutation();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    value: "",
    minAmount: "",
    maxAmount: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const coupons = data?.couponCodes ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await createCouponCode({
        name: form.name,
        value: Number(form.value),
        minAmount: form.minAmount ? Number(form.minAmount) : undefined,
        maxAmount: form.maxAmount ? Number(form.maxAmount) : undefined,
      }).unwrap();
      setForm({ name: "", value: "", minAmount: "", maxAmount: "" });
      setShowForm(false);
      toast.showToast({ title: "Coupon created", variant: "success" });
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not create coupon."));
    }
  };

  const handleDelete = async (id: string, couponName: string) => {
    setFormError(null);
    const confirmed = await confirm({
      title: "Delete Coupon",
      description: `Are you sure you want to delete "${couponName}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      await deleteCouponCode(id).unwrap();
      toast.showToast({
        title: `Coupon "${couponName}" deleted`,
        variant: "success",
      });
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not delete coupon."));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-foreground">Coupons</h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 text-sm cursor-pointer"
        >
          {showForm ? "Cancel" : "Add coupon"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-3 bg-surface border border-border rounded-lg shadow-sm p-6 mb-6"
        >
          <input
            required
            placeholder="Coupon code (e.g. SAVE10)"
            className={`${styles.input}`}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            required
            placeholder="Discount % (1-100)"
            inputMode="numeric"
            className={`${styles.input}`}
            onKeyDown={blockNonIntegerKeys}
            value={form.value}
            onChange={(e) => {
              const digits = sanitizeDigitsOnly(e.target.value);
              const clamped =
                digits === "" ? "" : String(Math.min(100, Number(digits)));
              setForm({ ...form, value: clamped });
            }}
          />
          <input
            placeholder="Minimum order amount (optional)"
            inputMode="decimal"
            className={`${styles.input}`}
            onKeyDown={blockNonPriceKeys}
            value={form.minAmount}
            onChange={(e) =>
              setForm({
                ...form,
                minAmount: sanitizePriceString(e.target.value),
              })
            }
          />
          <input
            placeholder="Maximum order amount (optional)"
            inputMode="decimal"
            className={`${styles.input}`}
            onKeyDown={blockNonPriceKeys}
            value={form.maxAmount}
            onChange={(e) =>
              setForm({
                ...form,
                maxAmount: sanitizePriceString(e.target.value),
              })
            }
          />
          {formError && <p className="text-sm text-error">{formError}</p>}
          <button
            type="submit"
            disabled={isCreating}
            className={`${styles.submit_button} disabled:opacity-60`}
          >
            <span className="font-[Poppins]">
              {isCreating ? "Creating..." : "Create coupon"}
            </span>
          </button>
        </form>
      )}

      {formError && !showForm && (
        <p className="text-sm text-error mb-4">{formError}</p>
      )}

      {isLoading ? (
        <p className="text-[15px] text-muted-foreground py-8">
          Loading coupons...
        </p>
      ) : isError ? (
        <p className="text-[15px] text-error py-8">Could not load coupons.</p>
      ) : coupons.length === 0 ? (
        <EmptyState
          icon={<AiOutlineTag size={24} />}
          title="You haven't created any coupons yet"
        />
      ) : (
        <div className="space-y-3">
          {coupons.map((c) => (
            <div
              key={c._id}
              className="flex items-center justify-between bg-surface border border-border rounded-lg shadow-sm p-4"
            >
              <div>
                <p className="font-medium text-foreground">{c.name}</p>
                <p className="text-sm text-muted-foreground">
                  {c.value}% off
                  {c.minAmount ? ` min $${c.minAmount}` : ""}
                  {c.maxAmount ? ` max $${c.maxAmount}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(c._id, c.name)}
                className="text-sm text-error hover:underline cursor-pointer"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
