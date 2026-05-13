import { google } from 'googleapis';

import { resolveGscCredentials } from '../credentials';
import type { IntegrationRow } from './types';

/**
 * GSC URL Inspection API (Phase J2 row #18).
 *
 * Shares the GSC config + service-account JSON with the search-analytics
 * row, but lives behind its own integration kind so an editor can grant
 * `gscUrlInspectionApi` to a more restrictive scope if needed.
 *
 * Quota: 2,000 QPD per site — strictly on-demand from the editor's
 * "Inspect URL in GSC" click. No background cron, no cache.
 */

const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];

export interface UrlInspectionResult {
  readonly indexStatus?: string | undefined;
  readonly coverageState?: string | undefined;
  readonly robotsTxtState?: string | undefined;
  readonly lastCrawlTime?: string | undefined;
  readonly mobileUsability?: string | undefined;
  readonly richResultsState?: string | undefined;
  readonly canonicalUrl?: string | undefined;
  readonly userCanonical?: string | undefined;
  readonly googleCanonical?: string | undefined;
}

export const inspectUrl = async (
  row: IntegrationRow,
  inspectionUrl: string,
): Promise<UrlInspectionResult | null> => {
  const creds = resolveGscCredentials(row as unknown as { gscConfig?: { siteUrl?: string } });
  if (!creds) return null;
  const auth = new google.auth.JWT({
    email: creds.serviceAccountJson.client_email as string,
    key: creds.serviceAccountJson.private_key as string,
    scopes: SCOPES,
  });
  const client = google.searchconsole({ version: 'v1', auth });
  const res = await client.urlInspection.index.inspect({
    requestBody: {
      siteUrl: creds.siteUrl,
      inspectionUrl,
    },
  });
  const r = res.data.inspectionResult;
  if (!r) return null;
  return {
    indexStatus: r.indexStatusResult?.verdict ?? undefined,
    coverageState: r.indexStatusResult?.coverageState ?? undefined,
    robotsTxtState: r.indexStatusResult?.robotsTxtState ?? undefined,
    lastCrawlTime: r.indexStatusResult?.lastCrawlTime ?? undefined,
    mobileUsability: r.mobileUsabilityResult?.verdict ?? undefined,
    richResultsState: r.richResultsResult?.verdict ?? undefined,
    userCanonical: r.indexStatusResult?.userCanonical ?? undefined,
    googleCanonical: r.indexStatusResult?.googleCanonical ?? undefined,
  };
};
