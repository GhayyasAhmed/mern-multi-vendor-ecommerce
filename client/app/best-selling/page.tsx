import type { Metadata } from "next";

import BestSellingListing from "@/components/Route/BestSellingListing/BestSellingListing";

export const metadata: Metadata = {
  title: `Best Selling `,
  description: "Browse our best selling products.",
};

export default function BestSellingPage() {
  return <BestSellingListing />;
}