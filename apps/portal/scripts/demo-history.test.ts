import { describe, expect, it } from 'vitest';
import { daysBetween } from '../src/lib/dates';
import { REGISTRATION_STATUSES } from '../src/lib/domain';
import { DEMO_HISTORY_COUNT, generateDemoHistory, seededRandom } from './demo-history';

const today = '2026-11-23';
const partners = [
  { id: 'p1', region: 'india' as const, managerId: 'm1', people: [{ id: 'u1', name: 'Asha' }, { id: 'u2', name: 'Ben' }] },
  { id: 'p2', region: 'middle_east' as const, managerId: null, people: [{ id: 'u3', name: 'Cara' }] },
  { id: 'p3', region: 'elsewhere' as const, managerId: 'm2', people: [{ id: 'u4', name: 'Dev' }] },
];
const deciders = [{ id: 'm1', name: 'Mira' }, { id: 'm2', name: 'Omar' }];
const make = (extra: { count?: number; seed?: number } = {}) => generateDemoHistory({ today, partners, deciders, ...extra });

describe('seededRandom', () => {
  it('repeats for a seed and stays in [0, 1)', () => {
    const a = seededRandom(7);
    const b = seededRandom(7);
    const draws = Array.from({ length: 50 }, () => a());
    expect(draws).toEqual(Array.from({ length: 50 }, () => b()));
    expect(draws.every((n) => n >= 0 && n < 1)).toBe(true);
  });
});

describe('generateDemoHistory', () => {
  it('is deterministic and makes 60 deals by default', () => {
    expect(make()).toHaveLength(DEMO_HISTORY_COUNT);
    expect(make()).toEqual(make());
    expect(make({ seed: 1 })).not.toEqual(make({ seed: 2 }));
    expect(make({ count: 5 })).toHaveLength(5);
  });

  it('returns nothing when there is nobody to register or decide', () => {
    expect(generateDemoHistory({ today, partners: [], deciders })).toEqual([]);
    expect(generateDemoHistory({ today, partners, deciders: [] })).toEqual([]);
    expect(generateDemoHistory({ today, partners: [{ ...partners[0]!, people: [] }], deciders })).toEqual([]);
  });

  it('spreads deals over the last 12 months, oldest first, none in the future', () => {
    const deals = make();
    const dates = deals.map((d) => d.registeredOn);
    expect(dates).toEqual([...dates].sort());
    expect(dates.every((d) => d <= today && daysBetween(d, today) < 365)).toBe(true);
    expect(new Set(dates.map((d) => d.slice(0, 7))).size).toBeGreaterThanOrEqual(8);
  });

  it('keeps every deal internally consistent', () => {
    for (const d of make()) {
      expect(REGISTRATION_STATUSES).toContain(d.status);
      expect(d.currency).toBe('USD');
      expect(d.dealValue).toBeGreaterThan(0);
      expect(d.region === 'india' || d.region === 'middle_east').toBe(true);
      if (d.status === 'pending') {
        expect([d.decidedOn, d.decidedBy, d.protectionEnd, d.closedOn, d.rejectionReason]).toEqual([null, null, null, null, null]);
      } else {
        expect(d.decidedOn && d.decidedOn >= d.registeredOn && d.decidedOn <= today).toBe(true);
        expect(d.decidedBy).not.toBeNull();
      }
      expect(d.rejectionReason !== null).toBe(d.status === 'rejected');
      expect(d.protectionEnd !== null).toBe(d.status !== 'rejected' && d.status !== 'pending');
      if (d.status === 'won' || d.status === 'lost') expect(d.closedOn && d.closedOn >= (d.decidedOn ?? '') && d.closedOn <= today).toBe(true);
      if (d.status === 'accepted') expect(d.protectionEnd && d.protectionEnd >= today).toBe(true);
      if (d.status === 'expired') expect(d.protectionEnd && d.protectionEnd < today).toBe(true);
    }
  });

  it('varies status, product, region, country, industry and rejection reason so charts have something to show', () => {
    const deals = make();
    expect(new Set(deals.map((d) => d.status)).size).toBeGreaterThanOrEqual(5);
    expect(new Set(deals.map((d) => d.product)).size).toBe(3);
    expect(new Set(deals.map((d) => d.region)).size).toBe(2);
    expect(new Set(deals.map((d) => d.customerCountry)).size).toBeGreaterThanOrEqual(3);
    expect(new Set(deals.map((d) => d.customerIndustry)).size).toBeGreaterThanOrEqual(5);
    expect(new Set(deals.flatMap((d) => (d.rejectionReason ? [d.rejectionReason] : []))).size).toBeGreaterThanOrEqual(2);
  });

  it('never repeats a customer for the same partner and product (the open-deal unique index)', () => {
    const keys = make({ count: 400 }).map((d) => `${d.partnerId}|${d.customerName.toLowerCase()}|${d.product}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('registers each deal by a person of its own partner', () => {
    for (const d of make()) {
      const partner = partners.find((p) => p.id === d.partnerId);
      expect(partner?.people.some((p) => p.id === d.registeredBy && p.name === d.registeredByName)).toBe(true);
    }
  });

  it('leaves only recent deals pending, and decides the rest', () => {
    const deals = make();
    expect(deals.filter((d) => d.status === 'pending').every((d) => daysBetween(d.registeredOn, today) <= 12)).toBe(true);
    expect(deals.filter((d) => d.status !== 'pending').length).toBeGreaterThan(40);
  });
});
