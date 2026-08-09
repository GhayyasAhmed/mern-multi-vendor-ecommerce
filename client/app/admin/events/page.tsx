"use client";
import Image from "next/image";
import { useState } from "react";
import { useGetAllEventsAdminQuery } from "@/features/admin/adminApiSlice";
import Pagination from "@/components/ui/Pagination";
import TableSkeleton from "@/components/ui/TableSkeleton";

export default function AdminEventsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useGetAllEventsAdminQuery({
    page,
    limit: 20,
  });
  const events = data?.events ?? [];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Events</h1>
      {isLoading ? (
        <TableSkeleton rows={8} cols={4} />
      ) : isError ? (
        <p className="text-sm text-red-500">Could not load events.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#f5f5f5] text-left">
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event._id} className="border-t">
                  <td className="px-4 py-3 flex items-center gap-2">
                    <div className="relative w-10 h-10 shrink-0">
                      <Image
                        src={event.images?.[0]?.url || "/placeholder.png"}
                        alt={event.name}
                        fill
                        className="object-cover rounded-[5px]"
                      />
                    </div>
                    {event.name}
                  </td>
                  <td className="px-4 py-3">
                    {event.isActive
                      ? "Active"
                      : event.isUpcoming
                        ? "Upcoming"
                        : "Expired"}
                  </td>
                  <td className="px-4 py-3">${event.discountPrice}</td>
                  <td className="px-4 py-3">{event.stock}</td>
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
