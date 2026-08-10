import type { Metadata } from "next";

import AccountSettings from "@/features/auth/components/AccountSettings";

export const metadata: Metadata = {
  title: `Account Settings `,
};

export default function AccountPage() {
  return <AccountSettings />;
}