/**
 * Compose the curated custom-head-tags escape hatch into structured
 * descriptors the consumer renders into `<meta>` elements.
 *
 * Two kinds in v1:
 *   meta-name     → `<meta name="…" content="…">`
 *   meta-property → `<meta property="…" content="…">`
 *
 * Pure: no env, no fetch. Drops malformed rows (empty key, empty
 * content) silently — schema-level `required: true` already prevents
 * editor input from reaching here malformed, but consumer rendering
 * paths (apps/web after migration / API ingest) might pass partial
 * shapes during compose, so the lib is defensive.
 */

export type CustomTagKind = 'meta-name' | 'meta-property';

export interface CustomTagRow {
  readonly kind?: CustomTagKind | null;
  readonly key?: string | null;
  readonly content?: string | null;
}

export interface ComposedMetaTag {
  readonly tag: 'meta';
  readonly attrs: {
    readonly name?: string;
    readonly property?: string;
    readonly content: string;
  };
}

const isCustomTagKind = (value: unknown): value is CustomTagKind =>
  value === 'meta-name' || value === 'meta-property';

export const composeCustomTags = (
  rows: ReadonlyArray<CustomTagRow> | null | undefined,
): ComposedMetaTag[] => {
  if (!rows) return [];
  const out: ComposedMetaTag[] = [];
  for (const row of rows) {
    const kind = row.kind;
    if (!isCustomTagKind(kind)) continue;
    const key = typeof row.key === 'string' ? row.key.trim() : '';
    const content = typeof row.content === 'string' ? row.content.trim() : '';
    if (key.length === 0 || content.length === 0) continue;

    if (kind === 'meta-name') {
      out.push({ tag: 'meta', attrs: { name: key, content } });
    } else {
      out.push({ tag: 'meta', attrs: { property: key, content } });
    }
  }
  return out;
};
