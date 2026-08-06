"use client";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import EventCard from "@/components/Events/EventCard";
import styles from "@/styles/styles";
import { useGetAllEventsQuery } from "@/features/events/eventApiSlice";
import { getErrorMessage } from "@/features/auth/utils";

const EventsListing = () => {
  const { data, isLoading, isError, error } = useGetAllEventsQuery({ status: "active" });
  const events = data?.events ?? [];

  return (
    <div>
      <Header activeHeading={4} />
      <div className={`${styles.section} py-8 min-h-[60vh]`}>
        <div className={`${styles.heading}`}>
          <h1>All Events</h1>
        </div>

        {isLoading ? (
          <p className="text-center text-[15px] text-[#00000082] py-12">Loading events...</p>
        ) : isError ? (
          <p className="text-center text-[15px] text-red-500 py-12">
            {getErrorMessage(error, "Could not load events.")}
          </p>
        ) : events.length === 0 ? (
          <p className="text-center text-[15px] text-[#00000082] py-12">No active events right now.</p>
        ) : (
          <div className="w-full grid">
            {events.map((event) => (
              <EventCard data={event} key={event._id} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default EventsListing;