import { describe, expect, it } from 'vitest';

import {
  convertBodyCtas,
  extractCtaFromHeading,
  isCtaHeading,
  makeInlineCtaBlock,
  type InlineCtaBlockNode,
} from './cta-cards';

const text = (t: string, format = 0) => ({
  type: 'text',
  text: t,
  format,
  style: '',
  mode: 'normal',
  detail: 0,
  version: 1,
});

const link = (url: string, label: string) => ({
  type: 'link',
  version: 3,
  format: '',
  indent: 0,
  direction: 'ltr',
  fields: { url, newTab: false, linkType: 'custom', rel: 'follow' },
  children: [text(label)],
});

const heading = (children: unknown[], tag = 'h3') => ({
  type: 'heading',
  version: 1,
  tag,
  format: '',
  indent: 0,
  direction: 'ltr',
  children,
});

const root = (children: unknown[]) => ({
  root: { type: 'root', version: 1, format: '', indent: 0, direction: 'ltr', children },
});

describe('isCtaHeading', () => {
  it('matches a heading that contains a link child', () => {
    expect(isCtaHeading(heading([text('Need to see how this looks?'), link('/demo', 'Book a demo')]))).toBe(true);
  });

  it('rejects a plain heading and a paragraph-with-link', () => {
    expect(isCtaHeading(heading([text('What is NIST 800-53?')]))).toBe(false);
    expect(isCtaHeading({ type: 'paragraph', children: [link('/x', 'y')] })).toBe(false);
    expect(isCtaHeading(null)).toBe(false);
  });
});

describe('extractCtaFromHeading', () => {
  it('splits prompt text and button from a trailing-link heading', () => {
    const cta = extractCtaFromHeading(
      heading([text('Need to see how this looks in practice?'), link('https://www.cleanstart.com/book-a-demo', 'Book a quick walkthrough')]),
    );
    expect(cta).toEqual({
      heading: 'Need to see how this looks in practice?',
      buttonLabel: 'Book a quick walkthrough',
      buttonUrl: 'https://www.cleanstart.com/book-a-demo',
      midSentence: false,
    });
  });

  it('flags a mid-sentence link and keeps the trailing prose in the heading', () => {
    const cta = extractCtaFromHeading(
      heading([text('Explore '), link('https://images.cleanstart.com/', 'hardened container images'), text(' ready for secure deployments')]),
    );
    expect(cta?.heading).toBe('Explore ready for secure deployments');
    expect(cta?.buttonLabel).toBe('hardened container images');
    expect(cta?.midSentence).toBe(true);
  });

  it('treats a trailing period after the link as a clean (not mid-sentence) CTA', () => {
    const cta = extractCtaFromHeading(
      heading([text('See how it works'), link('/demo', 'Book a demo'), text('.')]),
    );
    expect(cta?.heading).toBe('See how it works');
    expect(cta?.midSentence).toBe(false);
  });

  it('returns null when the heading is a link with no prompt text', () => {
    expect(extractCtaFromHeading(heading([link('/x', 'Just a link')]))).toBeNull();
  });

  it('returns null when the link has no usable url', () => {
    expect(extractCtaFromHeading(heading([text('Prompt'), link('', 'Label')]))).toBeNull();
  });
});

describe('makeInlineCtaBlock', () => {
  it('builds a valid version-2 block node with defaults', () => {
    const block = makeInlineCtaBlock({ heading: 'H', buttonLabel: 'B', buttonUrl: '/u' });
    expect(block.type).toBe('block');
    expect(block.version).toBe(2);
    expect(block.fields.blockType).toBe('inlineCta');
    expect(block.fields.variant).toBe('soft');
    expect(block.fields.id).toMatch(/^[0-9a-f]{24}$/);
  });
});

describe('convertBodyCtas', () => {
  it('replaces CTA headings with inlineCta blocks and leaves prose untouched', () => {
    const body = root([
      { type: 'paragraph', children: [text('Intro prose.')] },
      heading([text('See how it works'), link('/demo', 'Book a demo')]),
      heading([text('What is NIST 800-53?')]),
    ]);
    const out = convertBodyCtas(body);
    expect(out.converted).toBe(1);

    const children = (out.body as ReturnType<typeof root>).root.children;
    expect((children[0] as { type: string }).type).toBe('paragraph');
    const cta = children[1] as InlineCtaBlockNode;
    expect(cta.type).toBe('block');
    expect(cta.fields).toMatchObject({ blockType: 'inlineCta', heading: 'See how it works', buttonLabel: 'Book a demo', buttonUrl: '/demo' });
    expect((children[2] as { type: string }).type).toBe('heading');
  });

  it('is idempotent — a second pass converts nothing and returns the input', () => {
    const body = root([heading([text('See how it works'), link('/demo', 'Book a demo')])]);
    const first = convertBodyCtas(body);
    const second = convertBodyCtas(first.body);
    expect(second.converted).toBe(0);
    expect(second.body).toBe(first.body);
  });

  it('defers mid-sentence CTAs by default and skips link-only headings', () => {
    const body = root([
      heading([text('See how it works'), link('/demo', 'Book a demo')]),
      heading([text('Prefix '), link('/a', 'mid link'), text(' suffix here')]),
      heading([link('/b', 'link only')]),
    ]);
    const out = convertBodyCtas(body);
    expect(out.converted).toBe(1); // only the clean trailing-link CTA
    expect(out.deferred).toHaveLength(1);
    expect(out.skipped).toHaveLength(1);
    expect(out.review).toHaveLength(0);
    // The deferred heading is left untouched in the body.
    const children = (out.body as ReturnType<typeof root>).root.children;
    expect((children[1] as { type: string }).type).toBe('heading');
  });

  it('converts mid-sentence CTAs when includeMidSentence is set', () => {
    const body = root([
      heading([text('Prefix '), link('/a', 'mid link'), text(' suffix here')]),
    ]);
    const out = convertBodyCtas(body, { includeMidSentence: true });
    expect(out.converted).toBe(1);
    expect(out.review).toHaveLength(1);
    expect(out.deferred).toHaveLength(0);
  });

  it('returns the input unchanged when there are no CTAs', () => {
    const body = root([{ type: 'paragraph', children: [text('Just prose.')] }]);
    const out = convertBodyCtas(body);
    expect(out.converted).toBe(0);
    expect(out.body).toBe(body);
  });
});
