import type { Metadata } from "next";
import { Suspense } from "react";

import Inbox from "@/components/Inbox/Inbox";

export const metadata: Metadata = {
  title: `Inbox `,
  description: "Chat with sellers about your orders and products.",
};

export default function InboxPage() {
  return (
    <Suspense fallback={null}>
      <Inbox />
    </Suspense>
  );
}