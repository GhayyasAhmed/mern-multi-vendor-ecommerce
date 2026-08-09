import AdminProtectedRoute from "@/features/admin/components/AdminProtectedRoute";
import AdminNav from "@/features/admin/components/AdminNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col md:flex-row">
        <AdminNav />
        <main className="flex-1 p-4 md:p-6 min-w-0">{children}</main>
      </div>
    </AdminProtectedRoute>
  );
}