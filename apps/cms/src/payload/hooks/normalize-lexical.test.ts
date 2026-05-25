import { describe, expect, it } from 'vitest';

import { normalizeLexicalHook } from './normalize-lexical';

const text = (value: string) => ({ type: 'text', text: value });
const listitem = (value: string) => ({ type: 'listitem', children: [text(value)] });
const list = (items: string[]) => ({
  type: 'list',
  listType: 'bullet',
  start: 1,
  children: items.map(listitem),
});

const makeDoc = () => ({
  root: { type: 'root', children: [list(['a']), list(['b']), list(['c'])] },
});

// The hook signature pulls additional fields from Payload's request context
// that this unit test doesn't care about. Use `as never` on the whole arg
// rather than spreading a stub object — keeps TS happy with the strict
// CollectionBeforeChangeHook signature.
const call = (hook: ReturnType<typeof normalizeLexicalHook>, data: unknown) =>
  hook({ data } as never);

describe('normalizeLexicalHook', () => {
  it('merges adjacent lists in the default body field', () => {
    const hook = normalizeLexicalHook();
    const out = call(hook, { body: makeDoc() }) as { body: { root: { children: { children: unknown[] }[] } } };
    expect(out.body.root.children).toHaveLength(1);
    const first = out.body.root.children[0];
    if (!first) throw new Error('expected merged list');
    expect(first.children).toHaveLength(3);
  });

  it('honors a custom field list', () => {
    const hook = normalizeLexicalHook({ fields: ['bioLong'] });
    const out = call(hook, { bioLong: makeDoc(), body: makeDoc() }) as {
      bioLong: { root: { children: unknown[] } };
      body: { root: { children: unknown[] } };
    };
    expect(out.bioLong.root.children).toHaveLength(1);
    // body untouched because not in the configured fields
    expect(out.body.root.children).toHaveLength(3);
  });

  it('is a no-op when no normalization is needed', () => {
    const clean = { root: { type: 'root', children: [list(['a', 'b'])] } };
    const data = { body: clean };
    const hook = normalizeLexicalHook();
    expect(call(hook, data)).toBe(data);
  });

  it('returns data unchanged when the field is missing', () => {
    const data = { title: 'hi' };
    const hook = normalizeLexicalHook();
    expect(call(hook, data)).toBe(data);
  });

  it('returns falsy data unchanged', () => {
    const hook = normalizeLexicalHook();
    expect(call(hook, undefined)).toBeUndefined();
  });
});
