import type { Metadata } from "next";

/**
 * Google Search Console site-verification, sourced from
 * `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` rather than the CMS so the
 * `<meta name="google-site-verification">` tag is environment-scoped: it ships
 * only on the deploy that sets the variable (production), keeping noindex hosts
 * (staging / preview) out of the verified-property set and decoupling
 * verification from CMS availability. Set once in the root layout's `metadata`,
 * it is inherited by every route (child pages never override `verification`).
 *
 * (DNS TXT verification is an alternative that needs no tag at all; this helper
 * covers the HTML-tag method. The CMS `seoDefaults.verification.google` field is
 * left for the Phase-J2 dashboard's display, not for emitting the live tag.)
 *
 * Returns a `Metadata["verification"]` object, or undefined when the token is
 * unset/blank so Next.js emits NO empty meta tag.
 */
export function siteVerification(): Metadata["verification"] | undefined {
  const token = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
  if (!token) return undefined;
  return { google: token };
}
