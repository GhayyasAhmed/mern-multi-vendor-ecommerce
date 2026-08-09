"use client";
import EventCard from "@/components/Events/EventCard";
import Footer from "@/components/Layout/Footer";
import Header from "@/components/Layout/Header";
import CardListSkeleton from "@/components/ui/CardListSkeleton";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import { getErrorMessage } from "@/features/auth/utils";
import { useGetAllEventsQuery } from "@/features/events/eventApiSlice";
import styles from "@/styles/styles";
import { useState } from "react";
import { AiOutlineCalendar } from "react-icons/ai";

const EventsListing = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useGetAllEventsQuery({
    status: "active",
    page,
  });
  const events = data?.events ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <Header activeHeading={4} />
      <div className={`${styles.section} py-8 min-h-[60vh]`}>
        <div className={`${styles.heading}`}>
          <h1>All Events</h1>
        </div>

        {isLoading ? (
          <CardListSkeleton count={4} />
        ) : isError ? (
          <p className="text-center text-[15px] text-red-500 py-12">
            {getErrorMessage(error, "Could not load events.")}
          </p>
        ) : events.length === 0 ? (
           <EmptyState icon={<AiOutlineCalendar size={26} />} title="No active events right now" />        
        ) : (
          <>
            <div className="w-full grid">
              {events.map((event) => (
                <EventCard data={event} key={event._id} />
              ))}
            </div>
            {pagination && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default EventsListing;
