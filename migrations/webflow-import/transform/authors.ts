import { slugify } from '../../../apps/cms/src/payload/lib/slugify';
import { htmlToLexical } from '../../../apps/cms/src/payload/lib/webflow-import/html-to-lexical';

const asString = (v: unknown): string | null =>
  typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;

/**
 * Webflow Authors used flat free-text bio sub-fields. Payload moves
 * them into structured arrays (education / experience / skills /
 * awards). The original prose is preserved verbatim in `legacyBio`
 * (json field) so editors can copy it into the structured rows
 * post-migration via the LegacyBioViewer sidebar widget.
 */
export const transformAuthor = (row: Record<string, unknown>): Record<string, unknown> => {
  const name = asString(row.name) ?? '';
  const slug = asString(row.slug) ?? slugify(name);

  const role = asString(row['professional-title']) ?? asString(row.title) ?? null;
  const location = asString(row.location);
  const bioShort = asString(row['bio-summary']) ?? asString(row.description);
  const bioLongHtml = asString(row.description);

  const legacyBio: Record<string, string> = {};
  for (const k of [
    'education-qualification-2',
    'experience',
    'core-skills-expertise',
    'awards-recognition',
  ]) {
    const v = asString(row[k]);
    if (v) legacyBio[k] = v;
  }

  const social: Record<string, string> = {};
  const twitter = asString(row['twitter-profile-link']);
  const linkedin = asString(row['linkedin-profile-link']);
  const email = asString(row.email);
  const website = asString(row['author-link']);
  if (twitter) social.twitter = twitter;
  if (linkedin) social.linkedin = linkedin;
  if (email) social.email = email;
  if (website) social.website = website;

  return {
    _webflowId: row.webflowId,
    name,
    slug,
    role,
    location,
    bioShort,
    bioLong: bioLongHtml ? htmlToLexical(bioLongHtml) : undefined,
    social: Object.keys(social).length > 0 ? social : undefined,
    legacyBio: Object.keys(legacyBio).length > 0 ? legacyBio : undefined,
    acceptingNewBylines: true,
    seo: buildSeoOverrides(row),
    _rawPhoto: row.picture ?? row.photo ?? null,
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
