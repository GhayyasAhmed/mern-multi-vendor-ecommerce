import type { Metadata } from "next";

import AccountSettings from "@/features/auth/components/AccountSettings";

export const metadata: Metadata = {
  title: `Account settings `,
};

export default function AccountPage() {
  return <AccountSettings />;
}