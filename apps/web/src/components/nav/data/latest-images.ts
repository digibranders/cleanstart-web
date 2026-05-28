import { fetchCommunityImages, type CommunityImage } from '@/lib/api/community-images';

export const LATEST_IMAGES_POOL_SIZE = 8;
export const IMAGES_SUBDOMAIN_BASE = 'https://images.cleanstart.com/images';

export const imageDetailsHref = (name: string): string =>
  `${IMAGES_SUBDOMAIN_BASE}/${encodeURIComponent(name)}/details`;

export async function fetchLatestImages(): Promise<CommunityImage[]> {
  const all = await fetchCommunityImages();
  if (all.length === 0) return [];
  return [...all]
    .sort((a, b) => {
      const ad = a.publishedAt ?? a.updatedAt ?? '';
      const bd = b.publishedAt ?? b.updatedAt ?? '';
      return bd.localeCompare(ad);
    })
    .slice(0, LATEST_IMAGES_POOL_SIZE);
}
