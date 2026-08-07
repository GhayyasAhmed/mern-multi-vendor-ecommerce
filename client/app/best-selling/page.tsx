import type { Metadata } from "next";
import { APP_NAME } from "@/constants";
import BestSellingListing from "@/components/Route/BestSellingListing/BestSellingListing";

export const metadata: Metadata = {
  title: `Best Selling | ${APP_NAME}`,
  description: "Browse our best selling products.",
};

export default function BestSellingPage() {
  return <BestSellingListing />;
}