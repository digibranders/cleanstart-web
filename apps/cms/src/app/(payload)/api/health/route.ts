/**
 * Container healthcheck endpoint.
 *
 * Hit by:
 *   - The compose `healthcheck:` block on the `cms` service (gates the
 *     GitHub Actions deploy workflow's `docker compose up -d --wait cms`).
 *   - The BetterStack HTTP probe on `https://cms.cleanstart.com/api/health`
 *     (locked decision row 23 — uptime monitoring).
 *
 * Returns 200 with a tiny body once the Next.js server is serving requests.
 * No DB or upstream probe — those are bedrock dependencies of the app being
 * able to render at all, so a 200 from any handler already implies they are
 * working at boot. A deep healthcheck that walked DB + Meilisearch on every
 * tick would be noise on a single-process box.
 *
 * Placed under `(payload)/api/` so the catch-all `[...slug]` route (which
 * Payload owns) doesn't shadow it. Next.js routes specific paths first.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(): Response {
  return new Response('ok', {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
