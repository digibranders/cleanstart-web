import { webflowHiringStatus } from './status';
import { slugify } from '../../../apps/cms/src/payload/lib/slugify';
import { htmlToLexical } from '../../../apps/cms/src/payload/lib/webflow-import/html-to-lexical';
import { htmlToPlainText } from '../../../apps/cms/src/payload/lib/webflow-import/html-to-plain-text';
import {
  normalizeDepartment,
  normalizeEmploymentType,
  normalizeExperienceLevel,
  normalizeExperienceRange,
} from '../../../apps/cms/src/payload/lib/webflow-import/job-normalize';

const asString = (v: unknown): string | null => {
  if (typeof v !== 'string') return null;
  const stripped = htmlToPlainText(v);
  return stripped.length > 0 ? stripped : null;
};

const asHtmlString = (v: unknown): string | null =>
  typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;

export const transformJob = (row: Record<string, unknown>): Record<string, unknown> => {
  const title = asString(row.name) ?? '';
  const slug = asString(row.slug) ?? slugify(title);

  // Webflow's `job-details` is the long HTML description; `job-summary`
  // is a short one-liner that becomes the SEO description / lead text.
  // Both are 100%-populated in the live data. Payload Jobs has no
  // dedicated summary field, so we prepend the summary as an italic
  // paragraph to the body so it stays visible to the editor.
  const summary = asString(row['job-summary']);
  const details =
    asHtmlString(row['job-details']) ?? asHtmlString(row.description) ?? asHtmlString(row.body);
  const bodyHtml = summary
    ? `<p><em>${summary}</em></p>${details ?? ''}`
    : details;

  const department = normalizeDepartment(row.department);
  const employmentType = normalizeEmploymentType(row.timing ?? row.type);
  const experienceLevel = normalizeExperienceLevel(row.experience);
  const experienceRange = normalizeExperienceRange(row.experience);

  return {
    _webflowId: row.webflowId,
    _status: 'published',
    hiringStatus: webflowHiringStatus(row),
    title,
    slug,
    source: 'cms',
    department: department ?? undefined,
    employmentType: employmentType ?? undefined,
    experienceLevel: experienceLevel ?? undefined,
    experienceRange: experienceRange ?? undefined,
    body: bodyHtml ? htmlToLexical(bodyHtml) : undefined,
    applyUrl: asString(row['apply-url']),
    seo: buildSeoOverrides(row),
    _rawJobLocation: row['job-location'] ?? row.location ?? null,
  };
};

const buildSeoOverrides = (row: Record<string, unknown>): Record<string, unknown> | undefined => {
  const title = asString(row['meta-title']);
  const description = asString(row['meta-description']) ?? asString(row['job-summary']);
  if (!title && !description) return undefined;
  const seo: Record<string, unknown> = {};
  if (title) seo.title = title;
  if (description) seo.description = description;
  return seo;
};
