"use client";
import Pagination from "@/components/ui/Pagination";
import {
  useDeleteUserAdminMutation,
  useGetAllUsersAdminQuery,
} from "@/features/admin/adminApiSlice";
import { getErrorMessage } from "@/features/auth/utils";
import { useConfirm } from "@/providers/confirm-provider";
import { useState } from "react";
import TableSkeleton from "@/components/ui/TableSkeleton";

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const confirm = useConfirm(); // Initialize confirmation hook
  const { data, isLoading, isError } = useGetAllUsersAdminQuery({
    page,
    limit: 20,
  });
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserAdminMutation();
  const [actionError, setActionError] = useState<string | null>(null);
  const users = data?.users ?? [];

  const handleDelete = async (id: string, userName: string) => {
    setActionError(null);
    const confirmed = await confirm({
      title: "Delete User",
      description: `Are you sure you want to delete "${userName}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await deleteUser(id).unwrap();
    } catch (err) {
      setActionError(getErrorMessage(err, "Could not delete user."));
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Users</h1>
      {actionError && (
        <p className="text-sm text-red-600 mb-4">{actionError}</p>
      )}
      {isLoading ? (
        <TableSkeleton rows={8} cols={5} />
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
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user.role !== "admin" && (
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleDelete(user._id, user.name)}
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
      {data?.pagination && (
        <Pagination
          currentPage={data.pagination.currentPage}
          totalPages={data.pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
