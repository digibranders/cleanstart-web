import { webflowStatus } from './status';
import { slugify } from '../../../apps/cms/src/payload/lib/slugify';
import { htmlToLexical } from '../../../apps/cms/src/payload/lib/webflow-import/html-to-lexical';
import { htmlToPlainText } from '../../../apps/cms/src/payload/lib/webflow-import/html-to-plain-text';
import { resolveWebinarRegion } from '../../../apps/cms/src/payload/lib/webflow-import/webinars-region';

const asString = (v: unknown): string | null => {
  if (typeof v !== 'string') return null;
  const stripped = htmlToPlainText(v);
  return stripped.length > 0 ? stripped : null;
};

const asHtmlString = (v: unknown): string | null =>
  typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;

/**
 * Map Webflow's free-text webinar type (`webinar-type`) to Payload's
 * enum values. Unknown values fall through to 'live' so the row still
 * imports; editor can correct in the publishing checklist.
 */
const TYPE_MAP: Record<string, 'live' | 'on-demand' | 'panel' | 'demo'> = {
  live: 'live',
  ondemand: 'on-demand',
  'on-demand': 'on-demand',
  'on demand': 'on-demand',
  recording: 'on-demand',
  panel: 'panel',
  demo: 'demo',
};

const normalizeWebinarType = (raw: unknown): 'live' | 'on-demand' | 'panel' | 'demo' => {
  const s = asString(raw);
  if (!s) return 'live';
  return TYPE_MAP[s.toLowerCase()] ?? 'live';
};

export const transformWebinar = (row: Record<string, unknown>): Record<string, unknown> => {
  const title = asString(row.name) ?? '';
  const slug = asString(row.slug) ?? slugify(title);
  const abstract = asString(row.description) ?? asString(row.summary);
  const bodyHtml = asHtmlString(row['main-text']) ?? asHtmlString(row.body);
  const startsAt = asString(row['webinar-date']) ?? asString(row['date-time']);
  const region = resolveWebinarRegion({
    regionList: row['region-list'],
    region: row.region,
  });
  // Webflow's `pdf-link` is misnamed — for every webinar in the live
  // CMS it actually holds the BigMarker registration URL, not a PDF.
  // Fall back to it for `registrationUrl` since neither `registration-
  // url` nor `custom-link` are populated for these rows.
  const registrationUrl =
    asString(row['registration-url']) ??
    asString(row['custom-link']) ??
    asString(row['pdf-link']) ??
    null;

  return {
    _webflowId: row.webflowId,
    _status: webflowStatus(row),
    title,
    slug,
    abstract,
    body: bodyHtml ? htmlToLexical(bodyHtml) : undefined,
    webinarType: normalizeWebinarType(row['webinar-type']),
    region: region ?? 'global',
    startsAt,
    // Force 'external' even when no URL — Payload requires
    // `registrationForm` for 'internal' mode and the Forms collection
    // is empty pre-migration. Editor fixes during publishing
    // checklist (the placeholder URL flags the row).
    registrationMode: 'external',
    registrationUrl: registrationUrl ?? 'https://cleanstart.com#register-tbd',
    eventStatus: 'scheduled',
    _rawHeroImage: row['feature-image'] ?? row.image ?? null,
    // `pdf-link` is actually the registration URL (above), not a PDF.
    // Leave `_rawPdf` unmapped — editors attach real slide decks via
    // the admin UI post-migration.
    _rawSpeakers: row.speakers ?? row.authors ?? null,
  };
};
