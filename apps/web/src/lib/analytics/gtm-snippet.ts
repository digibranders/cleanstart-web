import { NOINDEX_HOSTS, NOINDEX_HOST_SUFFIXES } from "@/lib/seo/indexing";

/**
 * Builds the Google Tag Manager loader that ships inside the server-rendered
 * `<head>`.
 *
 * Emitted immediately after the Consent Mode default snippet, so
 * `gtag('consent','default', ...)` is already on the dataLayer when the
 * container boots and every tag evaluates its consent check against the right
 * state. The dataLayer is reused, never reassigned, for the same reason.
 *
 * The host guard runs in the browser because the marketing site is statically
 * prerendered: the layout cannot read `headers()` without forcing every route
 * dynamic, and the Vercel production environment serves www and the noindex
 * aliases from the same build. Serializing the lists from `lib/seo/indexing.ts`
 * keeps one source of truth: a host we don't index is a host we don't track.
 *
 * @param containerId a `^GTM-[A-Z0-9]+$` id validated by `gtmContainerId()`,
 *   which is why it is safe to interpolate into the string literals below.
 */
export function buildGtmSnippet(containerId: string): string {
  // Emitted only when the corresponding list is non-empty, so an empty
  // NOINDEX_HOSTS doesn't ship a dead `[].indexOf(h)` check to every visitor.
  const guards = [
    NOINDEX_HOSTS.length > 0
      ? `if(${JSON.stringify(NOINDEX_HOSTS)}.indexOf(h)>-1)return;`
      : null,
    NOINDEX_HOST_SUFFIXES.length > 0
      ? `if(${JSON.stringify(
          NOINDEX_HOST_SUFFIXES,
        )}.some(function(s){return h.slice(-s.length)===s}))return;`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `(function(){
var h=(location.hostname||"").toLowerCase();
if(!h)return;
${guards}
window.dataLayer=window.dataLayer||[];
window.dataLayer.push({"gtm.start":new Date().getTime(),event:"gtm.js"});
var s=document.createElement("script");
s.async=true;
s.src="https://www.googletagmanager.com/gtm.js?id=${containerId}";
document.head.appendChild(s);
})();`;
}
