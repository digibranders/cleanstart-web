import { describe, expect, it } from 'vitest';

import { lexicalToPlainText } from './to-plain-text';

const textNode = (text: string) => ({
  type: 'text',
  text,
  format: 0,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
});

const paragraph = (...children: unknown[]) => ({
  type: 'paragraph',
  children,
  direction: null,
  format: '',
  indent: 0,
  version: 1,
});

const listItem = (...children: unknown[]) => ({
  type: 'listitem',
  value: 1,
  children,
  direction: null,
  format: '',
  indent: 0,
  version: 1,
});

const list = (...children: unknown[]) => ({
  type: 'list',
  listType: 'bullet',
  start: 1,
  tag: 'ul',
  children,
  direction: null,
  format: '',
  indent: 0,
  version: 1,
});

const root = (...children: unknown[]) => ({
  root: {
    type: 'root',
    children,
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  },
});

describe('lexicalToPlainText', () => {
  it('returns empty string for null/empty content', () => {
    expect(lexicalToPlainText(null)).toBe('');
    expect(lexicalToPlainText(undefined)).toBe('');
    expect(lexicalToPlainText(root())).toBe('');
  });

  it('joins two paragraphs with a period-space boundary', () => {
    const value = root(paragraph(textNode('First para')), paragraph(textNode('Second para')));
    expect(lexicalToPlainText(value)).toBe('First para. Second para.');
  });

  it('does not double up an existing terminal punctuation mark', () => {
    const value = root(paragraph(textNode('Already ends with a question?')));
    expect(lexicalToPlainText(value)).toBe('Already ends with a question?');
  });

  it('separates list items so they do not run together', () => {
    const value = root(
      paragraph(textNode('Steps:')),
      list(listItem(textNode('Step one')), listItem(textNode('Step two'))),
    );
    expect(lexicalToPlainText(value)).toBe('Steps: Step one. Step two.');
  });

  it('separates a Tab-indented nested list into its own blocks instead of running them together', () => {
    const value = root(
      list(
        listItem(textNode('Item 1')),
        listItem(
          list(listItem(textNode('Nested Item 1a')), listItem(textNode('Nested Item 1b'))),
        ),
        listItem(textNode('Item 2')),
      ),
    );
    expect(lexicalToPlainText(value)).toBe(
      'Item 1. Nested Item 1a. Nested Item 1b. Item 2.',
    );
  });

  it('preserves bold/italic text as plain text (formatting is dropped, content is not)', () => {
    const value = root(paragraph(textNode('Bold word'), textNode(' and normal word')));
    expect(lexicalToPlainText(value)).toBe('Bold word and normal word.');
  });

  it('recognizes closing quotes and parentheses after terminal punctuation without doubling', () => {
    const quoted = root(paragraph(textNode('She said, "Yes."')));
    expect(lexicalToPlainText(quoted)).toBe('She said, "Yes."');

    const parenthetical = root(paragraph(textNode('See details (here!)')));
    expect(lexicalToPlainText(parenthetical)).toBe('See details (here!)');
  });
});
