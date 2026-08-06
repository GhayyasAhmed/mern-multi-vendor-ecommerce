import type { Metadata } from "next";
import { APP_NAME } from "@/constants";
import OrderList from "@/components/Order/OrderList";

export const metadata: Metadata = {
  title: `My Orders | ${APP_NAME}`,
  description: "View your order history.",
};

export default function OrdersPage() {
  return <OrderList />;
}