import { describe, expect, it } from 'vitest';
import type { DocumentListItemDto, PartnerOverviewDto } from '@/lib/dto';
import { buildOverviewKpis, docIcon, docMeta } from './overview';

const overview = (over: Partial<PartnerOverviewDto>): PartnerOverviewDto => ({
  ownDealsOnly: false,
  waiting: { count: 0, oldestDays: 0 },
  protectedNow: { count: 0, byProduct: [] },
  expiring14: { count: 0, customers: [] },
  wonThisYear: { count: 0, customers: [] },
  attention: [],
  recent: [],
  newDocuments: [],
  ...over,
});

describe('buildOverviewKpis', () => {
  it('reads the four figures from the aggregates', () => {
    const kpis = buildOverviewKpis(overview({
      waiting: { count: 2, oldestDays: 3 },
      protectedNow: { count: 3, byProduct: [{ product: 'cleansight', count: 2 }, { product: 'libraries', count: 1 }] },
      expiring14: { count: 1, customers: ['Tejas Health Network'] },
      wonThisYear: { count: 2, customers: ['Indus Paytech', 'Kaveri Biotech'] },
    }));
    expect(kpis).toEqual([
      { label: 'Pending', value: '2', foot: 'Oldest 3 days', cls: '' },
      { label: 'Protected', value: '3', foot: '2 CleanSight, 1 Libraries', cls: '' },
      { label: 'Expiring in 14 days', value: '1', foot: 'Tejas Health Network', cls: 't-amber' },
      { label: 'Won this year', value: '2', foot: 'Indus Paytech, Kaveri Biotech', cls: '' },
    ]);
  });

  it('says so when there is nothing', () => {
    expect(buildOverviewKpis(overview({})).map((k) => [k.value, k.foot, k.cls])).toEqual([
      ['0', 'Nothing pending', ''], ['0', 'None yet', ''], ['0', 'None', ''], ['0', 'None yet', ''],
    ]);
    expect(buildOverviewKpis(overview({ waiting: { count: 1, oldestDays: 1 } }))[0]?.foot).toBe('Oldest 1 day');
  });
});

describe('new document rows', () => {
  const doc = (over: Partial<DocumentListItemDto>): DocumentListItemDto => ({
    id: 'd', title: 'T', type: 'datasheet', product: 'all', summary: null, durationMinutes: null, fileSize: 1, mime: 'application/pdf',
    originalName: 't.pdf', version: 1, updatedAt: '2026-10-30T09:00:00.000Z', ...over,
  });
  it('writes the type, the length of a video and the date', () => {
    expect(docMeta(doc({ type: 'video', durationMinutes: 14, updatedAt: '2026-11-04T09:00:00.000Z' }))).toBe('Video, 14 min, 4 Nov');
    expect(docMeta(doc({ type: 'solution_sheet' }))).toBe('Solution sheet, 30 Oct');
    expect(docMeta(doc({ type: 'video', durationMinutes: null }))).toBe('Video, 30 Oct');
  });
  it('shows a play icon for a video and a file icon for everything else', () => {
    expect(docIcon(doc({ type: 'video' }))).toBe('play');
    expect(docIcon(doc({ type: 'battlecard' }))).toBe('file');
  });
});
