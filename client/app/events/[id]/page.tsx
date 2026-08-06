import type { Metadata } from "next";
import EventDetails from "@/components/Events/EventDetails";

export const metadata: Metadata = {
  title: "Event Details",
};

export default async function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <EventDetails eventId={id} />;
}