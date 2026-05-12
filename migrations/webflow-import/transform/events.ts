import { slugify } from '../../../apps/cms/src/payload/lib/slugify';

export const transformEvent = (row: Record<string, unknown>): Record<string, unknown> => {
  const slug = (row.slug as string | undefined) ?? slugify(row.name as string | undefined);
  const registrationUrl = row['registration-link'] ?? row['registration-url'] ?? null;
  return {
    _webflowId: row.webflowId,
    _status: 'published',
    title: row.name ?? '',
    slug,
    abstract: row.description ?? row.summary ?? null,
    body: row.body ?? null,
    startDate: row['start-date'] ?? row.startDate ?? null,
    endDate: row['end-date'] ?? row.endDate ?? null,
    location: row.location ?? null,
    registrationMode: registrationUrl ? 'external' : 'internal',
    registrationUrl: registrationUrl ?? null,
    _rawHeroImage: row.image ?? row.thumbnail ?? null,
    _rawAuthors: row.speakers ?? row.authors ?? null,
    _rawCategories: row.categories ?? null,
  };
};
