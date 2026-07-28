import { getRenderedSignature } from "@/lib/email-signatures";

/**
 * Serves ONE employee's signature as a bare HTML document.
 *
 * This is a route handler rather than a `page.tsx` on purpose. The employee's
 * workflow is ⌘A ⌘C in this tab, then paste into their mail client — so the
 * `<body>` must contain the signature table and nothing else. A React page
 * would inherit the app layout (header, footer, skip link), all of which ⌘A
 * would select and carry into the signature.
 *
 * For the same reason there is no "copy" button here: it would be selected by
 * ⌘A and pasted in. The copy affordance lives on the directory page instead.
 */

/** Matches the markup in the stored template so the preview renders as designed. */
const FONT_LINKS = [
  '<link rel="preconnect" href="https://fonts.googleapis.com" />',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
  '<link href="https://fonts.googleapis.com/css2?family=Sora:wght@100..800&display=swap" rel="stylesheet" />',
].join("");

/**
 * The signature markup is authored in the CMS, so this page renders
 * admin-supplied HTML on a cleanstart.com origin. The CSP makes that inert:
 * no script may run, and the only reachable hosts are the image CDN and
 * Google Fonts. Scripts are worthless in email anyway — every client strips
 * them — so nothing legitimate is lost.
 */
const SIGNATURE_CSP = [
  "default-src 'none'",
  "img-src https://cdn.cleanstart.com data:",
  "style-src 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join("; ");

const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char] ?? char,
  );

/**
 * Route handlers do not get Next's `metadata` export, so the noindex directive
 * has to be an actual header here. robots.txt disallows the path as well.
 */
const baseHeaders = {
  "Content-Type": "text/html; charset=utf-8",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Content-Security-Policy": SIGNATURE_CSP,
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
} as const;

export const revalidate = 300;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;

  let signature: Awaited<ReturnType<typeof getRenderedSignature>>;
  try {
    signature = await getRenderedSignature(slug);
  } catch {
    // The CMS could not answer. Answering 404 here would be cached for the
    // revalidate window, so a brief CMS restart would take a real signature
    // offline for minutes. 503 + no-store keeps the failure transient.
    return new Response(
      '<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>Temporarily unavailable</title></head><body><p>This signature is temporarily unavailable. Please try again shortly.</p></body></html>',
      {
        status: 503,
        headers: { ...baseHeaders, "Cache-Control": "no-store", "Retry-After": "30" },
      },
    );
  }

  if (!signature) {
    return new Response(
      '<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>Signature not found</title></head><body><p>This signature is not available.</p></body></html>',
      { status: 404, headers: baseHeaders },
    );
  }

  // `signature.html` is the CMS-rendered template: every interpolated value was
  // escaped server-side, so only the admin-authored template markup is raw.
  const document = [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    '<meta name="robots" content="noindex, nofollow" />',
    `<title>${escapeHtml(signature.name)} — Email signature</title>`,
    FONT_LINKS,
    "</head>",
    "<body>",
    signature.html,
    "</body>",
    "</html>",
  ].join("");

  return new Response(document, { status: 200, headers: baseHeaders });
}
