"use client";
import styles from "@/styles/styles";
import EventCard from "./EventCard";
import { useGetAllEventsQuery } from "@/features/events/eventApiSlice";
import CardListSkeleton from "@/components/ui/CardListSkeleton";

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
          <p className="text-center text-[15px] text-[#00000082] pb-12">No active events right now.</p>
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