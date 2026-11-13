// client.ts
import { Client } from '@hubspot/api-client';
import { env } from '@/env';
import { IntegrationError } from '@/server/errors';
import {
  type AssociationRole, type DealSearchPage, type HsCompany, type HsDeal, type HubspotApi,
  HubspotError, STAGE_LABELS, type StageIds,
} from './types';

/** The part of a fetch Response the client reads. The SDK's apiRequest returns a node-fetch Response, which satisfies it. */
interface HttpResponse {
  ok: boolean;
  status: number;
  text(): Promise<string>;
  json(): Promise<unknown>;
}
type ApiRequest = (opts: { method: string; path: string; body?: unknown }) => Promise<HttpResponse>;

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
  private stageCache: { at: number; ids: StageIds } | null = null;
  private labelIds: { partner: number; customer: number } | null | undefined;

  constructor(private readonly apiRequest: ApiRequest) {}

  private async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await this.apiRequest({ method, path, ...(body !== undefined ? { body } : {}) });
    if (!res.ok) {
      const text = await res.text();
      throw new HubspotError(res.status, text, `HubSpot ${method} ${path} failed with ${res.status}`);
    }
    return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
  }

  async getStageIds(pipelineId: string): Promise<StageIds> {
    if (this.stageCache && Date.now() - this.stageCache.at < 600_000) return this.stageCache.ids;
    const pipe = await this.call<{ stages: Array<{ id: string; label: string }> }>('GET', `/crm/v3/pipelines/deals/${pipelineId}`);
    const ids = {} as StageIds;
    for (const label of STAGE_LABELS) {
      const s = pipe.stages.find((x) => x.label === label);
      if (!s) throw new HubspotError(500, '', `Pipeline ${pipelineId} has no stage "${label}". Run provision-hubspot.ts.`);
      ids[label] = s.id;
    }
    this.stageCache = { at: Date.now(), ids };
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
    if (ids.length === 0) return [];
    const r = await this.call<{ results: RawDeal[] }>('POST', '/crm/v3/objects/deals/batch/read', {
      properties: DEAL_PROPS, inputs: ids.map((id) => ({ id })),
    });
    return r.results.map(toDeal);
  }

  async listOpenDealsForCompany(companyId: string, pipelineId: string): Promise<HsDeal[]> {
    const assoc = await this.call<{ results: Array<{ toObjectId: number }> }>('GET', `/crm/v4/objects/companies/${companyId}/associations/deals`);
    const deals = await this.readDeals(assoc.results.map((a) => String(a.toObjectId)));
    return deals.filter((d) => d.properties.pipeline === pipelineId);
  }
}

export interface HubspotConfig { token: string; pipelineId: string }

/** null when the portal token or the partner pipeline id is unset (development, tests, a fresh environment). Jobs use it to skip with a warning. */
export const readHubspotConfig = (): HubspotConfig | null => {
  const token = env.HUBSPOT_PORTAL_TOKEN;
  const pipelineId = env.HUBSPOT_PARTNER_PIPELINE_ID;
  return token && pipelineId ? { token, pipelineId } : null;
};

export const createHubspot = (): HubspotApi => {
  const token = env.HUBSPOT_PORTAL_TOKEN;
  if (!token) throw new IntegrationError('hubspot', 'HUBSPOT_PORTAL_TOKEN is not set');
  const client = new Client({ accessToken: token, numberOfApiCallRetries: 3 });
  return new RealHubspot((opts) => client.apiRequest({ method: opts.method, path: opts.path, ...(opts.body !== undefined ? { body: opts.body } : {}) }));
};