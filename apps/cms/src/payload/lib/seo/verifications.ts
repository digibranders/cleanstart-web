/**
 * Compose site-wide search-engine verification meta tags from the
 * `seoDefaults.verification` global. Used by the public-site renderer
 * to emit a `<meta name="…" content="…">` per non-empty token.
 *
 * Pure: no env, no fetch. The global is the single source — every
 * verification meta on every page comes from here so editors only set
 * tokens once per ownership change.
 */

import type { ComposedMetaTag } from './custom-tags';

export interface VerificationsInput {
  /** From `seoDefaults.verification` global. */
  readonly google?: string | null;
  readonly bing?: string | null;
  readonly pinterest?: string | null;
  readonly yandex?: string | null;
  readonly facebookDomain?: string | null;
}

const META_NAMES: ReadonlyArray<{ key: keyof VerificationsInput; metaName: string }> = [
  { key: 'google', metaName: 'google-site-verification' },
  { key: 'bing', metaName: 'msvalidate.01' },
  { key: 'pinterest', metaName: 'p:domain_verify' },
  { key: 'yandex', metaName: 'yandex-verification' },
  { key: 'facebookDomain', metaName: 'facebook-domain-verification' },
];

export const composeVerificationMetas = (
  input: VerificationsInput | null | undefined,
): ComposedMetaTag[] => {
  if (!input) return [];
  const out: ComposedMetaTag[] = [];
  for (const { key, metaName } of META_NAMES) {
    const raw = input[key];
    if (typeof raw !== 'string') continue;
    const value = raw.trim();
    if (value.length === 0) continue;
    out.push({ tag: 'meta', attrs: { name: metaName, content: value } });
  }
  return out;
};
