"use client";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import TableSkeleton from "@/components/ui/TableSkeleton";
import {
  useDeleteUserAdminMutation,
  useGetAllUsersAdminQuery,
} from "@/features/admin/adminApiSlice";
import { getErrorMessage } from "@/features/auth/utils";
import { useConfirm } from "@/providers/confirm-provider";
import { useState } from "react";
import { AiOutlineTeam } from "react-icons/ai";

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const confirm = useConfirm();
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
        <p className="text-sm text-error mb-4">{actionError}</p>
      )}
      {isLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : isError ? (
        <p className="text-sm text-error">Could not load users.</p>
      ) : users.length === 0 ? (
        <EmptyState icon={<AiOutlineTeam size={26} />} title="No users yet" />
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="md:hidden divide-y divide-border rounded-lg bg-surface shadow-sm overflow-hidden">
            {users.map((user) => (
              <div key={user._id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Badge variant={user.role === "admin" ? "primary" : "neutral"}>{user.role}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                  </span>
                  {user.role !== "admin" && (
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleDelete(user._id, user.name)}
                      className="min-h-11 px-2 -mr-2 text-error text-sm font-medium disabled:opacity-60 cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block bg-surface rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
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
                  <tr key={user._id} className="border-t border-border">
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
                          onClick={() => handleDelete(user._id, user.name)}
                          className="text-error hover:underline disabled:opacity-60 cursor-pointer"
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
        </>
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