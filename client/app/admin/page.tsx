import type { Metadata } from "next";

import AdminOverview from "@/features/admin/components/AdminOverview";

export const metadata: Metadata = {
  title: `Admin dashboard `,
};

export default function AdminHomePage() {
  return <AdminOverview />;
}