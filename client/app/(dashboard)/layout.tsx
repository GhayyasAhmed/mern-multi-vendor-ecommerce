import ProtectedRoute from "@/features/auth/components/ProtectedRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex">{children}</div>
    </ProtectedRoute>
  );
}