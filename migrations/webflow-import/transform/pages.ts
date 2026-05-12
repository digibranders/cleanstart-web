import { slugify } from '../../../apps/cms/src/payload/lib/slugify';

export const transformPage = (row: Record<string, unknown>): Record<string, unknown> => {
  const slug = (row.slug as string | undefined) ?? slugify(row.name as string | undefined);
  return {
    _webflowId: row.webflowId,
    _status: 'published',
    title: row.name ?? '',
    slug,
    _rawBody: row.body ?? row.content ?? null,
    _rawHeroImage: row.image ?? row['hero-image'] ?? null,
    seo: {
      title: row['seo-title'] ?? row['meta-title'] ?? null,
      description: row['seo-description'] ?? row['meta-description'] ?? null,
    },
  };
};
