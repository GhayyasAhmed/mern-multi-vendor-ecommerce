"use client";
import Link from "next/link";
import {
  useGetAllUsersAdminQuery,
  useGetAllSellersAdminQuery,
  useGetAllProductsAdminQuery,
  useGetAllEventsAdminQuery,
  useGetAllOrdersAdminQuery,
  useGetAllWithdrawsAdminQuery,
} from "../adminApiSlice";

function Card({ label, value, href }: { label: string; value: number | string; href: string }) {
  return (
    <Link href={href} className="block bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
      <p className="text-sm text-[#00000082]">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </Link>
  );
}

export default function AdminOverview() {
  const { data: usersData } = useGetAllUsersAdminQuery();
  const { data: sellersData } = useGetAllSellersAdminQuery();
  const { data: productsData } = useGetAllProductsAdminQuery();
  const { data: eventsData } = useGetAllEventsAdminQuery();
  const { data: ordersData } = useGetAllOrdersAdminQuery();
  const { data: withdrawsData } = useGetAllWithdrawsAdminQuery();

  const pendingWithdrawals =
    withdrawsData?.withdraws.filter((w) => w.status === "Processing").length ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card label="Users" value={usersData?.users.length ?? "-"} href="/admin/users" />
        <Card label="Sellers" value={sellersData?.sellers.length ?? "-"} href="/admin/sellers" />
        <Card label="Products" value={productsData?.products.length ?? "-"} href="/admin/products" />
        <Card label="Events" value={eventsData?.events.length ?? "-"} href="/admin/events" />
        <Card label="Orders" value={ordersData?.orders.length ?? "-"} href="/admin/orders" />
        <Card label="Pending withdrawals" value={pendingWithdrawals} href="/admin/withdrawals" />
      </div>
    </div>
  );
}