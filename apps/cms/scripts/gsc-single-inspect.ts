#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Read-only single-URL GSC inspection, for the one-off case of a URL added
 * to an audit list after the main batch (gsc-url-audit.ts) already ran.
 * Run inside the prod cms container:
 *   docker exec -w /app/apps/cms cleanstart-cms-1 pnpm exec tsx scripts/gsc-single-inspect.ts <url>
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';
import { resolveGscCredentials } from '../src/payload/lib/integrations/credentials.ts';

const run = async (): Promise<void> => {
  const url = process.argv[2];
  if (!url) throw new Error('Usage: gsc-single-inspect.ts <url>');

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
  if (!creds) throw new Error('Could not resolve GSC credentials');

  const { google } = await import('googleapis');
  const auth = new google.auth.JWT({
    email: creds.serviceAccountJson.client_email as string,
    key: creds.serviceAccountJson.private_key as string,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  const client = google.searchconsole({ version: 'v1', auth });

  const res = await client.urlInspection.index.inspect({
    requestBody: { siteUrl: creds.siteUrl, inspectionUrl: url },
  });
  const ir = res.data.inspectionResult?.indexStatusResult;

  const fmtDate = (d: Date): string => d.toISOString().slice(0, 10);
  const now = new Date();
  const endDate = fmtDate(now);
  const startDate = fmtDate(new Date(now.getTime() - 91 * 86_400_000));
  const prevEndDate = fmtDate(new Date(now.getTime() - 92 * 86_400_000));
  const prevStartDate = fmtDate(new Date(now.getTime() - 182 * 86_400_000));

  const queryOne = async (sd: string, ed: string) => {
    const r = await client.searchanalytics.query({
      siteUrl: creds.siteUrl,
      requestBody: {
        startDate: sd,
        endDate: ed,
        dimensions: ['page'],
        dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'equals', expression: url }] }],
        rowLimit: 1,
      },
    });
    const row0 = r.data.rows?.[0];
    return {
      clicks: row0?.clicks ?? 0,
      impressions: row0?.impressions ?? 0,
      ctr: row0?.ctr ?? 0,
      position: row0?.position ?? 0,
    };
  };

  const current = await queryOne(startDate, endDate);
  const previous = await queryOne(prevStartDate, prevEndDate);

  const result = {
    url,
    indexVerdict: ir?.verdict ?? null,
    coverageState: ir?.coverageState ?? null,
    robotsTxtState: ir?.robotsTxtState ?? null,
    lastCrawlTime: ir?.lastCrawlTime ?? null,
    googleCanonical: ir?.googleCanonical ?? null,
    userCanonical: ir?.userCanonical ?? null,
    current,
    previous,
  };

  const fs = await import('node:fs');
  fs.writeFileSync('/tmp/gsc-single-output.json', JSON.stringify(result, null, 2));
  payload.logger.info(JSON.stringify(result));
  process.exit(0);
};

run().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
