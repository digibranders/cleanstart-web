import { describe, expect, it } from 'vitest';
import {
  adminUpdatedLabel,
  attentionReason,
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
  pickSpotlight,
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
    expect(parseDocumentsView({})).toEqual({ q: '', type: null, product: null, group: null, sort: 'new', layout: 'cards' });
    expect(parseDocumentsView({ type: 'nope', product: 'x', group: 'y', sort: 'z', view: 'grid' })).toEqual(parseDocumentsView({}));
  });
  it('reads every filter, takes the first of a repeated one and trims the search text', () => {
    const view = parseDocumentsView({ q: ['  zero trust ', 'x'], type: 'video', product: 'images', group: 'videos', sort: 'name', view: 'cards' });
    expect(view).toEqual({ q: 'zero trust', type: 'video', product: 'images', group: 'videos', sort: 'name', layout: 'cards' });
    expect(parseDocumentsView({ q: 'x'.repeat(500) }).q).toHaveLength(100);
  });
  it('writes only what differs from the defaults and round trips', () => {
    expect(documentsViewToQuery(parseDocumentsView({}))).toBe('');
    const view = parseDocumentsView({ q: 'a b', group: 'sales', view: 'list' });
    expect(documentsViewToQuery(view)).toBe('?q=a+b&group=sales&view=list');
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

describe('staff attention and the spotlight', () => {
  const doc = (over: Partial<{ updatedAt: string; opens: number | null; ownOpens: number | null; status: 'draft' | 'published'; expired: boolean }>) => ({
    updatedAt: '2026-11-01T00:00:00.000Z',
    opens: 5,
    ownOpens: 0,
    status: 'published' as const,
    expired: false,
    ...over,
  });

  it('flags expired before draft before unopened, and nothing for a live used document', () => {
    expect(attentionReason(doc({ expired: true, status: 'draft' }))).toBe('expired');
    expect(attentionReason(doc({ status: 'draft' }))).toBe('draft');
    expect(attentionReason(doc({ opens: 0 }))).toBe('unopened');
    expect(attentionReason(doc({ opens: null }))).toBe('unopened');
    expect(attentionReason(doc({}))).toBeNull();
  });

  it('leads staff with the most opened live document and ignores drafts and expired ones', () => {
    const live = doc({ opens: 40 });
    const picked = pickSpotlight([doc({ opens: 90, status: 'draft' }), doc({ opens: 70, expired: true }), live, doc({ opens: 3 })], true, '2026-11-10');
    expect(picked?.doc).toBe(live);
    expect(picked?.kicker).toBe('Most opened');
  });

  it('falls back to the newest live upload for staff when nothing was opened, and to null when nothing is live', () => {
    const latest = doc({ opens: 0, updatedAt: '2026-11-05T00:00:00.000Z' });
    expect(pickSpotlight([doc({ opens: 0 }), latest], true, '2026-11-10')?.kicker).toBe('Latest upload');
    expect(pickSpotlight([doc({ status: 'draft' })], true, '2026-11-10')).toBeNull();
  });

  it('leads a partner with the newest document they have not opened, else the newest', () => {
    const fresh = doc({ updatedAt: '2026-11-08T00:00:00.000Z', opens: null });
    const opened = doc({ updatedAt: '2026-11-09T00:00:00.000Z', ownOpens: 2, opens: null });
    expect(pickSpotlight([opened, fresh], false, '2026-11-10')).toEqual({ doc: fresh, kicker: 'New for you' });
    const old = doc({ updatedAt: '2026-09-01T00:00:00.000Z', opens: null });
    expect(pickSpotlight([old, opened], false, '2026-11-20')).toEqual({ doc: opened, kicker: 'Latest update' });
    expect(pickSpotlight([], false, '2026-11-10')).toBeNull();
  });
});
