"use client";
import { useGetAllUsersAdminQuery, useDeleteUserAdminMutation } from "@/features/admin/adminApiSlice";

export default function AdminUsersPage() {
  const { data, isLoading, isError } = useGetAllUsersAdminQuery();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserAdminMutation();
  const users = data?.users ?? [];

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    try {
      await deleteUser(id).unwrap();
    } catch {
      // list stays as-is on failure; admin can retry
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Users</h1>
      {isLoading ? (
        <p className="text-sm text-[#00000082]">Loading users...</p>
      ) : isError ? (
        <p className="text-sm text-red-500">Could not load users.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#f5f5f5] text-left">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-t">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3 capitalize">{user.role}</td>
                  <td className="px-4 py-3">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user.role !== "admin" && (
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleDelete(user._id)}
                        className="text-red-600 hover:underline disabled:opacity-60 cursor-pointer"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}