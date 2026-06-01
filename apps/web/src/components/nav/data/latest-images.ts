import { fetchCommunityImages, type CommunityImage } from '@/lib/api/community-images';

export const LATEST_IMAGES_POOL_SIZE = 8;
export const IMAGES_SUBDOMAIN_BASE = 'https://images.cleanstart.com/images';

export const imageDetailsHref = (name: string): string =>
  `${IMAGES_SUBDOMAIN_BASE}/${encodeURIComponent(name)}/details`;

/**
 * Newest-first by `updatedAt` (most recently maintained), falling back to
 * `publishedAt` when an image has never been updated. Index 0 is therefore the
 * latest-updated image — the freshness signal the Products hero features.
 *
 * The hero shows a `docker pull` command, so it features ONLY anonymously-pullable
 * images (`isPublic === true` ↔ `docker pull cleanstart/<name>`); enterprise/org
 * images are excluded here even though the community page still lists them.
 */
export async function fetchLatestImages(): Promise<CommunityImage[]> {
  const all = await fetchCommunityImages();
  const pullable = all.filter((img) => img.isPublic === true);
  if (pullable.length === 0) return [];
  return pullable
    .sort((a, b) => {
      const ad = a.updatedAt ?? a.publishedAt ?? '';
      const bd = b.updatedAt ?? b.publishedAt ?? '';
      return bd.localeCompare(ad);
    })
    .slice(0, LATEST_IMAGES_POOL_SIZE);
}
