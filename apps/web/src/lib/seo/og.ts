// apps/web/src/lib/seo/og.ts
import { SITE_URL } from "./canonical";

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

const MAX = { title: 200, eyebrow: 40, accent: 120, sub: 160 } as const;

export type OgVariant = "hero" | "default";

export interface OgImageParams {
  title: string;
  variant?: OgVariant | undefined;
  eyebrow?: string | undefined;
  titleAccent?: string | undefined;
  sub?: string | undefined;
}

/** Absolute URL of the dynamic OG card for these params. */
export function ogImageUrl({ title, variant, eyebrow, titleAccent, sub }: OgImageParams): string {
  const params = new URLSearchParams();
  params.set("title", title.slice(0, MAX.title));
  if (variant && variant !== "default") params.set("variant", variant);
  if (eyebrow) params.set("eyebrow", eyebrow.slice(0, MAX.eyebrow));
  if (titleAccent) params.set("accent", titleAccent.slice(0, MAX.accent));
  if (sub) params.set("sub", sub.slice(0, MAX.sub));
  return `${SITE_URL}/api/og?${params.toString()}`;
}
