import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EventView } from "@/components/event/EventView";
import { REVALIDATE_SECONDS, getEvent } from "@/lib/cms";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = REVALIDATE_SECONDS;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const event = await getEvent((await params).slug);
  if (!event) return {};
  return {
    title: event.title,
    ...(event.description ? { description: event.description } : {}),
    alternates: { canonical: `/${event.slug}` },
  };
}

export default async function EventPage({ params }: PageProps): Promise<React.ReactElement> {
  const event = await getEvent((await params).slug);
  if (!event) notFound();
  return <EventView event={event} />;
}
