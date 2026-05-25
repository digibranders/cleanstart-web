import { describe, expect, it } from 'vitest';

import {
  mergeAdjacentLists,
  needsListMerge,
  normalizeLexicalValue,
} from './lexical-normalize';

const text = (value: string) => ({ type: 'text', text: value });
const listitem = (value: string) => ({ type: 'listitem', children: [text(value)] });
const list = (items: string[], listType: 'bullet' | 'number' = 'bullet') => ({
  type: 'list',
  listType,
  start: 1,
  children: items.map(listitem),
});

type Node = { type?: string; children?: Node[] };

const firstChild = (node: Node | undefined): Node => {
  const child = node?.children?.[0];
  if (!child) throw new Error('expected first child to be defined');
  return child;
};

describe('mergeAdjacentLists', () => {
  it('merges consecutive single-item bullet lists into one', () => {
    const root = {
      type: 'root',
      children: [list(['a']), list(['b']), list(['c'])],
    };
    const out = mergeAdjacentLists(root);
    expect(out.children).toHaveLength(1);
    const merged = firstChild(out);
    expect(merged.type).toBe('list');
    expect(merged.children).toHaveLength(3);
  });

  it('does not merge lists of differing listType', () => {
    const root = {
      type: 'root',
      children: [list(['a'], 'bullet'), list(['b'], 'number')],
    };
    const out = mergeAdjacentLists(root);
    expect(out.children).toHaveLength(2);
  });

  it('does not merge across an intervening paragraph', () => {
    const root = {
      type: 'root',
      children: [
        list(['a']),
        { type: 'paragraph', children: [text('break')] },
        list(['b']),
      ],
    };
    const out = mergeAdjacentLists(root);
    expect(out.children).toHaveLength(3);
  });

  it('recurses into nested containers (lists inside blockquotes etc.)', () => {
    const root = {
      type: 'root',
      children: [
        {
          type: 'quote',
          children: [list(['a']), list(['b'])],
        },
      ],
    };
    const out = mergeAdjacentLists(root);
    const quote = firstChild(out);
    expect(quote.children).toHaveLength(1);
    expect(firstChild(quote).children).toHaveLength(2);
  });

  it('is idempotent (already-clean trees are returned untouched)', () => {
    const root = {
      type: 'root',
      children: [list(['a', 'b', 'c'])],
    };
    const out = mergeAdjacentLists(root);
    expect(firstChild(out).children).toHaveLength(3);
    const again = mergeAdjacentLists(out);
    expect(firstChild(again).children).toHaveLength(3);
  });

  it('does not mutate the input tree', () => {
    const original = {
      type: 'root',
      children: [list(['a']), list(['b'])],
    };
    const snapshot = JSON.stringify(original);
    mergeAdjacentLists(original);
    expect(JSON.stringify(original)).toBe(snapshot);
  });
});

describe('normalizeLexicalValue', () => {
  it('handles { root } document shape', () => {
    const doc = { root: { type: 'root', children: [list(['a']), list(['b'])] } };
    const out = normalizeLexicalValue(doc);
    expect(out.root.children).toHaveLength(1);
    expect(firstChild(out.root).children).toHaveLength(2);
  });

  it('passes through non-Lexical values unchanged', () => {
    expect(normalizeLexicalValue(null)).toBeNull();
    expect(normalizeLexicalValue(undefined)).toBeUndefined();
    expect(normalizeLexicalValue('string')).toBe('string');
    expect(normalizeLexicalValue({ notRoot: true })).toEqual({ notRoot: true });
  });
});

describe('needsListMerge', () => {
  it('returns true when adjacent same-shape lists are present', () => {
    const doc = { root: { type: 'root', children: [list(['a']), list(['b'])] } };
    expect(needsListMerge(doc)).toBe(true);
  });

  it('returns false on already-merged trees', () => {
    const doc = { root: { type: 'root', children: [list(['a', 'b'])] } };
    expect(needsListMerge(doc)).toBe(false);
  });

  it('returns false on non-Lexical input', () => {
    expect(needsListMerge(null)).toBe(false);
    expect(needsListMerge({})).toBe(false);
  });
});
