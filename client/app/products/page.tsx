import type { Metadata } from "next";
import { Suspense } from "react";
import { APP_NAME } from "@/constants";
import ProductsListing from "@/components/Route/ProductsListing/ProductsListing";

export const metadata: Metadata = {
  title: `Products | ${APP_NAME}`,
  description: "Browse all products.",
};

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsListing />
    </Suspense>
  );
}