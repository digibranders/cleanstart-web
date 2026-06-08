/**
 * Normalises an Academy article body before HTML→Lexical conversion.
 *
 * The Academy bodies carry a few artifacts that shouldn't reach the public
 * Knowledge Hub:
 *   1. A leading `<h1>` that duplicates the article title (our page already
 *      renders the title as the page H1).
 *   2. An editorial front-matter paragraph (Document ID / Target Audience /
 *      Keywords) on some articles — internal metadata, not body copy.
 *   3. Decorative `↗` link arrows appended to headings/links, stored
 *      double-encoded as `&amp;nearr;` so they render as the literal text
 *      "&nearr;".
 */
export function cleanAcademyHtml(html: string): string {
  let s = html;

  // Strip decorative arrow entities (single- or double-encoded): nearr, rarr,
  // larr, uarr, darr, harr, nwarr, searr, swarr, …
  s = s.replace(/&amp;[a-z]{1,6}arr;/gi, '').replace(/&[a-z]{1,6}arr;/gi, '');

  // Strip a single leading <h1> (duplicates the page title).
  s = s.replace(/^\s*<h1\b[^>]*>[\s\S]*?<\/h1>\s*/i, '');

  // Strip the leading editorial front-matter paragraph (Document ID / Target
  // Audience / Keywords) when present.
  s = s.replace(/^\s*<p>[\s\S]*?<strong>\s*Document ID\s*<\/strong>[\s\S]*?<\/p>\s*/i, '');

  return s.trim();
}
