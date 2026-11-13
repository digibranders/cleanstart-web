import { validateBusinessEmail } from '@cleanstart/forms';
import { FREE_EMAIL_DOMAINS } from '@cleanstart/forms/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Db } from '@/db/client';
import { hubspotSyncState, partners } from '@/db/schema';
import { env } from '@/env';
import type { Clock } from '@/lib/clock';
import { emailDomain, isPlausibleDomain, normaliseDomain } from '@/lib/people';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { IntegrationError } from '@/server/errors';
import { insertWebsiteApplication, type NewApplicationRecord } from '@/server/repo/applications';
import { withSystem } from '@/server/repo/context';

/** The CMS REST shape of a partner-applications document (apps/cms/src/payload/collections/PartnerApplications.ts). */
export const cmsPartnerApplicationSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  createdAt: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().nullish(),
  company: z.string(),
  website: z.string().nullish(),
  partnerReason: z.string().nullish(),
  honeypot: z.string().nullish(),
  turnstilePassed: z.boolean().nullish(),
  piiRedactedAt: z.string().nullish(),
});
export type CmsPartnerApplication = z.infer<typeof cmsPartnerApplicationSchema>;

export interface CmsPage {
  docs: CmsPartnerApplication[];
  hasNextPage: boolean;
}

export interface CmsClient {
  /** createdAt at or after `since` (null for the first run), ascending, one page at a time. Throws IntegrationError('cms'). */
  listPartnerApplications(input: { since: string | null; page: number; limit: number }): Promise<CmsPage>;
}

const CURSOR_KEY = 'website_applications_cursor';
const PAGE_LIMIT = 100;
const MAX_PAGES = 50;
const CMS_TIMEOUT_MS = 15_000;

const pageSchema = z.object({ docs: z.array(cmsPartnerApplicationSchema), hasNextPage: z.boolean() });
const cursorSchema = z.object({ createdAt: z.string() });

export interface HttpCmsClientOptions {
  baseUrl: string;
  apiKey: string;
}

export function createHttpCmsClient(options: HttpCmsClientOptions): CmsClient {
  const base = options.baseUrl.replace(/\/$/u, '');
  return {
    async listPartnerApplications({ since, page, limit }) {
      const params = new URLSearchParams({ sort: 'createdAt', limit: String(limit), page: String(page), depth: '0' });
      if (since) params.set('where[createdAt][greater_than_equal]', since);
      let response: Response;
      try {
        response = await fetch(`${base}/api/partner-applications?${params.toString()}`, {
          headers: { Authorization: `users API-Key ${options.apiKey}`, Accept: 'application/json' },
          signal: AbortSignal.timeout(CMS_TIMEOUT_MS),
        });
      } catch (error) {
        throw new IntegrationError('cms', 'partner-applications request failed', { cause: error });
      }
      if (!response.ok) {
        throw new IntegrationError('cms', `partner-applications answered ${response.status}`, { status: response.status });
      }
      let parsed: z.SafeParseReturnType<unknown, CmsPage>;
      try {
        parsed = pageSchema.safeParse(await response.json());
      } catch (error) {
        throw new IntegrationError('cms', 'partner-applications answered with invalid JSON', { cause: error });
      }
      // A row that does not match the schema stops the run on purpose: skipping it silently would lose an applicant.
      if (!parsed.success) throw new IntegrationError('cms', 'partner-applications answered with an unexpected shape');
      return parsed.data;
    },
  };
}

/** Null when CMS_INTAKE_API_KEY is unset (local development): the job then does nothing. */
export function createCmsClient(
  config: { apiKey: string | undefined; baseUrl: string } = { apiKey: env.CMS_INTAKE_API_KEY, baseUrl: env.CMS_API_URL },
): CmsClient | null {
  return config.apiKey ? createHttpCmsClient({ baseUrl: config.baseUrl, apiKey: config.apiKey }) : null;
}

export interface IntakeResult {
  fetched: number;
  imported: number;
  skipped: { honeypot: number; redacted: number; turnstile: number; duplicate: number };
  cursor: string | null;
}

/**
 * Maps one CMS row to a NewApplicationRecord (source 'website', sourceRef = CMS id): applicant name from first and last
 * name, domain from the website field falling back to the email domain, personalEmail from the full free-mail list,
 * existingDomain from `partnerDomains`, category and region null.
 */
export function mapCmsApplication(row: CmsPartnerApplication, partnerDomains: ReadonlySet<string>): NewApplicationRecord {
  const checked = validateBusinessEmail(row.email, { freeDomains: FREE_EMAIL_DOMAINS, requireBusiness: true });
  const email = checked.ok ? checked.email : row.email.trim().toLowerCase();
  const fromEmail = emailDomain(email);
  const site = normaliseDomain(row.website ?? '');
  const domain = isPlausibleDomain(site) ? site : fromEmail;
  return {
    company: row.company.trim(),
    domain,
    applicantName: `${row.firstName} ${row.lastName}`.trim(),
    email,
    role: null,
    phone: row.phone?.trim() || null,
    category: null,
    region: null,
    reason: row.partnerReason?.trim() || null,
    source: 'website',
    sourceRef: row.id,
    personalEmail: !checked.ok && checked.reason === 'free-mail',
    existingDomain: partnerDomains.has(domain) || (fromEmail !== '' && partnerDomains.has(fromEmail)),
    submittedAt: new Date(row.createdAt),
  };
}

/**
 * Reads pages from the cursor in hubspot_sync_state key 'website_applications_cursor' ({ createdAt: string }),
 * skips honeypot, turnstilePassed === false and piiRedactedAt rows, inserts through insertWebsiteApplication
 * (idempotent), and advances the cursor only after the whole run succeeds. Uses the system db.
 */
export async function importWebsiteApplications(deps: { db: Db; cms: CmsClient; clock: Clock }): Promise<IntakeResult> {
  const { db, cms, clock } = deps;
  const [stored] = await db.select().from(hubspotSyncState).where(eq(hubspotSyncState.key, CURSOR_KEY)).limit(1);
  const parsedCursor = stored ? cursorSchema.safeParse(stored.value) : null;
  const since = parsedCursor?.success ? parsedCursor.data.createdAt : null;
  const partnerDomains = new Set((await db.select({ domain: partners.domain }).from(partners)).map((p) => p.domain));

  const result: IntakeResult = {
    fetched: 0,
    imported: 0,
    skipped: { honeypot: 0, redacted: 0, turnstile: 0, duplicate: 0 },
    cursor: since,
  };
  let newest = since;

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const batch = await cms.listPartnerApplications({ since, page, limit: PAGE_LIMIT });
    for (const row of batch.docs) {
      result.fetched += 1;
      if (newest === null || Date.parse(row.createdAt) > Date.parse(newest)) newest = row.createdAt;
      if (row.piiRedactedAt) {
        result.skipped.redacted += 1;
        continue;
      }
      if (row.honeypot) {
        result.skipped.honeypot += 1;
        continue;
      }
      if (row.turnstilePassed === false) {
        result.skipped.turnstile += 1;
        continue;
      }
      const record = mapCmsApplication(row, partnerDomains);
      const { inserted } = await withSystem(SYSTEM_ACTORS.intake, (tx) =>
        insertWebsiteApplication(tx, SYSTEM_ACTORS.intake, record, clock),
      );
      if (inserted) result.imported += 1;
      else result.skipped.duplicate += 1;
    }
    if (!batch.hasNextPage) break;
  }

  if (newest !== null && newest !== since) {
    await db
      .insert(hubspotSyncState)
      .values({ key: CURSOR_KEY, value: { createdAt: newest } })
      .onConflictDoUpdate({ target: hubspotSyncState.key, set: { value: { createdAt: newest } } });
    result.cursor = newest;
  }
  return result;
}
