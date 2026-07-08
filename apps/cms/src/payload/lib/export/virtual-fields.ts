/**
 * Redirects a handful of export field-picker names to the real, nested
 * storage path Payload actually populates. The five names below are
 * `type: 'ui'` sidebar widgets (`apps/cms/src/payload/fields/seo.ts`,
 * `seoSidebarFields`) — pure admin display, never populated into `doc`.
 * The real values live in the hidden `seo` group. See design doc
 * addendum "1. Several picker checkboxes silently exported blank".
 */
export const VIRTUAL_FIELD_SOURCE_PATH: Readonly<Record<string, string>> = {
  seoTitle: 'seo.title',
  seoDescription: 'seo.description',
  seoIndexable: 'seo.indexable',
  canonicalUrl: 'seo.canonicalOverride',
  socialCard: 'seo.ogImage',
};

/** Resolves a requested export field name to its real dot-path source.
 * Any name not in the map (i.e. every ordinary top-level field) passes
 * through unchanged. */
export const resolveVirtualFieldPath = (fieldName: string): string =>
  VIRTUAL_FIELD_SOURCE_PATH[fieldName] ?? fieldName;

/** Pure dot-path getter. Walks `path` split on `.`, returning `undefined`
 * as soon as a segment is missing or an intermediate value isn't a
 * plain object — never throws on a malformed/partial doc. */
export const getByPath = (obj: unknown, path: string): unknown => {
  let current: unknown = obj;
  for (const segment of path.split('.')) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
};
