import type { Metadata } from "next";
import { APP_NAME } from "@/constants";
import AccountSettings from "@/features/auth/components/AccountSettings";

export const metadata: Metadata = {
  title: `Account settings | ${APP_NAME}`,
};

export default function AccountPage() {
  return <AccountSettings />;
}