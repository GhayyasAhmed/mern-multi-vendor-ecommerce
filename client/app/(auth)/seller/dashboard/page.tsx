import type { Metadata } from "next";
import { Suspense } from "react";

import SellerProtectedRoute from "@/features/shop/components/SellerProtectedRoute";
import SellerDashboard from "@/features/shop/components/SellerDashboard";

export const metadata: Metadata = {
  title: `Seller dashboard `,
};

export default function SellerDashboardPage() {
  return (
    <Suspense fallback={null}>
      <SellerProtectedRoute>
        <SellerDashboard />
      </SellerProtectedRoute>
    </Suspense>
  );
}