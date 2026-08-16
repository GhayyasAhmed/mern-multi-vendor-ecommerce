import ProtectedRoute from "@/features/auth/components/ProtectedRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <main className="min-h-screen flex">{children}</main>
    </ProtectedRoute>
  );
}