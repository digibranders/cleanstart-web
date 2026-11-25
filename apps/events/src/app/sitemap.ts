import type { MetadataRoute } from "next";

import { getEvents } from "@/lib/cms";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await getEvents();
  return [{ url: SITE_URL }, ...events.map((event) => ({ url: `${SITE_URL}/${event.slug}` }))];
}
