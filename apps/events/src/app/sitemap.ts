import type { MetadataRoute } from "next";

import { EVENTS } from "@/content/events";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL },
    ...EVENTS.map((event) => ({ url: `${SITE_URL}/${event.slug}` })),
  ];
}
