/**
 * Collapses internal runs of whitespace to a single space and strips
 * leading / trailing whitespace. Applied to title and SEO text fields on
 * every write so Google's character counter and SERP preview are always
 * accurate regardless of how data enters the system (admin UI, REST API,
 * bulk import).
 *
 * Returns `undefined` unchanged so Payload's required-field validation
 * still fires for missing values.
 */
export function normaliseText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  return value.replace(/\s+/g, ' ').trim() || undefined;
}
