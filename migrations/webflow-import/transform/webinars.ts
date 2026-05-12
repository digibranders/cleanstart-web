import { slugify } from '../../../apps/cms/src/payload/lib/slugify';
import { resolveWebinarRegion } from '../../../apps/cms/src/payload/lib/webflow-import/webinars-region';

export const transformWebinar = (row: Record<string, unknown>): Record<string, unknown> => {
  const slug = (row.slug as string | undefined) ?? slugify(row.name as string | undefined);
  const region = resolveWebinarRegion({ rawRegion: row.region as string | undefined, rawTimezone: row.timezone as string | undefined });
  return {
    _webflowId: row.webflowId,
    _status: 'published',
    title: row.name ?? '',
    slug,
    abstract: row.description ?? row.summary ?? null,
    body: row.body ?? null,
    startDate: row['date-time'] ?? row.startDate ?? null,
    recordingUrl: row['recording-url'] ?? row.recordingUrl ?? null,
    region: region ?? null,
    registrationMode: row['registration-url'] ? 'external' : 'internal',
    registrationUrl: row['registration-url'] ?? null,
    _rawHeroImage: row.image ?? row.thumbnail ?? null,
    _rawAuthors: row.speakers ?? row.authors ?? null,
  };
};
