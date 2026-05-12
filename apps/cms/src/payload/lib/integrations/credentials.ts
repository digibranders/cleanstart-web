import { decrypt, isEncrypted } from './secrets';

/**
 * "Authenticated client" resolver. Credentials live in env vars (set
 * once per environment via Coolify / 1Password); the per-row admin UI
 * is just the non-secret destination details. This module merges env
 * + row into one "effective config" object per kind so handlers don't
 * have to know about the auth path.
 *
 * The design intent: a lay-person editor opens "/admin/collections/
 * integrations/create", picks a kind, fills in one or two friendly
 * fields (Teams URL, GA4 property ID, etc.), and the handler picks
 * up the global token / service account from the environment.
 *
 * Per-row credential overrides are still supported for Teams URLs
 * (per-channel by design) and generic webhook URLs/secrets (per-
 * subscriber). For HubSpot / GA4 / GSC / Clarity / Cloudflare /
 * Brevo / Cal.com the token is exclusively env-based.
 */

const readEnv = (name: string): string | null => {
  const v = process.env[name];
  return typeof v === 'string' && v.length > 0 ? v : null;
};

const readJsonEnv = (name: string): Record<string, unknown> | null => {
  const raw = readEnv(name);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const maybeDecrypt = (v: unknown): string | null => {
  if (typeof v !== 'string' || v.length === 0) return null;
  if (isEncrypted(v)) {
    try {
      return decrypt(v);
    } catch {
      return null;
    }
  }
  return v;
};

// ─── Teams Workflow ──────────────────────────────────────────────

export interface TeamsCredentials {
  readonly webhookUrl: string;
  readonly mentions?: ReadonlyArray<{
    displayName: string;
    aadObjectId: string;
    upn: string;
    triggerOn?: ReadonlyArray<'document.published' | 'lead.submitted'>;
  }>;
}

interface TeamsRowConfig {
  webhookUrl?: string;
  mentions?: TeamsCredentials['mentions'];
}

export const resolveTeamsCredentials = (
  row: { teamsConfig?: TeamsRowConfig | null } | null,
): TeamsCredentials | null => {
  const url = maybeDecrypt(row?.teamsConfig?.webhookUrl) ?? readEnv('WEBHOOK_TEAMS_URL');
  if (!url) return null;
  return {
    webhookUrl: url,
    ...(row?.teamsConfig?.mentions ? { mentions: row.teamsConfig.mentions } : {}),
  };
};

// ─── Generic webhook ─────────────────────────────────────────────

export interface GenericCredentials {
  readonly url: string;
  readonly signingSecret: string;
  readonly signingKeyId: string;
}

interface GenericRowConfig {
  url?: string;
  signingSecret?: string;
  signingKeyId?: string;
}

export const resolveGenericCredentials = (
  row: { id?: string | number; genericConfig?: GenericRowConfig | null } | null,
): GenericCredentials | null => {
  const url = maybeDecrypt(row?.genericConfig?.url) ?? readEnv('WEBHOOK_GENERIC_URL');
  const secret =
    maybeDecrypt(row?.genericConfig?.signingSecret) ??
    readEnv('WEBHOOK_GENERIC_SIGNING_SECRET');
  if (!url || !secret) return null;
  return {
    url,
    signingSecret: secret,
    signingKeyId: row?.genericConfig?.signingKeyId ?? `db-${row?.id ?? 'unknown'}`,
  };
};

// ─── HubSpot CRM ─────────────────────────────────────────────────

export interface HubspotCredentials {
  readonly accessToken: string;
  readonly writeMode: 'contactOnly' | 'contactAndLead';
  readonly fieldMapping: Record<string, string>;
  readonly defaultProperties: Record<string, string>;
}

interface HubspotRowConfig {
  writeMode?: 'contactOnly' | 'contactAndLead' | null;
  fieldMapping?: Array<{ submissionField?: string | null; hubspotProperty?: string | null }> | null;
  defaultLifecycleStage?: string | null;
  defaultLeadStatus?: string | null;
}

export const resolveHubspotCredentials = (
  row: { hubspotConfig?: HubspotRowConfig | null } | null,
): HubspotCredentials | null => {
  const token = readEnv('HUBSPOT_PRIVATE_APP_TOKEN');
  if (!token) return null;
  const fieldMapping: Record<string, string> = {};
  for (const entry of row?.hubspotConfig?.fieldMapping ?? []) {
    if (entry.submissionField && entry.hubspotProperty) {
      fieldMapping[entry.submissionField] = entry.hubspotProperty;
    }
  }
  return {
    accessToken: token,
    writeMode: row?.hubspotConfig?.writeMode ?? 'contactOnly',
    fieldMapping,
    defaultProperties: {
      lifecyclestage: row?.hubspotConfig?.defaultLifecycleStage ?? 'lead',
      hs_lead_status: row?.hubspotConfig?.defaultLeadStatus ?? 'NEW',
    },
  };
};

// ─── GA4 Data API ────────────────────────────────────────────────

export interface Ga4Credentials {
  readonly propertyId: string;
  readonly serviceAccountJson: Record<string, unknown>;
}

interface Ga4RowConfig {
  propertyId?: string | null;
}

export const resolveGa4Credentials = (
  row: { ga4Config?: Ga4RowConfig | null } | null,
): Ga4Credentials | null => {
  const propertyId = row?.ga4Config?.propertyId;
  if (!propertyId) return null;
  const sa = readJsonEnv('GOOGLE_APPLICATION_CREDENTIALS_JSON');
  if (!sa) return null;
  return { propertyId, serviceAccountJson: sa };
};

// ─── GSC (shared between search-analytics + url-inspection) ──────

export interface GscCredentials {
  readonly siteUrl: string;
  readonly serviceAccountJson: Record<string, unknown>;
}

interface GscRowConfig {
  siteUrl?: string | null;
}

export const resolveGscCredentials = (
  row: { gscConfig?: GscRowConfig | null } | null,
): GscCredentials | null => {
  const siteUrl = row?.gscConfig?.siteUrl;
  if (!siteUrl) return null;
  const sa = readJsonEnv('GOOGLE_APPLICATION_CREDENTIALS_JSON');
  if (!sa) return null;
  return { siteUrl, serviceAccountJson: sa };
};

// ─── MS Clarity ──────────────────────────────────────────────────

export interface ClarityCredentials {
  readonly apiToken: string;
}

export const resolveClarityCredentials = (): ClarityCredentials | null => {
  const token = readEnv('CLARITY_API_TOKEN');
  return token ? { apiToken: token } : null;
};

// ─── Cloudflare Web Analytics ────────────────────────────────────

export interface CloudflareCredentials {
  readonly accountTag: string;
  readonly apiToken: string;
}

interface CfWaRowConfig {
  accountTag?: string | null;
}

export const resolveCloudflareCredentials = (
  row: { cloudflareConfig?: CfWaRowConfig | null } | null,
): CloudflareCredentials | null => {
  const accountTag = row?.cloudflareConfig?.accountTag ?? readEnv('CLOUDFLARE_ACCOUNT_TAG');
  const token = readEnv('CLOUDFLARE_API_TOKEN');
  if (!accountTag || !token) return null;
  return { accountTag, apiToken: token };
};

// ─── Cal.com inbound ─────────────────────────────────────────────

export interface CalcomCredentials {
  readonly signingSecret: string;
  readonly fallbackFormId: number | null;
}

interface CalcomRowConfig {
  fallbackFormId?: number | null;
}

export const resolveCalcomCredentials = (
  row: { calcomConfig?: CalcomRowConfig | null } | null,
): CalcomCredentials | null => {
  const secret = readEnv('CALCOM_SIGNING_SECRET');
  if (!secret) return null;
  return {
    signingSecret: secret,
    fallbackFormId: row?.calcomConfig?.fallbackFormId ?? null,
  };
};

// ─── Brevo bounce callback ───────────────────────────────────────

export interface BrevoCredentials {
  readonly bearerToken: string;
}

export const resolveBrevoCredentials = (): BrevoCredentials | null => {
  const token = readEnv('BREVO_INBOUND_TOKEN');
  return token ? { bearerToken: token } : null;
};
