import AdminProtectedRoute from "@/features/admin/components/AdminProtectedRoute";
import AdminNav from "@/features/admin/components/AdminNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-[#f5f5f5] flex">
        <AdminNav />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </AdminProtectedRoute>
  );
}