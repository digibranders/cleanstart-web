import { slugify } from '../../../lib/slugify';

/**
 * Build the `x-media-context-hint` header value attached to inline
 * media uploads. The Media collection's `beforeValidate` falls back to
 * this hint when the upload's alt + filename are clipboard noise
 * (`image001.png`, `pasted-{ts}`, `ingested-{ts}` etc.), so editors
 * who paste straight from Word still get human-readable R2 keys:
 * `getting-started-with-sbom-inline-<hash>.webp`.
 *
 * The collection is intentionally NOT encoded here — inline uploads land
 * in the `web/<collection>/` R2 folder already (see `folder.ts`), so a
 * `blog-` prefix on the filename would only duplicate the path segment.
 */
export const buildInlineMediaContextHint = (
  title: string | null | undefined,
  docId: number | string | null | undefined,
): string => {
  const titleSlug = title ? slugify(title) : '';
  const idStem = docId != null ? slugify(String(docId)) : '';
  const stem = titleSlug || idStem || 'untitled';
  return `${stem}-inline`;
};
