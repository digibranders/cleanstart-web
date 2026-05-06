import { describe, expect, it } from 'vitest';

import { plainTextToLexicalState } from './plain-text-to-lexical';

describe('plainTextToLexicalState', () => {
  it('builds a root with one paragraph per input string', () => {
    const state = plainTextToLexicalState(['First.', 'Second.']);
    expect(state.root).toMatchObject({ type: 'root', version: 1 });
    expect(state.root.children).toHaveLength(2);
    expect(state.root.children).toMatchObject([
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'First.', format: 0, mode: 'normal' }],
      },
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Second.' }],
      },
    ]);
  });

  it('renders an empty paragraph when called with no inputs', () => {
    const state = plainTextToLexicalState([]);
    expect(state.root.children).toMatchObject([{ type: 'paragraph', children: [] }]);
  });

  it('handles an explicit empty string as an empty paragraph', () => {
    const state = plainTextToLexicalState(['']);
    expect(state.root.children).toMatchObject([
      { type: 'paragraph', children: [], direction: null },
    ]);
  });

  it('preserves text verbatim including punctuation and unicode', () => {
    const text = 'Audits run “annually” — see §3.2 ✓';
    const state = plainTextToLexicalState([text]);
    expect(state.root.children).toMatchObject([
      { children: [{ text }] },
    ]);
  });
});
