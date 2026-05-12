import { slugify } from '../../../apps/cms/src/payload/lib/slugify';

export const transformResource = (row: Record<string, unknown>): Record<string, unknown> => {
  const slug = (row.slug as string | undefined) ?? slugify(row.name as string | undefined);
  return {
    _webflowId: row.webflowId,
    _status: 'published',
    title: row.name ?? '',
    slug,
    abstract: row.description ?? row.summary ?? null,
    resourceType: row['resource-type'] ?? row.resourceType ?? null,
    downloadUrl: row['download-url'] ?? row.downloadUrl ?? null,
    _rawHeroImage: row.image ?? row.thumbnail ?? null,
    _rawCategories: row.categories ?? null,
  };
};
