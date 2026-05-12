/**
 * H7 — URL parity check
 *
 * Fetches the Webflow sitemap and compares it against the Payload sitemap
 * to identify missing redirects and new content.
 *
 * Usage:
 *   WEBFLOW_SITE_URL=https://cleanstart.webflow.io \
 *   PAYLOAD_URL=http://localhost:3000 \
 *   tsx migrations/webflow-import/url-parity.ts
 *
 * Output: migrations/URL-PARITY-REPORT.md
 */

import fs from 'node:fs';
import path from 'node:path';

const OUT_FILE = path.resolve('migrations/URL-PARITY-REPORT.md');

const WEBFLOW_SITE_URL = (process.env.WEBFLOW_SITE_URL ?? '').replace(/\/$/, '');
const PAYLOAD_URL = (process.env.PAYLOAD_URL ?? 'http://localhost:3000').replace(/\/$/, '');

if (!WEBFLOW_SITE_URL) {
  console.error('Missing WEBFLOW_SITE_URL env var');
  process.exit(1);
}

const fetchSitemapUrls = async (sitemapUrl: string): Promise<string[]> => {
  const res = await fetch(sitemapUrl);
  if (!res.ok) throw new Error(`GET ${sitemapUrl} → ${res.status}`);
  const xml = await res.text();
  const matches = xml.matchAll(/<loc>([^<]+)<\/loc>/g);
  return Array.from(matches).map((m) => m[1]?.trim() ?? '').filter(Boolean);
};

const normalizeUrl = (raw: string, origin: string): string => {
  try {
    const u = new URL(raw);
    return u.pathname.replace(/\/$/, '') || '/';
  } catch {
    return raw.replace(origin, '').replace(/\/$/, '') || '/';
  }
};

const run = async (): Promise<void> => {
  console.log('[url-parity] Fetching sitemaps…');

  const webflowUrls = await fetchSitemapUrls(`${WEBFLOW_SITE_URL}/sitemap.xml`);
  const payloadUrls = await fetchSitemapUrls(`${PAYLOAD_URL}/api/sitemap.xml`);

  const webflowPaths = new Set(webflowUrls.map((u) => normalizeUrl(u, WEBFLOW_SITE_URL)));
  const payloadPaths = new Set(payloadUrls.map((u) => normalizeUrl(u, PAYLOAD_URL)));

  const matched: string[] = [];
  const webflowOnly: string[] = [];
  const payloadOnly: string[] = [];

  for (const p of webflowPaths) {
    if (payloadPaths.has(p)) matched.push(p);
    else webflowOnly.push(p);
  }
  for (const p of payloadPaths) {
    if (!webflowPaths.has(p)) payloadOnly.push(p);
  }

  matched.sort();
  webflowOnly.sort();
  payloadOnly.sort();

  const lines: string[] = [
    '# URL Parity Report',
    '',
    `_Generated ${new Date().toISOString()}_`,
    '',
    `- **Matched**: ${matched.length}`,
    `- **Webflow only** (need redirect or 410): ${webflowOnly.length}`,
    `- **Payload only** (new content): ${payloadOnly.length}`,
    '',
    '## Webflow-only URLs (missing in Payload — need redirect or 410)',
    '',
    ...webflowOnly.map((u) => `- \`${u}\``),
    '',
    '## Payload-only URLs (new content not on Webflow)',
    '',
    ...payloadOnly.map((u) => `- \`${u}\``),
    '',
    '## Matched URLs',
    '',
    ...matched.map((u) => `- \`${u}\``),
    '',
  ];

  fs.writeFileSync(OUT_FILE, lines.join('\n'));
  console.log(`[url-parity] Written to ${OUT_FILE}`);
  console.log(`[url-parity] Matched: ${matched.length}, Webflow-only: ${webflowOnly.length}, Payload-only: ${payloadOnly.length}`);

  if (webflowOnly.length > 0) {
    console.warn(`[url-parity] ⚠ ${webflowOnly.length} Webflow URLs not found in Payload — add redirects`);
  }
};

run().catch((err) => {
  console.error('[url-parity] Fatal:', err);
  process.exit(1);
});
