import { addDays } from '../src/lib/dates';
import { protectionEndFor } from '../src/lib/deal-rules';
import type { DealRegion, PartnerRegion, Product, RegistrationStatus } from '../src/lib/domain';
import { PRODUCTS, STAGE_AWAITING_REVIEW, STAGE_NOT_ACCEPTED } from '../src/lib/domain';

/** Pure generator for the demo only: dated registrations over the last 12 months so the dashboards have something to draw. */

export interface DemoPartner {
  id: string;
  region: PartnerRegion;
  managerId: string | null;
  people: ReadonlyArray<{ id: string; name: string }>;
}

export interface DemoDecider {
  id: string;
  name: string;
}

export interface DemoDeal {
  partnerId: string;
  registeredBy: string;
  registeredByName: string;
  managerId: string | null;
  customerName: string;
  customerDomain: string;
  product: Product;
  region: DealRegion;
  dealValue: number;
  currency: 'USD';
  customerCountry: string;
  customerIndustry: string;
  seats: number;
  salesStage: string | null;
  decisionDate: string | null;
  status: RegistrationStatus;
  stage: string;
  registeredOn: string;
  /** The date the deal was decided; null while pending. */
  decidedOn: string | null;
  decidedBy: string | null;
  decidedByLabel: string | null;
  rejectionReason: string | null;
  protectionEnd: string | null;
  closedOn: string | null;
}

export interface DemoHistoryInput {
  /** YYYY-MM-DD. */
  today: string;
  partners: readonly DemoPartner[];
  deciders: readonly DemoDecider[];
  count?: number;
  seed?: number;
}

export const DEMO_HISTORY_COUNT = 60;
const DAYS_BACK = 365;

/** mulberry32: a tiny seeded generator, so the same input always gives the same deals. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PREFIXES = ['Northwind', 'Helio', 'Orbit', 'Cobalt', 'Meridian', 'Zenith', 'Aurora', 'Vertex', 'Lumen', 'Quanta', 'Falcon', 'Nimbus', 'Atlas', 'Sable', 'Pinnacle', 'Cedar', 'Onyx', 'Harbor', 'Summit', 'Ember', 'Tidal', 'Granite', 'Solace', 'Marlin'];
const SUFFIXES = ['Bank', 'Logistics', 'Health', 'Telecom', 'Retail', 'Energy', 'Insurance', 'Payments', 'Systems', 'Networks', 'Foods', 'Motors'];
const INDUSTRIES = ['Banking', 'Financial services', 'Healthcare', 'Logistics', 'Telecom', 'Retail', 'Energy', 'Insurance', 'Payments', 'Manufacturing'];
/** Customer countries per launch region. A partner in any other region (a region added later, or the legacy 'elsewhere') registers deals in one of these. */
const COUNTRIES: Record<string, readonly string[]> = {
  india: ['IN', 'IN', 'IN', 'SG'],
  middle_east: ['AE', 'SA', 'QA', 'KW', 'OM'],
  eu: ['DE', 'FR', 'NL', 'SE', 'GB'],
  us: ['US', 'US', 'US', 'CA'],
};
const DEMO_REGIONS = Object.keys(COUNTRIES);
const SALES_STAGES = ['Qualification', 'Discovery', 'Evaluation', 'Proposal', 'Negotiation'];
const REJECTION_REASONS = [
  'This customer is already registered for this product.',
  'The customer is outside the partner territory.',
  'We could not confirm the opportunity. Add a named contact and resubmit.',
  'The customer is an existing CleanStart account.',
];
const VALUE_RANGE: Record<Product, readonly [number, number]> = { images: [20_000, 120_000], libraries: [15_000, 90_000], cleansight: [40_000, 200_000] };
/** Business days from sent to decision, weighted so most land inside the 2 day target. */
const DECISION_DAYS: ReadonlyArray<readonly [number, number]> = [[0, 3], [1, 4], [2, 4], [3, 2], [5, 1], [8, 1]];

const isWeekend = (iso: string): boolean => [0, 6].includes(new Date(`${iso}T00:00:00Z`).getUTCDay());

const addBusinessDays = (iso: string, days: number): string => {
  let day = iso;
  for (let left = days; left > 0; ) {
    day = addDays(day, 1);
    if (!isWeekend(day)) left -= 1;
  }
  return day;
};

/** Always the same 60 (by default) deals for the same input, oldest first. */
export function generateDemoHistory(input: DemoHistoryInput): DemoDeal[] {
  const { today, partners, deciders } = input;
  const count = input.count ?? DEMO_HISTORY_COUNT;
  const eligible = partners.filter((p) => p.people.length > 0);
  if (eligible.length === 0 || deciders.length === 0) return [];
  const random = seededRandom(input.seed ?? 20_261_123);
  const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)] as T;
  const weighted = (pairs: ReadonlyArray<readonly [number, number]>): number => {
    let roll = random() * pairs.reduce((n, [, w]) => n + w, 0);
    for (const [value, weight] of pairs) {
      roll -= weight;
      if (roll < 0) return value;
    }
    return pairs[0]?.[0] ?? 0;
  };
  const between = (low: number, high: number): number => low + Math.floor(random() * (high - low + 1));

  const used = new Set<string>();
  const deals: DemoDeal[] = [];
  for (let i = 0; i < count; i += 1) {
    const partner = pick(eligible);
    const person = pick(partner.people);
    const decider = pick(deciders);
    const product = pick(PRODUCTS);
    const region: DealRegion = partner.region in COUNTRIES ? partner.region : pick(DEMO_REGIONS);
    let customerName = `${pick(PREFIXES)} ${pick(SUFFIXES)}`;
    for (let n = 2; used.has(`${partner.id}|${customerName.toLowerCase()}|${product}`); n += 1) customerName = `${customerName.replace(/ \d+$/, '')} ${n}`;
    used.add(`${partner.id}|${customerName.toLowerCase()}|${product}`);

    // squaring the draw leans the registrations toward recent months, like a growing programme
    const registeredOn = addDays(today, -Math.floor(random() ** 1.4 * DAYS_BACK));
    const sentDecision = addBusinessDays(registeredOn, weighted(DECISION_DAYS));
    const [low, high] = VALUE_RANGE[product];
    const base = {
      partnerId: partner.id,
      registeredBy: person.id,
      registeredByName: person.name,
      managerId: partner.managerId ?? decider.id,
      customerName,
      customerDomain: `${customerName.toLowerCase().replace(/[^a-z0-9]+/g, '')}.example.com`,
      product,
      region,
      dealValue: Math.round((low + random() * (high - low)) / 500) * 500,
      currency: 'USD' as const,
      customerCountry: pick(COUNTRIES[region] ?? COUNTRIES.india ?? []),
      customerIndustry: pick(INDUSTRIES),
      seats: between(30, 400),
      registeredOn,
    };

    if (sentDecision > today) {
      deals.push({ ...base, salesStage: pick(SALES_STAGES), decisionDate: addDays(today, between(20, 140)), status: 'pending', stage: STAGE_AWAITING_REVIEW, decidedOn: null, decidedBy: null, decidedByLabel: null, rejectionReason: null, protectionEnd: null, closedOn: null });
      continue;
    }
    const decided = { decidedOn: sentDecision, decidedBy: decider.id, decidedByLabel: decider.name };
    if (random() < 0.15) {
      deals.push({ ...base, ...decided, salesStage: null, decisionDate: null, status: 'rejected', stage: STAGE_NOT_ACCEPTED, rejectionReason: pick(REJECTION_REASONS), protectionEnd: null, closedOn: null });
      continue;
    }
    const protectionEnd = protectionEndFor(sentDecision);
    const live = protectionEnd >= today;
    const outcome = random();
    const closeBy = live ? today : protectionEnd;
    const closeOn = addDays(sentDecision, between(7, Math.max(7, Math.min(70, Math.floor((Date.parse(closeBy) - Date.parse(sentDecision)) / 86_400_000)))));
    const closedOn = closeOn > closeBy ? closeBy : closeOn;
    const accepted = { ...base, ...decided, rejectionReason: null, protectionEnd };
    if (live && outcome >= 0.2) {
      deals.push({ ...accepted, salesStage: pick(SALES_STAGES), decisionDate: addDays(today, between(10, 120)), status: 'accepted', stage: 'Accepted', closedOn: null });
    } else if (outcome < (live ? 0.2 : 0.45)) {
      deals.push({ ...accepted, salesStage: 'Closed', decisionDate: null, status: 'won', stage: 'Closed won', closedOn });
    } else if (outcome < (live ? 0.2 : 0.7)) {
      deals.push({ ...accepted, salesStage: 'Closed', decisionDate: null, status: 'lost', stage: 'Closed lost', closedOn });
    } else {
      deals.push({ ...accepted, salesStage: null, decisionDate: null, status: 'expired', stage: 'No activity', closedOn: null });
    }
  }
  return deals.sort((a, b) => a.registeredOn.localeCompare(b.registeredOn) || a.customerName.localeCompare(b.customerName));
}
