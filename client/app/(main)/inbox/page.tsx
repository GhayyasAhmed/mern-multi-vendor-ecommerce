import type { Metadata } from "next";
import { Suspense } from "react";
import { APP_NAME } from "@/constants";
import Inbox from "@/components/Inbox/Inbox";

export const metadata: Metadata = {
  title: `Inbox | ${APP_NAME}`,
  description: "Chat with sellers about your orders and products.",
};

export default function InboxPage() {
  return (
    <Suspense fallback={null}>
      <Inbox />
    </Suspense>
  );
}