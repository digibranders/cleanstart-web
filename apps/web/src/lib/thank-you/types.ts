import { z } from "zod";

/**
 * The forms that redirect to a thank-you page.
 *
 * These strings are the URL segment, the GA4 `form_name` param and the content
 * map key, all at once. Keeping them identical means a GA4 exploration can join
 * `page_path` to `form_name` without a lookup table, and an ads conversion rule
 * is one URL per campaign.
 *
 * They are effectively permanent: CLAUDE.md forbids renaming a route segment
 * post-launch because it breaks every indexed URL and every configured
 * conversion.
 *
 * Newsletter and gated downloads are deliberately absent. They keep the inline
 * banner: sending a reader away from the article they subscribed from is a
 * regression, and a gated download's conversion moment is the file itself,
 * which already fires `file_download`.
 *
 * Become a Partner is absent too. It is a modal, so redirecting throws away
 * scroll position on a page the visitor was reading, and dialog teardown plus
 * focus restoration costs more than the four other forms combined.
 */
export const THANK_YOU_TYPES = [
  "book-a-demo",
  "contact",
  "deal-registration",
  "job-application",
] as const;

export type ThankYouType = (typeof THANK_YOU_TYPES)[number];

/** A route param is a boundary, so it is parsed rather than cast. */
export const thankYouTypeSchema = z.enum(THANK_YOU_TYPES);

export const isThankYouType = (value: string): value is ThankYouType =>
  thankYouTypeSchema.safeParse(value).success;
