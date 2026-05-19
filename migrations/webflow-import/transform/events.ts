import { slugify } from '../../../apps/cms/src/payload/lib/slugify';
import { htmlToLexical } from '../../../apps/cms/src/payload/lib/webflow-import/html-to-lexical';

const asString = (v: unknown): string | null =>
  typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;

interface WebflowGalleryItem {
  readonly url?: string;
  readonly alt?: string | null;
}

const isGalleryItem = (v: unknown): v is WebflowGalleryItem =>
  typeof v === 'object' && v !== null && 'url' in v;

export const transformEvent = (row: Record<string, unknown>): Record<string, unknown> => {
  const title = asString(row.name) ?? '';
  const slug = asString(row.slug) ?? slugify(title);
  // `venue` is required in Payload. Fall back to a generic dash if
  // Webflow shipped no venue — editor will fix during the publish
  // checklist; we don't want a validation failure to stop the import.
  const venue = asString(row.venue) ?? asString(row.location) ?? '—';
  const abstract = asString(row['abstract-2']) ?? asString(row.description);
  const bodyHtml = asString(row['main-text']) ?? asString(row.body);
  const startsAt = asString(row['event-date']) ?? asString(row['start-date']);
  const endsAt = asString(row['end-date']);
  const customDateLabel = asString(row['event-custom-date']);
  const registrationUrl = asString(row['custom-link']) ?? asString(row['registration-link']);

  const galleryRaw = Array.isArray(row.gallery) ? row.gallery : [];
  const rawGallery = galleryRaw
    .filter(isGalleryItem)
    .map((item) => ({ url: item.url, alt: item.alt ?? null }));

  return {
    _webflowId: row.webflowId,
    _status: 'published',
    title,
    slug,
    venue,
    abstract,
    body: bodyHtml ? htmlToLexical(bodyHtml) : undefined,
    startsAt,
    endsAt,
    customDateLabel,
    // Force 'external' mode even when no URL is present — Payload
    // requires `registrationForm` whenever mode is 'internal', and the
    // Forms collection is empty pre-migration. Editors backfill the
    // real URL or switch to in-house mode during the publishing
    // checklist. The placeholder URL flags the row visibly.
    registrationMode: 'external',
    registrationUrl: registrationUrl ?? 'https://cleanstart.com#register-tbd',
    eventStatus: 'scheduled',
    seo: buildSeoOverrides(row),
    _rawHeroImage: row['main-image'] ?? row.image ?? null,
    _rawGallery: rawGallery.length > 0 ? rawGallery : null,
    _rawSpeakers: row.speakers ?? row.authors ?? null,
  };
};

const buildSeoOverrides = (row: Record<string, unknown>): Record<string, unknown> | undefined => {
  const title = asString(row['meta-title']);
  const description = asString(row['meta-description']);
  if (!title && !description) return undefined;
  const seo: Record<string, unknown> = {};
  if (title) seo.title = title;
  if (description) seo.description = description;
  return seo;
};
