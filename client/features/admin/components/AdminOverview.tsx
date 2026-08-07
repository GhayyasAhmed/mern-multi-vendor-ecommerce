"use client";
import Link from "next/link";
import { useGetAdminStatsQuery } from "../adminApiSlice";

function Card({ label, value, href }: { label: string; value: number | string; href: string }) {
  return (
    <Link href={href} className="block bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
      <p className="text-sm text-[#00000082]">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </Link>
  );
}

export default function AdminOverview() {
  const { data, isLoading } = useGetAdminStatsQuery();
  const stats = data?.stats;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card label="Users" value={isLoading ? "-" : stats?.userCount ?? 0} href="/admin/users" />
        <Card label="Sellers" value={isLoading ? "-" : stats?.sellerCount ?? 0} href="/admin/sellers" />
        <Card label="Products" value={isLoading ? "-" : stats?.productCount ?? 0} href="/admin/products" />
        <Card label="Events" value={isLoading ? "-" : stats?.eventCount ?? 0} href="/admin/events" />
        <Card label="Orders" value={isLoading ? "-" : stats?.orderCount ?? 0} href="/admin/orders" />
        <Card
          label="Pending withdrawals"
          value={isLoading ? "-" : stats?.pendingWithdrawCount ?? 0}
          href="/admin/withdrawals"
        />
      </div>
    </div>
  );
}