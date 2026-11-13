// types.ts
// Shared definitions live elsewhere (contracts M.2 item 1); re-exported so `instanceof` and imports work from either path.
export { DependencyPending } from '@/server/errors';
export type { RegistrationStatus } from '@/lib/domain';

export const STAGE_LABELS = [
  'Accepted', 'Discovery', 'Technical evaluation', 'Proposal sent',
  'Closed won', 'Closed lost', 'Registration expired',
] as const;
export type StageLabel = (typeof STAGE_LABELS)[number];
export type StageIds = Record<StageLabel, string>;

export interface HsDeal {
  id: string;
  stageId: string;
  properties: Record<string, string | null>;
  /** hs_lastmodifieddate as epoch milliseconds. */
  modifiedAt: number;
}
export interface HsCompany { id: string; name: string | null; domain: string | null }
export interface DealSearchPage { deals: HsDeal[]; next: string | null }
export type AssociationRole = 'partner' | 'customer';

export interface HubspotApi {
  getStageIds(pipelineId: string): Promise<StageIds>;
  findCompany(input: { domain: string | null; name: string }): Promise<HsCompany | null>;
  searchCompanies(query: string): Promise<HsCompany[]>;
  createOrUpdateCompany(input: { existingId: string | null; name: string; domain: string | null; properties: Record<string, string> }): Promise<{ id: string }>;
  upsertContact(input: { email: string; firstName: string; lastName: string; phone?: string }): Promise<{ id: string }>;
  associateContactWithCompany(contactId: string, companyId: string): Promise<void>;
  findDealByRegistrationId(registrationId: string): Promise<HsDeal | null>;
  createDeal(properties: Record<string, string>): Promise<HsDeal>;
  updateDeal(dealId: string, properties: Record<string, string>): Promise<void>;
  associateDealWithCompany(dealId: string, companyId: string, role: AssociationRole): Promise<void>;
  associateDealWithContact(dealId: string, contactId: string): Promise<void>;
  searchDealsModifiedSince(pipelineId: string, sinceMs: number, after: string | null): Promise<DealSearchPage>;
  readDeals(ids: string[]): Promise<HsDeal[]>;
  listOpenDealsForCompany(companyId: string, pipelineId: string): Promise<HsDeal[]>;
}

export class HubspotError extends Error {
  constructor(readonly status: number, readonly body: string, message: string) {
    super(message);
    this.name = 'HubspotError';
  }
}