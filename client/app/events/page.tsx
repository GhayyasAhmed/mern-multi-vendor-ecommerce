import type { Metadata } from "next";
import { APP_NAME } from "@/constants";
import EventsListing from "@/components/Events/EventsListing";

export const metadata: Metadata = {
  title: `Events | ${APP_NAME}`,
  description: "Browse active shopping events.",
};

export default function EventsPage() {
  return <EventsListing />;
}