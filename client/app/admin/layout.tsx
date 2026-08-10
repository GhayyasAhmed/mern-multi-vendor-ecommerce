import AdminProtectedRoute from "@/features/admin/components/AdminProtectedRoute";
import AdminNav from "@/features/admin/components/AdminNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProtectedRoute>
      {/* bg-background text-foreground antialiased duration-300 bg-no-repeat */}
      <div className="min-h-screen bg-background/10 text-foreground duration-100 flex flex-col md:flex-row">
        <AdminNav />
        <main className="flex-1 p-4 md:p-6 min-w-0">{children}</main>
      </div>
    </AdminProtectedRoute>
  );
}