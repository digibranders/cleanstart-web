import { describe, expect, it } from 'vitest';
import {
  adminUpdatedLabel,
  audienceInputOf,
  audienceTone,
  draftFromAudience,
  draftToInput,
  emptyAudienceDraft,
  isFresh,
  parsePartnerNames,
  sameAudience,
} from './doc-view';

const PARTNERS = [
  { id: 'p1', name: 'Kestrel Systems' },
  { id: 'p2', name: 'Saffron Secure' },
];

describe('freshness and dates', () => {
  it('is fresh for seven days and not after', () => {
    expect(isFresh('2026-11-01T10:00:00.000Z', '2026-11-08')).toBe(true);
    expect(isFresh('2026-11-01T10:00:00.000Z', '2026-11-09')).toBe(false);
  });
  it('labels today as Today and other days as a short date', () => {
    expect(adminUpdatedLabel('2026-11-06T09:30:00.000Z', '2026-11-06')).toBe('Today');
    expect(adminUpdatedLabel('2026-11-04T09:30:00.000Z', '2026-11-06')).toBe('4 Nov');
  });
  it('keeps the mock badge tones', () => {
    expect(audienceTone('all')).toBe('neutral');
    expect(audienceTone('named')).toBe('pending');
    expect(audienceTone('categories')).toBe('violet');
  });
});

describe('parsePartnerNames', () => {
  it('splits on commas, trims and drops empties', () => {
    expect(parsePartnerNames(' Kestrel Systems ,, Saffron Secure ,')).toEqual(['Kestrel Systems', 'Saffron Secure']);
    expect(parsePartnerNames('')).toEqual([]);
  });
});

describe('draftToInput', () => {
  it('turns each kind into an audience input', () => {
    expect(draftToInput(emptyAudienceDraft, PARTNERS)).toEqual({ ok: false, error: 'Pick at least one category.' });
    expect(draftToInput({ kind: 'all', categories: [], partnersText: '' }, PARTNERS)).toEqual({ ok: true, audience: { kind: 'all' } });
    expect(draftToInput({ kind: 'categories', categories: ['channel'], partnersText: '' }, PARTNERS)).toEqual({
      ok: true,
      audience: { kind: 'categories', categories: ['channel'] },
    });
  });
  it('matches partner names case insensitively and collapses duplicates', () => {
    expect(draftToInput({ kind: 'named', categories: [], partnersText: 'kestrel systems, SAFFRON SECURE, Kestrel Systems' }, PARTNERS)).toEqual({
      ok: true,
      audience: { kind: 'named', partnerIds: ['p1', 'p2'] },
    });
  });
  it('explains an empty or unknown partner list', () => {
    expect(draftToInput({ kind: 'named', categories: [], partnersText: ' , ' }, PARTNERS)).toEqual({ ok: false, error: 'Name at least one partner.' });
    expect(draftToInput({ kind: 'named', categories: [], partnersText: 'Kestrel Systems, Nobody Ltd' }, PARTNERS)).toEqual({
      ok: false,
      error: 'No partner named Nobody Ltd.',
    });
  });
});

describe('draftFromAudience, audienceInputOf and sameAudience', () => {
  it('round trips a named audience through names and back to ids', () => {
    const audience = { kind: 'named' as const, categories: [], partners: [{ id: 'p2', name: 'Saffron Secure' }, { id: 'p1', name: 'Kestrel Systems' }] };
    expect(draftFromAudience(audience)).toEqual({ kind: 'named', categories: [], partnersText: 'Saffron Secure, Kestrel Systems' });
    expect(audienceInputOf(audience)).toEqual({ kind: 'named', partnerIds: ['p2', 'p1'] });
  });
  it('compares categories and partner ids without regard to order', () => {
    expect(sameAudience({ kind: 'categories', categories: ['channel', 'distributor'] }, { kind: 'categories', categories: ['distributor', 'channel'] })).toBe(true);
    expect(sameAudience({ kind: 'named', partnerIds: ['a', 'b'] }, { kind: 'named', partnerIds: ['b', 'a'] })).toBe(true);
    expect(sameAudience({ kind: 'all' }, { kind: 'all' })).toBe(true);
    expect(sameAudience({ kind: 'all' }, { kind: 'categories', categories: ['channel'] })).toBe(false);
    expect(sameAudience({ kind: 'named', partnerIds: ['a'] }, { kind: 'named', partnerIds: ['a', 'b'] })).toBe(false);
  });
});
