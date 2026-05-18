// Client-safe news helpers extracted from `lib/news.ts` so client
// components don't transitively pull `next/headers` via `cms-fetch`.

import type { PressType } from "./news";

const PRESS_TYPE_LABEL: Record<PressType, string> = {
  "press-release": "Press Release",
  news: "News",
  announcement: "Announcement",
  feature: "Feature",
};

export function pressTypeLabel(value: PressType | null | undefined): string {
  return PRESS_TYPE_LABEL[value ?? "press-release"];
}

export function formatNewsDate(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
