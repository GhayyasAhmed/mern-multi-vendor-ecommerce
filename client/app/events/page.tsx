import type { Metadata } from "next";

import EventsListing from "@/components/Events/EventsListing";

export const metadata: Metadata = {
  title: `Events `,
  description: "Browse active shopping events.",
};

export default function EventsPage() {
  return <EventsListing />;
}