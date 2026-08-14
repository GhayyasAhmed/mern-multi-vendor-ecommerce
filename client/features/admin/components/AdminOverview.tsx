"use client";
import { NOTIFICATION_SOUND } from "@/constants";
import { useSocket } from "@/hooks/use-socket";
import { apiSlice } from "@/lib/api/apiSlice";
import { useAppDispatch } from "@/store/hooks";
import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { useGetAdminStatsQuery } from "../adminApiSlice";

const ADMIN_STATS_TYPES = new Set([
  "admin_new_order",
  "admin_new_withdrawal",
  "admin_new_seller",
  "admin_seller_status",
  "admin_withdraw_status",
]);

function Card({
  label,
  value,
  href,
}: {
  label: string;
  value: number | string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-surface border border-border rounded-lg shadow-sm p-6 hover:shadow-md hover:border-primary/40 transition-all"
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold mt-1 text-foreground">{value}</p>
    </Link>
  );
}

export default function AdminOverview() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { data, isLoading } = useGetAdminStatsQuery();
  const stats = data?.stats;

  const socket = useSocket(true);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio(NOTIFICATION_SOUND);
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    audioRef.current?.play().catch(() => {});
  }, []);

  useEffect(() => {
    const handleNotification = (payload: { type: string }) => {
      if (ADMIN_STATS_TYPES.has(payload.type)) {
        dispatch(
          apiSlice.util.invalidateTags([
            { type: "AdminStats", id: "OVERVIEW" },
          ]),
        );
        playNotificationSound();
      }
    };
    socket.on("notification", handleNotification);
    return () => {
      socket.off("notification", handleNotification);
    };
  }, [socket, dispatch, playNotificationSound]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6 text-foreground">
        Dashboard overview
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card
          label="Users"
          value={isLoading ? "-" : (stats?.userCount ?? 0)}
          href="/admin/users"
        />
        <Card
          label="Sellers"
          value={isLoading ? "-" : (stats?.sellerCount ?? 0)}
          href="/admin/sellers"
        />
        <Card
          label="Products"
          value={isLoading ? "-" : (stats?.productCount ?? 0)}
          href="/admin/products"
        />
        <Card
          label="Events"
          value={isLoading ? "-" : (stats?.eventCount ?? 0)}
          href="/admin/events"
        />
        <Card
          label="Orders"
          value={isLoading ? "-" : (stats?.orderCount ?? 0)}
          href="/admin/orders"
        />
        <Card
          label="Pending withdrawals"
          value={isLoading ? "-" : (stats?.pendingWithdrawCount ?? 0)}
          href="/admin/withdrawals"
        />
      </div>
    </div>
  );
}
