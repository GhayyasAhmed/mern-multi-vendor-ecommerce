import type { Metadata } from "next";

import CheckoutFlow from "@/components/Checkout/CheckoutFlow";

export const metadata: Metadata = {
  title: `Checkout `,
  description: "Review your order and complete checkout.",
};

export default function CheckoutPage() {
  return <CheckoutFlow />;
}