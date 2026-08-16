import type { Metadata } from "next";
import EventDetails from "@/components/Events/EventDetails";
import { serverApiFetch } from "@/lib/server-api";
import type { IEvent } from "@/features/events/eventApiSlice";

interface GetEventResponse {
  success: boolean;
  event: IEvent;
}

async function fetchEvent(id: string): Promise<IEvent | null> {
  const data = await serverApiFetch<GetEventResponse>(
    `/event/get-event/${encodeURIComponent(id)}`,
    { revalidate: 60, tags: [`event-${id}`] }
  );
  return data?.event ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await fetchEvent(id);

  if (!event) {
    return { title: "Event Details" };
  }

  const description =
    event.description?.slice(0, 155) || `${event.name} — shop this event on Mercovia.`;
  const image = event.images?.[0]?.url;

  return {
    title: event.name,
    description,
    alternates: { canonical: `/events/${id}` },
    openGraph: {
      title: event.name,
      description,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await fetchEvent(id);

  return <EventDetails eventId={id} initialEvent={event ?? undefined} />;
}