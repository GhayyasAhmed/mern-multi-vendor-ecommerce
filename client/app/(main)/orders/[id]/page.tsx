import type { Metadata } from "next";

import OrderDetails from "@/components/Order/OrderDetails";

export const metadata: Metadata = {
  title: `Order details `,
};

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetails orderId={id} />;
}