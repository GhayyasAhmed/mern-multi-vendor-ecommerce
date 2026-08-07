import type { Metadata } from "next";
import { APP_NAME } from "@/constants";
import AdminOverview from "@/features/admin/components/AdminOverview";

export const metadata: Metadata = {
  title: `Admin dashboard | ${APP_NAME}`,
};

export default function AdminHomePage() {
  return <AdminOverview />;
}