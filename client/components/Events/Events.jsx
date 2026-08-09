"use client";
import CardListSkeleton from "@/components/ui/CardListSkeleton";
import EmptyState from "@/components/ui/EmptyState";
import { useGetAllEventsQuery } from "@/features/events/eventApiSlice";
import styles from "@/styles/styles";
import { AiOutlineCalendar } from "react-icons/ai";
import EventCard from "./EventCard";

const Events = () => {
  const { data, isLoading, isError } = useGetAllEventsQuery({ status: "active", limit: 4 });
  const events = data?.events ?? [];

  return (
    <div>
      <div className={`${styles.section}`}>
        <div className={`${styles.heading}`}>
          <h1>Popular Events</h1>
        </div>
        {isLoading ? (
          <CardListSkeleton count={2} />
        ) : isError ? (
          <p className="text-center text-[15px] text-red-500 pb-12">Could not load events.</p>
        ) : events.length === 0 ? (
          <EmptyState icon={<AiOutlineCalendar size={26} />} title="No active events right now" />
        ) : (
          <div className="w-full grid">
            {events.map((event) => (
              <EventCard data={event} key={event._id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;