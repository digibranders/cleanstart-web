import { describe, expect, it } from 'vitest';
import { type DashboardCardDef, type PackItem, packSpans, reconcileLayout, savedLayoutSchema, toSaved } from './dashboard-layout';

const def = (id: string, extra: Partial<DashboardCardDef> = {}): DashboardCardDef => ({ id, title: id, description: id, span: 4, min: 4, max: 12, ...extra });
const item = (span: number, min = 4, max = 12): PackItem => ({ span, min, max });

describe('reconcileLayout', () => {
  const defs = [def('a'), def('b'), def('c', { defaultHidden: true })];

  it('uses the page order and hides hidden-by-default cards when nothing is saved', () => {
    expect(reconcileLayout(defs, null)).toEqual([
      { id: 'a', hidden: false, span: null },
      { id: 'b', hidden: false, span: null },
      { id: 'c', hidden: true, span: null },
    ]);
  });

  it('keeps the saved order, hidden flags and widths', () => {
    const saved = { cards: [{ id: 'b', span: 8 }, { id: 'a', hidden: true }, { id: 'c' }] };
    expect(reconcileLayout(defs, saved)).toEqual([
      { id: 'b', hidden: false, span: 8 },
      { id: 'a', hidden: true, span: null },
      { id: 'c', hidden: false, span: null },
    ]);
  });

  it('drops cards that no longer exist and ignores repeats', () => {
    const out = reconcileLayout(defs, { cards: [{ id: 'gone' }, { id: 'a' }, { id: 'a', hidden: true }] });
    expect(out.map((e) => e.id)).toEqual(['a', 'b', 'c']);
    expect(out[0]?.hidden).toBe(false);
  });

  it('appends a card added since the layout was saved, hidden when it is hidden by default', () => {
    const out = reconcileLayout([...defs, def('d'), def('e', { defaultHidden: true })], { cards: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] });
    expect(out.slice(3)).toEqual([
      { id: 'd', hidden: false, span: null },
      { id: 'e', hidden: true, span: null },
    ]);
  });

  it('keeps a saved width inside the card limits', () => {
    const out = reconcileLayout([def('a', { min: 6, max: 8 })], { cards: [{ id: 'a', span: 12 }] });
    expect(out[0]?.span).toBe(8);
  });

  it('round-trips through toSaved and the schema', () => {
    const entries = reconcileLayout(defs, { cards: [{ id: 'b', span: 6 }, { id: 'a', hidden: true }] });
    expect(savedLayoutSchema.parse(toSaved(entries))).toEqual(toSaved(entries));
  });
});

describe('savedLayoutSchema', () => {
  it('rejects odd ids, out of range widths and oversized lists', () => {
    expect(savedLayoutSchema.safeParse({ cards: [{ id: 'Bad Id' }] }).success).toBe(false);
    expect(savedLayoutSchema.safeParse({ cards: [{ id: 'a', span: 13 }] }).success).toBe(false);
    expect(savedLayoutSchema.safeParse({ cards: Array.from({ length: 41 }, (_, i) => ({ id: `c${i}` })) }).success).toBe(false);
  });
});

describe('packSpans', () => {
  it('leaves a full row alone', () => {
    expect(packSpans([item(4), item(4), item(4)])).toEqual([4, 4, 4]);
  });

  it('hands a lone card the whole row', () => {
    expect(packSpans([item(4)])).toEqual([12]);
  });

  it('gives a short row its leftover columns, last card first, round robin', () => {
    expect(packSpans([item(4), item(4)])).toEqual([6, 6]);
    expect(packSpans([item(4), item(4), item(4), item(4)])).toEqual([4, 4, 4, 12]);
    expect(packSpans([item(8), item(4), item(4)])).toEqual([8, 4, 12]);
  });

  it('starts a new row when the next card does not fit, then fills the row it left', () => {
    expect(packSpans([item(8), item(8)])).toEqual([12, 12]);
    expect(packSpans([item(4), item(8), item(8)])).toEqual([4, 8, 12]);
    expect(packSpans([item(8), item(6)])).toEqual([12, 12]);
  });

  it('never grows a card past its maximum', () => {
    expect(packSpans([item(4, 4, 6), item(4, 4, 6)])).toEqual([6, 6]);
    expect(packSpans([item(4, 4, 4)])).toEqual([4]);
  });

  it('never shrinks a card below what was asked, and clamps a request into the limits', () => {
    expect(packSpans([item(3, 6, 12)])).toEqual([12]);
    expect(packSpans([item(20, 4, 8)])).toEqual([8]);
  });
});
