#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Read-only GSC audit for a fixed list of URLs (ad-hoc reporting, not a
 * standing job). For each URL: indexing status via URL Inspection API, plus
 * clicks/impressions/ctr/position for the trailing 91-day window vs the 91
 * days before that (matches the delta convention in
 * lib/integrations/dashboards/advanced-metrics.ts computeDelta).
 *
 * Input:  scripts/data/gsc-audit-urls.json — string[] of full URLs
 * Output: /tmp/gsc-audit-output.json
 *
 * Run inside the prod cms container:
 *   docker exec -w /app/apps/cms cleanstart-cms-1 pnpm exec tsx scripts/gsc-url-audit.ts
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';
import { resolveGscCredentials } from '../src/payload/lib/integrations/credentials.ts';

const fmtDate = (d: Date): string => d.toISOString().slice(0, 10);
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

const run = async (): Promise<void> => {
  const fs = await import('node:fs');
  const urls: string[] = JSON.parse(
    fs.readFileSync('scripts/data/gsc-audit-urls.json', 'utf8'),
  );

  const payload = await getPayload({ config: payloadConfig });
  const rows = await payload.find({
    collection: 'integrations',
    where: { kind: { equals: 'gscSearchAnalyticsApi' } },
    limit: 1,
    overrideAccess: true,
  });
  const row = rows.docs[0];
  if (!row) throw new Error('No gscSearchAnalyticsApi integration row found');
  const creds = resolveGscCredentials(row as unknown as { gscConfig?: { siteUrl?: string } });
  if (!creds) throw new Error('Could not resolve GSC credentials (missing env or siteUrl)');

  const { google } = await import('googleapis');
  const auth = new google.auth.JWT({
    email: creds.serviceAccountJson.client_email as string,
    key: creds.serviceAccountJson.private_key as string,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  const client = google.searchconsole({ version: 'v1', auth });

  const now = new Date();
  const endDate = fmtDate(now);
  const startDate = fmtDate(new Date(now.getTime() - 91 * 86_400_000));
  const prevEndDate = fmtDate(new Date(now.getTime() - 92 * 86_400_000));
  const prevStartDate = fmtDate(new Date(now.getTime() - 182 * 86_400_000));

  payload.logger.info(`Site: ${creds.siteUrl}`);
  payload.logger.info(`Current window: ${startDate} .. ${endDate}`);
  payload.logger.info(`Previous window: ${prevStartDate} .. ${prevEndDate}`);

  const queryPages = async (sd: string, ed: string) => {
    const res = await client.searchanalytics.query({
      siteUrl: creds.siteUrl,
      requestBody: { startDate: sd, endDate: ed, dimensions: ['page'], rowLimit: 25000 },
    });
    const map = new Map<string, { clicks: number; impressions: number; ctr: number; position: number }>();
    for (const r of res.data.rows ?? []) {
      const page = r.keys?.[0];
      if (!page) continue;
      map.set(page, {
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        ctr: r.ctr ?? 0,
        position: r.position ?? 0,
      });
    }
    return map;
  };

  const currentMap = await queryPages(startDate, endDate);
  const previousMap = await queryPages(prevStartDate, prevEndDate);
  payload.logger.info(`Current window pages: ${currentMap.size}, previous: ${previousMap.size}`);

  const results: Array<Record<string, unknown>> = [];
  for (const [i, url] of urls.entries()) {
    let inspection: Awaited<ReturnType<typeof client.urlInspection.index.inspect>>['data'] | null = null;
    let inspectError: string | undefined;
    try {
      const res = await client.urlInspection.index.inspect({
        requestBody: { siteUrl: creds.siteUrl, inspectionUrl: url },
      });
      inspection = res.data;
    } catch (err) {
      inspectError = err instanceof Error ? err.message : String(err);
    }

    const ir = inspection?.inspectionResult?.indexStatusResult;
    results.push({
      url,
      indexVerdict: ir?.verdict ?? null,
      coverageState: ir?.coverageState ?? null,
      robotsTxtState: ir?.robotsTxtState ?? null,
      lastCrawlTime: ir?.lastCrawlTime ?? null,
      googleCanonical: ir?.googleCanonical ?? null,
      userCanonical: ir?.userCanonical ?? null,
      inspectError,
      current: currentMap.get(url) ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 },
      previous: previousMap.get(url) ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 },
    });

    if ((i + 1) % 25 === 0) payload.logger.info(`Inspected ${i + 1}/${urls.length}`);
    // Stay well under GSC's per-minute burst limit.
    await sleep(300);
  }

  fs.writeFileSync(
    '/tmp/gsc-audit-output.json',
    JSON.stringify({ siteUrl: creds.siteUrl, startDate, endDate, prevStartDate, prevEndDate, results }, null, 2),
  );
  payload.logger.info(`Wrote /tmp/gsc-audit-output.json (${results.length} URLs).`);
  process.exit(0);
};

run().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
