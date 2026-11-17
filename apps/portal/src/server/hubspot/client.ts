// client.ts
import { Client } from '@hubspot/api-client';
import { env } from '@/env';
import { isDemoMode } from '@/server/demo';
import { IntegrationError } from '@/server/errors';
import { DEMO_PIPELINE_ID, demoHubspot } from './demo';
import {
  type AssociationRole, type DealSearchPage, type HsCompany, type HsDeal, type HubspotApi,
  HubspotError, STAGE_LABELS, type StageIds,
} from './types';

/** The part of a fetch Response the client reads. The SDK's apiRequest returns a node-fetch Response, which satisfies it. */
interface HttpResponse {
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
  json(): Promise<unknown>;
}
type ApiRequest = (opts: { method: string; path: string; body?: unknown }) => Promise<HttpResponse>;

const MAX_TRIES = 3;
const MAX_RETRY_WAIT_MS = 10_000;
const DEFAULT_RETRY_WAIT_MS = 1_000;
const DEFAULT_TIMEOUT_MS = 15_000;
const BATCH_READ_LIMIT = 100;
const CLOSED_STAGES = ['Closed won', 'Closed lost', 'Registration expired'] as const;

export interface RealHubspotOptions {
  /** Injected in tests so a 429 wait does not take real time. */
  sleep?: (ms: number) => Promise<void>;
  timeoutMs?: number;
}

const realSleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const retryWaitMs = (header: string | null): number => {
  const seconds = Number(header);
  return Math.min(header !== null && Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : DEFAULT_RETRY_WAIT_MS, MAX_RETRY_WAIT_MS);
};

const DEAL_PROPS = ['dealname', 'dealstage', 'pipeline', 'closedate', 'hs_lastmodifieddate',
  'portal_registration_id', 'protection_end_date', 'partner_company_id'];

interface RawDeal { id: string; properties: Record<string, string | null> }

const toDeal = (raw: RawDeal): HsDeal => ({
  id: raw.id,
  stageId: raw.properties.dealstage ?? '',
  properties: raw.properties,
  modifiedAt: Date.parse(raw.properties.hs_lastmodifieddate ?? '') || 0,
});

export class RealHubspot implements HubspotApi {
  private readonly stageCache = new Map<string, { at: number; ids: StageIds }>();
  private labelIds: { partner: number; customer: number } | null | undefined;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly timeoutMs: number;

  constructor(private readonly apiRequest: ApiRequest, options: RealHubspotOptions = {}) {
    this.sleep = options.sleep ?? realSleep;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  // The SDK's apiRequest does not throw on a non-2xx response, so its own retry never fires; the bounded 429 retry lives here.
  private async send(method: string, path: string, body?: unknown): Promise<HttpResponse> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new HubspotError(0, 'timeout', `HubSpot ${method} ${path} timed out after ${this.timeoutMs} ms`)), this.timeoutMs);
    });
    try {
      return await Promise.race([this.apiRequest({ method, path, ...(body !== undefined ? { body } : {}) }), timeout]);
    } finally {
      clearTimeout(timer);
    }
  }

  private async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    let res = await this.send(method, path, body);
    for (let tries = 1; res.status === 429 && tries < MAX_TRIES; tries += 1) {
      await this.sleep(retryWaitMs(res.headers.get('retry-after')));
      res = await this.send(method, path, body);
    }
    if (!res.ok) {
      const text = await res.text();
      throw new HubspotError(res.status, text, `HubSpot ${method} ${path} failed with ${res.status}`);
    }
    return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
  }

  async getStageIds(pipelineId: string): Promise<StageIds> {
    const cached = this.stageCache.get(pipelineId);
    if (cached && Date.now() - cached.at < 600_000) return cached.ids;
    const pipe = await this.call<{ stages: Array<{ id: string; label: string }> }>('GET', `/crm/v3/pipelines/deals/${pipelineId}`);
    const ids = {} as StageIds;
    for (const label of STAGE_LABELS) {
      const s = pipe.stages.find((x) => x.label === label);
      if (!s) throw new HubspotError(500, '', `Pipeline ${pipelineId} has no stage "${label}". Run provision-hubspot.ts.`);
      ids[label] = s.id;
    }
    this.stageCache.set(pipelineId, { at: Date.now(), ids });
    return ids;
  }

  private async searchCompany(propertyName: string, value: string): Promise<HsCompany | null> {
    const r = await this.call<{ results: Array<{ id: string; properties: { name?: string; domain?: string } }> }>(
      'POST', '/crm/v3/objects/companies/search',
      { filterGroups: [{ filters: [{ propertyName, operator: 'EQ', value }] }], properties: ['name', 'domain'], limit: 1 },
    );
    const hit = r.results[0];
    return hit ? { id: hit.id, name: hit.properties.name ?? null, domain: hit.properties.domain ?? null } : null;
  }

  async findCompany({ domain, name }: { domain: string | null; name: string }): Promise<HsCompany | null> {
    return (domain ? await this.searchCompany('domain', domain) : null) ?? (await this.searchCompany('name', name));
  }

  async searchCompanies(query: string): Promise<HsCompany[]> {
    const r = await this.call<{ results: Array<{ id: string; properties: { name?: string; domain?: string } }> }>(
      'POST', '/crm/v3/objects/companies/search', { query, properties: ['name', 'domain'], limit: 5 },
    );
    return r.results.map((c) => ({ id: c.id, name: c.properties.name ?? null, domain: c.properties.domain ?? null }));
  }

  async createOrUpdateCompany(i: { existingId: string | null; name: string; domain: string | null; properties: Record<string, string> }): Promise<{ id: string }> {
    const properties = { name: i.name, ...(i.domain ? { domain: i.domain } : {}), ...i.properties };
    if (i.existingId) {
      await this.call('PATCH', `/crm/v3/objects/companies/${i.existingId}`, { properties });
      return { id: i.existingId };
    }
    return this.call<{ id: string }>('POST', '/crm/v3/objects/companies', { properties });
  }

  async upsertContact(i: { email: string; firstName: string; lastName: string; phone?: string }): Promise<{ id: string }> {
    const r = await this.call<{ results: Array<{ id: string }> }>('POST', '/crm/v3/objects/contacts/batch/upsert', {
      inputs: [{ idProperty: 'email', id: i.email, properties: {
        email: i.email, firstname: i.firstName, lastname: i.lastName, ...(i.phone ? { phone: i.phone } : {}),
      } }],
    });
    const first = r.results[0];
    if (!first) throw new HubspotError(500, '', 'Contact upsert returned no result');
    return { id: first.id };
  }

  async associateContactWithCompany(contactId: string, companyId: string): Promise<void> {
    await this.call('PUT', `/crm/v4/objects/contacts/${contactId}/associations/default/companies/${companyId}`);
  }

  async findDealByRegistrationId(registrationId: string): Promise<HsDeal | null> {
    const r = await this.call<{ results: RawDeal[] }>('POST', '/crm/v3/objects/deals/search', {
      filterGroups: [{ filters: [{ propertyName: 'portal_registration_id', operator: 'EQ', value: registrationId }] }],
      properties: DEAL_PROPS, limit: 1,
    });
    const hit = r.results[0];
    return hit ? toDeal(hit) : null;
  }

  async createDeal(properties: Record<string, string>): Promise<HsDeal> {
    return toDeal(await this.call<RawDeal>('POST', '/crm/v3/objects/deals', { properties }));
  }

  async updateDeal(dealId: string, properties: Record<string, string>): Promise<void> {
    await this.call('PATCH', `/crm/v3/objects/deals/${dealId}`, { properties });
  }

  private async companyLabels(): Promise<{ partner: number; customer: number } | null> {
    if (this.labelIds !== undefined) return this.labelIds;
    if (!env.HUBSPOT_USE_ASSOCIATION_LABELS) {
      this.labelIds = null;
      return null;
    }
    const r = await this.call<{ results: Array<{ typeId: number; label: string | null; category: string }> }>(
      'GET', '/crm/v4/associations/deals/companies/labels',
    );
    const find = (l: string): number | undefined => r.results.find((x) => x.label === l && x.category === 'USER_DEFINED')?.typeId;
    const partner = find('Partner');
    const customer = find('Customer');
    this.labelIds = partner && customer ? { partner, customer } : null;
    return this.labelIds;
  }

  async associateDealWithCompany(dealId: string, companyId: string, role: AssociationRole): Promise<void> {
    const labels = await this.companyLabels();
    if (!labels) {
      await this.call('PUT', `/crm/v4/objects/deals/${dealId}/associations/default/companies/${companyId}`);
      return;
    }
    await this.call('PUT', `/crm/v4/objects/deals/${dealId}/associations/companies/${companyId}`, [
      { associationCategory: 'USER_DEFINED', associationTypeId: labels[role] },
    ]);
  }

  async associateDealWithContact(dealId: string, contactId: string): Promise<void> {
    await this.call('PUT', `/crm/v4/objects/deals/${dealId}/associations/default/contacts/${contactId}`);
  }

  async searchDealsModifiedSince(pipelineId: string, sinceMs: number, after: string | null): Promise<DealSearchPage> {
    const r = await this.call<{ results: RawDeal[]; paging?: { next?: { after: string } } }>('POST', '/crm/v3/objects/deals/search', {
      filterGroups: [{ filters: [
        { propertyName: 'pipeline', operator: 'EQ', value: pipelineId },
        { propertyName: 'hs_lastmodifieddate', operator: 'GTE', value: String(sinceMs) },
      ] }],
      sorts: [{ propertyName: 'hs_lastmodifieddate', direction: 'ASCENDING' }],
      properties: DEAL_PROPS, limit: 100, ...(after ? { after } : {}),
    });
    return { deals: r.results.map(toDeal), next: r.paging?.next?.after ?? null };
  }

  async readDeals(ids: string[]): Promise<HsDeal[]> {
    const deals: HsDeal[] = [];
    for (let i = 0; i < ids.length; i += BATCH_READ_LIMIT) {
      const r = await this.call<{ results: RawDeal[] }>('POST', '/crm/v3/objects/deals/batch/read', {
        properties: DEAL_PROPS, inputs: ids.slice(i, i + BATCH_READ_LIMIT).map((id) => ({ id })),
      });
      deals.push(...r.results.map(toDeal));
    }
    return deals;
  }

  async listOpenDealsForCompany(companyId: string, pipelineId: string): Promise<HsDeal[]> {
    const assoc = await this.call<{ results: Array<{ toObjectId: number }> }>('GET', `/crm/v4/objects/companies/${companyId}/associations/deals`);
    const [deals, stageIds] = await Promise.all([this.readDeals(assoc.results.map((a) => String(a.toObjectId))), this.getStageIds(pipelineId)]);
    const closed = new Set<string>(CLOSED_STAGES.map((label) => stageIds[label]));
    return deals.filter((d) => d.properties.pipeline === pipelineId && !closed.has(d.stageId));
  }
}

export interface HubspotConfig { token: string; pipelineId: string }

/** null when the portal token or the partner pipeline id is unset (development, tests, a fresh environment). Jobs use it to skip with a warning. */
export const readHubspotConfig = (): HubspotConfig | null => {
  if (isDemoMode()) return { token: 'demo', pipelineId: DEMO_PIPELINE_ID };
  const token = env.HUBSPOT_PORTAL_TOKEN;
  const pipelineId = env.HUBSPOT_PARTNER_PIPELINE_ID;
  return token && pipelineId ? { token, pipelineId } : null;
};

export const createHubspot = (): HubspotApi => {
  if (isDemoMode()) return demoHubspot();
  const token = env.HUBSPOT_PORTAL_TOKEN;
  if (!token) throw new IntegrationError('hubspot', 'HUBSPOT_PORTAL_TOKEN is not set');
  const client = new Client({ accessToken: token, numberOfApiCallRetries: 3 });
  return new RealHubspot((opts) => client.apiRequest({ method: opts.method, path: opts.path, ...(opts.body !== undefined ? { body: opts.body } : {}) }));
};