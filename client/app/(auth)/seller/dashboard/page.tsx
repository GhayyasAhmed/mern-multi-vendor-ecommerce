import type { Metadata } from "next";
import { Suspense } from "react";
import { APP_NAME } from "@/constants";
import SellerProtectedRoute from "@/features/shop/components/SellerProtectedRoute";
import SellerDashboard from "@/features/shop/components/SellerDashboard";

export const metadata: Metadata = {
  title: `Seller dashboard | ${APP_NAME}`,
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