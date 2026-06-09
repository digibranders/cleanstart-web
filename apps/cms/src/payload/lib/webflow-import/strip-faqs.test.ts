import { describe, expect, it } from 'vitest';

import { bodyHasInlineFaqHeading, stripInlineFaqSection } from './strip-faqs';

type Node = { type?: string; tag?: string; text?: string; children?: Node[] };

const heading = (tag: string, text: string): Node => ({
  type: 'heading',
  tag,
  children: [{ type: 'text', text }],
});
const paragraph = (text: string): Node => ({
  type: 'paragraph',
  children: [{ type: 'text', text }],
});
const list = (...items: string[]): Node => ({
  type: 'list',
  children: items.map((t) => ({ type: 'listitem', children: [{ type: 'text', text: t }] })),
});
const body = (children: Node[]) => ({ root: { type: 'root', children } });

const tags = (b: ReturnType<typeof body>): string[] =>
  (b.root.children ?? []).map((n) => `${n.type}:${n.tag ?? ''}`);

describe('stripInlineFaqSection', () => {
  it('removes an h2 "FAQs" heading + following list (last-section shape)', () => {
    const input = body([
      heading('h2', 'What is container networking?'),
      paragraph('Body content.'),
      heading('h2', 'FAQs'),
      list('How does it work? It works like this.'),
    ]);
    const out = stripInlineFaqSection(input);
    expect(tags(out)).toEqual(['heading:h2', 'paragraph:']);
  });

  it('removes an h3 "FAQs" heading + following h4 questions and answers', () => {
    const input = body([
      heading('h2', 'Overview'),
      paragraph('Intro.'),
      heading('h3', 'FAQs'),
      heading('h4', 'Question one?'),
      paragraph('Answer one.'),
      heading('h4', 'Question two?'),
      paragraph('Answer two.'),
    ]);
    const out = stripInlineFaqSection(input);
    expect(tags(out)).toEqual(['heading:h2', 'paragraph:']);
  });

  it.each([['FAQs'], ['FAQs:'], ['FAQs?'], ['FAQ'], ["FAQ's"], ['FAQ’S'], ['faqs']])(
    'matches heading variant %s',
    (variant) => {
      const input = body([paragraph('keep'), heading('h2', variant), paragraph('drop')]);
      const out = stripInlineFaqSection(input);
      expect(tags(out)).toEqual(['paragraph:']);
    },
  );

  it('does NOT strip a heading that merely starts with "FAQ"', () => {
    const input = body([
      paragraph('keep'),
      heading('h2', 'FAQ about container networking'),
      paragraph('also keep'),
    ]);
    const out = stripInlineFaqSection(input);
    expect(tags(out)).toEqual(['paragraph:', 'heading:h2', 'paragraph:']);
  });

  it('is a no-op when there is no FAQ heading', () => {
    const input = body([heading('h2', 'Intro'), paragraph('content')]);
    expect(stripInlineFaqSection(input)).toBe(input);
  });

  it('preserves everything before the FAQ heading', () => {
    const input = body([
      heading('h2', 'A'),
      paragraph('a'),
      heading('h2', 'B'),
      paragraph('b'),
      heading('h2', 'FAQs'),
      paragraph('q/a'),
    ]);
    const out = stripInlineFaqSection(input);
    expect(tags(out)).toEqual(['heading:h2', 'paragraph:', 'heading:h2', 'paragraph:']);
  });

  it('does not mutate the input body', () => {
    const input = body([heading('h2', 'FAQs'), paragraph('q/a')]);
    const before = JSON.stringify(input);
    stripInlineFaqSection(input);
    expect(JSON.stringify(input)).toBe(before);
  });

  it('returns non-Lexical values unchanged', () => {
    expect(stripInlineFaqSection(null)).toBeNull();
    expect(stripInlineFaqSection(undefined)).toBeUndefined();
  });
});

describe('bodyHasInlineFaqHeading', () => {
  it('detects a FAQ heading', () => {
    expect(bodyHasInlineFaqHeading(body([heading('h2', 'FAQs'), paragraph('x')]))).toBe(true);
  });
  it('returns false without one', () => {
    expect(bodyHasInlineFaqHeading(body([heading('h2', 'Intro')]))).toBe(false);
    expect(bodyHasInlineFaqHeading(null)).toBe(false);
  });
});
