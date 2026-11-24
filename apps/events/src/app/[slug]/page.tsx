import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EventView } from "@/components/event/EventView";
import { EVENTS, getEvent } from "@/content/events";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return EVENTS.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const event = getEvent((await params).slug);
  if (!event) return {};
  return {
    title: event.title,
    description: event.description,
    alternates: { canonical: `/${event.slug}` },
  };
}

export default async function EventPage({ params }: PageProps): Promise<React.ReactElement> {
  const event = getEvent((await params).slug);
  if (!event) notFound();
  return <EventView event={event} />;
}
