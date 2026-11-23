import { describe, expect, it } from 'vitest';
import {
  adminUpdatedLabel,
  audienceInputOf,
  audienceTone,
  draftFromAudience,
  draftToInput,
  emptyAudienceDraft,
  documentsViewToQuery,
  groupDocuments,
  groupOf,
  hasDocumentFilters,
  isNewDocument,
  once,
  parseDocumentsView,
  parsePartnerNames,
  sameAudience,
  sortDocuments,
} from './doc-view';

const PARTNERS = [
  { id: 'p1', name: 'Kestrel Systems' },
  { id: 'p2', name: 'Saffron Secure' },
];

describe('freshness and dates', () => {
  it('is new for 14 days and only until the company opens it', () => {
    expect(isNewDocument({ updatedAt: '2026-11-01T10:00:00.000Z', ownOpens: 0 }, '2026-11-15')).toBe(true);
    expect(isNewDocument({ updatedAt: '2026-11-01T10:00:00.000Z', ownOpens: 0 }, '2026-11-16')).toBe(false);
    expect(isNewDocument({ updatedAt: '2026-11-10T10:00:00.000Z', ownOpens: 1 }, '2026-11-11')).toBe(false);
    expect(isNewDocument({ updatedAt: '2026-11-10T10:00:00.000Z', ownOpens: null }, '2026-11-11')).toBe(true);
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

describe('library grouping', () => {
  it('maps every type to a purpose', () => {
    expect(groupOf('battlecard')).toBe('sales');
    expect(groupOf('enablement_guide')).toBe('sales');
    expect(groupOf('datasheet')).toBe('technical');
    expect(groupOf('solution_sheet')).toBe('marketing');
    expect(groupOf('video')).toBe('videos');
  });
  it('buckets in group order, keeps the order inside a group and drops empty groups', () => {
    const docs = [
      { id: 'a', type: 'video' as const },
      { id: 'b', type: 'datasheet' as const },
      { id: 'c', type: 'battlecard' as const },
      { id: 'd', type: 'price_list' as const },
    ];
    const grouped = groupDocuments(docs);
    expect(grouped.map((g) => g.group)).toEqual(['sales', 'technical', 'videos']);
    expect(grouped[0]?.docs.map((d) => d.id)).toEqual(['c', 'd']);
  });
  it('sorts by opens and by name without touching the input', () => {
    const docs = [
      { title: 'b', ownOpens: 1 },
      { title: 'a', ownOpens: 5 },
    ];
    expect(sortDocuments(docs, 'opened').map((d) => d.title)).toEqual(['a', 'b']);
    expect(sortDocuments(docs, 'name').map((d) => d.title)).toEqual(['a', 'b']);
    expect(sortDocuments(docs, 'new').map((d) => d.title)).toEqual(['b', 'a']);
    expect(docs[0]?.title).toBe('b');
  });
});

describe('library URL filters', () => {
  it('uses the defaults for an empty or hand edited URL', () => {
    expect(parseDocumentsView({})).toEqual({ q: '', type: null, product: null, group: null, sort: 'new', layout: 'list' });
    expect(parseDocumentsView({ type: 'nope', product: 'x', group: 'y', sort: 'z', view: 'grid' })).toEqual(parseDocumentsView({}));
  });
  it('reads every filter, takes the first of a repeated one and trims the search text', () => {
    const view = parseDocumentsView({ q: ['  zero trust ', 'x'], type: 'video', product: 'images', group: 'videos', sort: 'name', view: 'cards' });
    expect(view).toEqual({ q: 'zero trust', type: 'video', product: 'images', group: 'videos', sort: 'name', layout: 'cards' });
    expect(parseDocumentsView({ q: 'x'.repeat(500) }).q).toHaveLength(100);
  });
  it('writes only what differs from the defaults and round trips', () => {
    expect(documentsViewToQuery(parseDocumentsView({}))).toBe('');
    const view = parseDocumentsView({ q: 'a b', group: 'sales', view: 'cards' });
    expect(documentsViewToQuery(view)).toBe('?q=a+b&group=sales&view=cards');
    expect(parseDocumentsView(Object.fromEntries(new URLSearchParams(documentsViewToQuery(view))))).toEqual(view);
  });
  it('counts filters but not the sort or the layout', () => {
    expect(hasDocumentFilters(parseDocumentsView({ sort: 'name', view: 'cards' }))).toBe(false);
    expect(hasDocumentFilters(parseDocumentsView({ type: 'video' }))).toBe(true);
  });
});

describe('once', () => {
  it('runs the function on the first call only', () => {
    let calls = 0;
    const record = once(() => {
      calls += 1;
    });
    record();
    record();
    record();
    expect(calls).toBe(1);
  });
});
