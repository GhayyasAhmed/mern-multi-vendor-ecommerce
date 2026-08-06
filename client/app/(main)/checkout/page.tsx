import type { Metadata } from "next";
import { APP_NAME } from "@/constants";
import CheckoutFlow from "@/components/Checkout/CheckoutFlow";

export const metadata: Metadata = {
  title: `Checkout | ${APP_NAME}`,
  description: "Review your order and complete checkout.",
};

export default function CheckoutPage() {
  return <CheckoutFlow />;
}