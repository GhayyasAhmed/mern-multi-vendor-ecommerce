import type { Metadata } from "next";

import OrderList from "@/components/Order/OrderList";

export const metadata: Metadata = {
  title: `My Orders `,
  description: "View your order history.",
};

export default function OrdersPage() {
  return <OrderList />;
}