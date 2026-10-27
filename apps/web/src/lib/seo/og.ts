import { SITE_URL } from "./canonical";

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

const MAX = { title: 200, eyebrow: 40, accent: 120, sub: 160, technology: 40, cves: 120 } as const;

export type OgVariant = "hero" | "default" | "advisory";

/** Facts the advisory card shows beside the title. */
export interface OgAdvisoryParams {
  cvssScore: number;
  /** `fixStatus` value, e.g. "in_progress". */
  status: string;
  technology: string;
  cves: string[];
}

export interface OgImageParams {
  title: string;
  variant?: OgVariant | undefined;
  eyebrow?: string | undefined;
  titleAccent?: string | undefined;
  sub?: string | undefined;
  /** Switches the card to the advisory layout (variant is forced to "advisory"). */
  advisory?: OgAdvisoryParams | undefined;
}

/** Absolute URL of the dynamic OG card for these params. */
export function ogImageUrl({ title, variant, eyebrow, titleAccent, sub, advisory }: OgImageParams): string {
  const params = new URLSearchParams();
  params.set("title", title.slice(0, MAX.title));
  if (advisory) {
    params.set("variant", "advisory");
    params.set("cvss", advisory.cvssScore.toFixed(1));
    params.set("status", advisory.status);
    if (advisory.technology) params.set("tech", advisory.technology.slice(0, MAX.technology));
    if (advisory.cves.length > 0) params.set("cves", advisory.cves.join(",").slice(0, MAX.cves));
  } else if (variant && variant !== "default") {
    params.set("variant", variant);
  }
  if (eyebrow) params.set("eyebrow", eyebrow.slice(0, MAX.eyebrow));
  if (titleAccent) params.set("accent", titleAccent.slice(0, MAX.accent));
  if (sub) params.set("sub", sub.slice(0, MAX.sub));
  return `${SITE_URL}/api/og?${params.toString()}`;
}
