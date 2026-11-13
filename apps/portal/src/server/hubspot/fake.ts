// fake.ts
import type {
  AssociationRole, DealSearchPage, HsCompany, HsDeal, HubspotApi, StageIds,
} from './types';
import { STAGE_LABELS } from './types';

export class FakeHubspot implements HubspotApi {
  companies = new Map<string, HsCompany & { properties: Record<string, string> }>();
  contacts = new Map<string, { id: string; email: string }>();
  deals = new Map<string, HsDeal>();
  associations: Array<{ from: string; to: string; kind: string }> = [];
  failNext: Error | null = null;
  calls: string[] = [];
  private seq = 100;
  /** Advance to make modifiedAt values deterministic in tests. */
  clock = 1_000;
  readonly stageIds: StageIds = Object.fromEntries(STAGE_LABELS.map((l, i) => [l, `stage-${i}`])) as StageIds;

  private next(): string { this.seq += 1; return String(this.seq); }
  private maybeFail(call: string): void {
    this.calls.push(call);
    if (this.failNext) { const e = this.failNext; this.failNext = null; throw e; }
  }

  async getStageIds(): Promise<StageIds> { return this.stageIds; }

  async findCompany({ domain, name }: { domain: string | null; name: string }): Promise<HsCompany | null> {
    this.maybeFail('findCompany');
    const all = [...this.companies.values()];
    return (domain ? all.find((c) => c.domain === domain) : undefined) ?? all.find((c) => c.name?.toLowerCase() === name.toLowerCase()) ?? null;
  }
  async searchCompanies(query: string): Promise<HsCompany[]> {
    return [...this.companies.values()].filter((c) => `${c.name} ${c.domain}`.toLowerCase().includes(query.toLowerCase()));
  }
  async createOrUpdateCompany(i: { existingId: string | null; name: string; domain: string | null; properties: Record<string, string> }): Promise<{ id: string }> {
    this.maybeFail('createOrUpdateCompany');
    const id = i.existingId ?? this.next();
    this.companies.set(id, { id, name: i.name, domain: i.domain, properties: i.properties });
    return { id };
  }
  async upsertContact(i: { email: string }): Promise<{ id: string }> {
    this.maybeFail('upsertContact');
    const found = [...this.contacts.values()].find((c) => c.email === i.email);
    if (found) return { id: found.id };
    const id = this.next();
    this.contacts.set(id, { id, email: i.email });
    return { id };
  }
  async associateContactWithCompany(c: string, co: string): Promise<void> { this.associations.push({ from: c, to: co, kind: 'contact-company' }); }
  async findDealByRegistrationId(rid: string): Promise<HsDeal | null> {
    return [...this.deals.values()].find((d) => d.properties.portal_registration_id === rid) ?? null;
  }
  async createDeal(properties: Record<string, string>): Promise<HsDeal> {
    this.maybeFail('createDeal');
    const id = this.next();
    this.clock += 1;
    const deal: HsDeal = { id, stageId: properties.dealstage ?? '', properties: { ...properties }, modifiedAt: this.clock };
    this.deals.set(id, deal);
    return deal;
  }
  async updateDeal(id: string, properties: Record<string, string>): Promise<void> {
    this.maybeFail('updateDeal');
    const d = this.deals.get(id);
    if (!d) throw new Error(`no deal ${id}`);
    this.clock += 1;
    this.deals.set(id, { ...d, properties: { ...d.properties, ...properties }, stageId: properties.dealstage ?? d.stageId, modifiedAt: this.clock });
  }
  async associateDealWithCompany(d: string, c: string, role: AssociationRole): Promise<void> { this.associations.push({ from: d, to: c, kind: `deal-company:${role}` }); }
  async associateDealWithContact(d: string, c: string): Promise<void> { this.associations.push({ from: d, to: c, kind: 'deal-contact' }); }
  async searchDealsModifiedSince(_p: string, sinceMs: number, after: string | null): Promise<DealSearchPage> {
    this.maybeFail('searchDealsModifiedSince');
    const rows = [...this.deals.values()].filter((d) => d.modifiedAt >= sinceMs).sort((a, b) => a.modifiedAt - b.modifiedAt);
    const start = after ? Number(after) : 0;
    const page = rows.slice(start, start + 2);
    return { deals: page, next: start + 2 < rows.length ? String(start + 2) : null };
  }
  async readDeals(ids: string[]): Promise<HsDeal[]> { return ids.flatMap((id) => this.deals.get(id) ?? []); }
  async listOpenDealsForCompany(companyId: string): Promise<HsDeal[]> {
    const dealIds = this.associations.filter((a) => a.kind.startsWith('deal-company') && a.to === companyId).map((a) => a.from);
    return dealIds.flatMap((id) => this.deals.get(id) ?? []);
  }
}