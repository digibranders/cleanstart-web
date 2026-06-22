import { describe, expect, it } from 'vitest';

import { appendHistory, diffSchemaTypes, groupHistoryByType } from './schema-history';

const ctx = 'https://schema.org';
const article = (h: string) => ({ '@context': ctx, '@type': 'Article', headline: h });
const faq = { '@context': ctx, '@type': 'FAQPage', mainEntity: [] };

describe('diffSchemaTypes', () => {
  it('records added types', () => {
    const e = diffSchemaTypes(null, article('a'), 't', 'me');
    expect(e).toEqual([{ at: 't', by: 'me', type: 'Article', action: 'added', json: JSON.stringify(article('a')) }]);
  });

  it('records changed types (json differs)', () => {
    const e = diffSchemaTypes(article('a'), article('b'), 't', null);
    expect(e).toHaveLength(1);
    expect(e[0]?.action).toBe('changed');
  });

  it('records removed types', () => {
    const e = diffSchemaTypes(article('a'), null, 't', null);
    expect(e[0]).toMatchObject({ type: 'Article', action: 'removed', json: null });
  });

  it('no entry when unchanged', () => {
    expect(diffSchemaTypes(article('a'), article('a'), 't', null)).toEqual([]);
  });

  it('handles arrays + multiple types', () => {
    const e = diffSchemaTypes([article('a')], [article('a'), faq], 't', null);
    expect(e.map((x) => `${x.type}:${x.action}`)).toEqual(['FAQPage:added']);
  });
});

describe('appendHistory', () => {
  it('prepends newest-first and caps', () => {
    const old = [{ at: '1', by: null, type: 'Article', action: 'added' as const, json: 'x' }];
    const next = [{ at: '2', by: null, type: 'FAQPage', action: 'added' as const, json: 'y' }];
    const r = appendHistory(old, next, 5);
    expect(r.map((e) => e.at)).toEqual(['2', '1']);
  });

  it('caps to the limit', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ at: String(i), by: null, type: 'Article', action: 'added' as const, json: 'x' }));
    expect(appendHistory([], many, 3)).toHaveLength(3);
  });
});

describe('groupHistoryByType', () => {
  it('groups preserving newest-first order', () => {
    const h = [
      { at: '3', by: null, type: 'FAQPage', action: 'added' as const, json: 'y' },
      { at: '2', by: null, type: 'Article', action: 'changed' as const, json: 'b' },
      { at: '1', by: null, type: 'Article', action: 'added' as const, json: 'a' },
    ];
    const g = groupHistoryByType(h);
    expect(g.map((x) => x.type)).toEqual(['FAQPage', 'Article']);
    expect(g[1]?.entries).toHaveLength(2);
  });
});
