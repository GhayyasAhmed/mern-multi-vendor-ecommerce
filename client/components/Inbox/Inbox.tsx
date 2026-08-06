"use client";

import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import styles from "@/styles/styles";
import InboxPanel from "./InboxPanel";

function InboxContent() {
  const { user } = useCurrentUser();

  return (
    <div>
      <Header activeHeading={0} />
      <div className={`${styles.section} py-8`}>
        <div className={`${styles.heading}`}>
          <h1>Inbox</h1>
        </div>
        <InboxPanel role="user" identityId={user?._id} />
      </div>
      <Footer />
    </div>
  );
}

export default function Inbox() {
  return (
    <ProtectedRoute>
      <InboxContent />
    </ProtectedRoute>
  );
}