/**
 * Google Tag Manager container id, sourced from `NEXT_PUBLIC_GTM_ID`.
 *
 * Set only on the production deploy. Read at call time (not module scope) so it
 * is stubbable in tests, and validated so a typo fails safe: the caller renders
 * nothing rather than injecting a broken loader. Because the id is validated
 * against this character class, it is safe to interpolate into the inline loader
 * snippet and the loader URL.
 *
 * The host gate is deliberately not here. The Vercel production environment
 * serves www and its `*.vercel.app` aliases from the same build, so the id is
 * baked into both, and a statically prerendered layout cannot read the request
 * host. `gtm-snippet.ts` carries the guard and runs it in the browser.
 */
const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/;

export function gtmContainerId(): string | null {
  const id = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  return id && GTM_ID_PATTERN.test(id) ? id : null;
}
