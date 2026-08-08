import type { Metadata } from "next";
import { Suspense } from "react";

import ProductsListing from "@/components/Route/ProductsListing/ProductsListing";

export const metadata: Metadata = {
  title: `Products`,
  description: "Browse all products.",
};

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsListing />
    </Suspense>
  );
}