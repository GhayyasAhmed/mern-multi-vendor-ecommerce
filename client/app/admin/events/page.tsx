"use client";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { useGetAllEventsAdminQuery } from "@/features/admin/adminApiSlice";
import Image from "next/image";
import { useState } from "react";
import { AiOutlineCalendar } from "react-icons/ai";

export default function AdminEventsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useGetAllEventsAdminQuery({
    page,
    limit: 20,
  });
  const events = data?.events ?? [];

  const statusLabel = (event: (typeof events)[number]) =>
    event.isActive ? "Active" : event.isUpcoming ? "Upcoming" : "Expired";
  const statusVariant = (event: (typeof events)[number]) =>
    event.isActive ? "success" : event.isUpcoming ? "info" : "neutral";

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Events</h1>
      {isLoading ? (
        <TableSkeleton rows={8} cols={4} />
      ) : isError ? (
        <p className="text-sm text-error">Could not load events.</p>
      ) : events.length === 0 ? (
        <EmptyState
          icon={<AiOutlineCalendar size={26} />}
          title="No events yet"
        />
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="md:hidden divide-y divide-border rounded-lg bg-surface shadow-sm overflow-hidden">
            {events.map((event) => (
              <div key={event._id} className="p-4 flex items-center gap-3">
                <div className="relative w-12 h-12 shrink-0">
                  <Image
                    src={event.images?.[0]?.url || "/placeholder.png"}
                    alt={event.name}
                    fill
                    sizes="48px"
                    className="object-cover rounded-[5px]"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{event.name}</p>
                  <Badge variant={statusVariant(event)}>
                    {statusLabel(event)}
                  </Badge>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-medium">${event.discountPrice}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.stock} in stock
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block bg-surface rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event._id} className="border-t border-border">
                    <td className="px-4 py-3 flex items-center gap-2">
                      <div className="relative w-10 h-10 shrink-0">
                        <Image
                          src={event.images?.[0]?.url || "/placeholder.png"}
                          alt={event.name}
                          fill
                          sizes="40px"
                          className="object-cover rounded-[5px]"
                        />
                      </div>
                      {event.name}
                    </td>
                    <td className="px-4 py-3">{statusLabel(event)}</td>
                    <td className="px-4 py-3">${event.discountPrice}</td>
                    <td className="px-4 py-3">{event.stock}</td>
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
