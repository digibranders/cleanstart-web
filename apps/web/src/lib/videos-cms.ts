import { fetchCMS } from "./cms-fetch";
import { firstParagraph, sanitizeDescription, type Video } from "./videos-utils";

// A video publish purges the /videos path (apps/cms route-prefixes), which refreshes this read;
// `videos` is the tag for anything that wants to purge it by name.
const TAGS = ["videos"] as const;

type CmsTopic = { id?: number | string; slug: string; name: string };
type CmsVideo = {
  id?: number | string;
  slug?: string | null;
  title?: string | null;
  externalId?: string | null;
  format?: "explainer" | "demo" | "talk" | null;
  topics?: (CmsTopic | number | string)[] | null;
  summary?: string | null;
  durationLabel?: string | null;
  featured?: boolean | null;
  publishedAt?: string | null;
  syncState?: string | null;
  source?: {
    description?: string | null;
    durationSeconds?: number | null;
    publishedAt?: string | null;
    hasMaxres?: boolean | null;
    privacyStatus?: string | null;
    embeddable?: boolean | null;
  } | null;
};
type CmsList = { docs: CmsVideo[] };

/** "1:41" is 101, "1:02:10" is 3730. Anything else is null, so a typo never becomes a wrong badge. */
export const parseDurationLabel = (label: string | null | undefined): number | null => {
  const match = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})$/.exec(label?.trim() ?? "");
  if (!match) return null;
  const [, h = "0", m = "0", s = "0"] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
};

const isPopulatedTopic = (t: CmsTopic | number | string): t is CmsTopic =>
  typeof t === "object" && t !== null && typeof t.slug === "string";

const byNewest = (a: Video, b: Video): number => b.publishedAt.localeCompare(a.publishedAt);

// Talks and webinars are not part of this page (they live on /webinars and /podcast). A video
// YouTube no longer plays here (gone, private, embedding off) would show a broken player, so the
// page hides it until an editor or the next sync sets it right.
const isUsable = (doc: CmsVideo): boolean =>
  Boolean(doc.slug && doc.externalId) &&
  doc.format !== "talk" &&
  doc.syncState !== "missing" &&
  doc.source?.privacyStatus !== "private" &&
  doc.source?.embeddable !== false;

export const mapCmsVideo = (doc: CmsVideo): Video => {
  const rawDescription = doc.source?.description;
  const description = rawDescription ? sanitizeDescription(rawDescription) : (doc.summary ?? "");
  return {
    id: doc.externalId ?? "",
    slug: doc.slug ?? "",
    title: doc.title ?? "",
    format: doc.format === "talk" ? null : (doc.format ?? null),
    topics: (doc.topics ?? [])
      .filter(isPopulatedTopic)
      .map((t) => ({ slug: t.slug, label: t.name })),
    publishedAt: doc.source?.publishedAt ?? doc.publishedAt ?? "",
    durationSeconds:
      doc.source?.durationSeconds ?? parseDurationLabel(doc.durationLabel) ?? undefined,
    summary: doc.summary?.trim() || firstParagraph(description),
    description,
    thumb: doc.source?.hasMaxres === false ? "hq" : "maxres",
    featured: doc.featured === true,
  };
};

/**
 * Published videos, newest first. A CMS failure throws on purpose: during ISR
 * revalidation Next then keeps serving the last good page instead of caching an
 * empty listing.
 */
export async function getCmsVideos(): Promise<Video[]> {
  const params = new URLSearchParams({
    "where[_status][equals]": "published",
    sort: "-publishedAt",
    depth: "1",
    limit: "200",
  });
  const data = await fetchCMS<CmsList>(`/api/videos?${params.toString()}`, { tags: TAGS });
  return data.docs.filter(isUsable).map(mapCmsVideo).sort(byNewest);
}
