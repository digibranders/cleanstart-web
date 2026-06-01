import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CommunityImage } from '@/lib/api/community-images';

vi.mock('@/lib/api/community-images', () => ({
  fetchCommunityImages: vi.fn(),
}));

import { fetchCommunityImages } from '@/lib/api/community-images';
import { fetchLatestImages, imageDetailsHref, IMAGES_SUBDOMAIN_BASE, LATEST_IMAGES_POOL_SIZE } from './latest-images';

function img(name: string, publishedAt?: string, updatedAt?: string): CommunityImage {
  const out: CommunityImage = { id: name, name, description: '', imageUrl: `https://cdn/${name}.png` };
  if (publishedAt) out.publishedAt = publishedAt;
  if (updatedAt) out.updatedAt = updatedAt;
  return out;
}

describe('fetchLatestImages', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns [] when the API returns []', async () => {
    vi.mocked(fetchCommunityImages).mockResolvedValue([]);
    expect(await fetchLatestImages()).toEqual([]);
  });

  it('sorts by updatedAt desc, falling back to publishedAt', async () => {
    vi.mocked(fetchCommunityImages).mockResolvedValue([
      img('a', '2026-01-01', '2026-05-01'), // updatedAt 2026-05-01
      img('b', '2026-03-01'), // no updatedAt → falls back to publishedAt 2026-03-01
      img('c', undefined, '2026-04-01'), // updatedAt 2026-04-01
    ]);
    const out = await fetchLatestImages();
    expect(out.map((x) => x.name)).toEqual(['a', 'c', 'b']);
  });

  it('slices to LATEST_IMAGES_POOL_SIZE', async () => {
    const many: CommunityImage[] = Array.from({ length: 20 }, (_, i) =>
      img(`x${i}`, `2026-${String(i + 1).padStart(2, '0')}-01`),
    );
    vi.mocked(fetchCommunityImages).mockResolvedValue(many);
    const out = await fetchLatestImages();
    expect(out).toHaveLength(LATEST_IMAGES_POOL_SIZE);
  });
});

describe('imageDetailsHref', () => {
  it('builds the canonical URL', () => {
    expect(imageDetailsHref('python')).toBe(`${IMAGES_SUBDOMAIN_BASE}/python/details`);
  });
  it('encodes special characters in the name', () => {
    expect(imageDetailsHref('python 3.12')).toBe(`${IMAGES_SUBDOMAIN_BASE}/python%203.12/details`);
  });
});
