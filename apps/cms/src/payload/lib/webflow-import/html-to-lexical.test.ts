import { describe, expect, it } from 'vitest';

import { htmlToLexical } from './html-to-lexical';

describe('htmlToLexical', () => {
  it('returns the empty-root shape for null / empty inputs', () => {
    for (const value of [null, undefined, '', '   ']) {
      const out = htmlToLexical(value);
      expect(out.root.type).toBe('root');
      expect(out.root.children).toHaveLength(1);
      expect(out.root.children[0]?.type).toBe('paragraph');
    }
  });

  it('serializes a paragraph with inline marks', () => {
    const out = htmlToLexical('<p>Hello <strong>bold</strong> and <em>italic</em>.</p>');
    expect(out.root.children).toHaveLength(1);
    const p = out.root.children[0];
    expect(p?.type).toBe('paragraph');
    if (p?.type !== 'paragraph') throw new Error('not paragraph');
    expect(p.children).toHaveLength(5);
    expect(p.children[0]).toMatchObject({ type: 'text', text: 'Hello ', format: 0 });
    expect(p.children[1]).toMatchObject({ type: 'text', text: 'bold', format: 1 });
    expect(p.children[2]).toMatchObject({ type: 'text', text: ' and ', format: 0 });
    expect(p.children[3]).toMatchObject({ type: 'text', text: 'italic', format: 2 });
  });

  it('combines nested inline marks into a single format bitmask', () => {
    const out = htmlToLexical('<p><strong><em>both</em></strong></p>');
    const p = out.root.children[0];
    if (p?.type !== 'paragraph') throw new Error('not paragraph');
    expect(p.children[0]).toMatchObject({ type: 'text', text: 'both', format: 1 | 2 });
  });

  it('emits headings h1-h4 verbatim and clamps h5/h6 to h4', () => {
    const out = htmlToLexical('<h2>Top</h2><h3>Sub</h3><h5>Deep</h5>');
    const tags = out.root.children.map((c) => (c.type === 'heading' ? c.tag : c.type));
    expect(tags).toEqual(['h2', 'h3', 'h4']);
  });

  it('emits ordered and unordered lists with list items', () => {
    const out = htmlToLexical('<ul><li>A</li><li>B</li></ul><ol><li>One</li></ol>');
    expect(out.root.children).toHaveLength(2);
    const ul = out.root.children[0];
    const ol = out.root.children[1];
    if (ul?.type !== 'list' || ol?.type !== 'list') throw new Error('not lists');
    expect(ul.listType).toBe('bullet');
    expect(ul.children).toHaveLength(2);
    expect(ol.listType).toBe('number');
  });

  it('serializes links with url / newTab / rel', () => {
    const out = htmlToLexical('<p><a href="https://x.com" target="_blank">x</a></p>');
    const p = out.root.children[0];
    if (p?.type !== 'paragraph') throw new Error('not paragraph');
    const link = p.children[0];
    expect(link).toMatchObject({
      type: 'link',
      fields: { url: 'https://x.com', newTab: true, linkType: 'custom', rel: 'follow' },
    });
  });

  it('emits a horizontalrule node for <hr>', () => {
    const out = htmlToLexical('<p>before</p><hr><p>after</p>');
    expect(out.root.children.map((c) => c.type)).toEqual(['paragraph', 'horizontalrule', 'paragraph']);
  });

  it('emits a quote node for <blockquote>', () => {
    const out = htmlToLexical('<blockquote>Quoted</blockquote>');
    expect(out.root.children[0]?.type).toBe('quote');
  });

  it('unwraps figure/div/section wrappers and converts their children', () => {
    const out = htmlToLexical('<figure><p>Inner</p></figure>');
    expect(out.root.children).toHaveLength(1);
    expect(out.root.children[0]?.type).toBe('paragraph');
  });

  it('drops empty paragraphs', () => {
    const out = htmlToLexical('<p></p><p>Real</p><p>   </p>');
    expect(out.root.children).toHaveLength(1);
    const p = out.root.children[0];
    if (p?.type !== 'paragraph') throw new Error('not paragraph');
    expect(p.children[0]).toMatchObject({ type: 'text', text: 'Real' });
  });

  it('survives Webflow-style nested formatting', () => {
    const html =
      '<p>The <strong>OpenClaw</strong> vulnerability disclosures highlight a broader shift.</p>' +
      '<h2>What changed</h2>' +
      '<ul><li>Trust now spans <em>runtime</em>, plugins, and containers.</li><li>Mitigation needs a new boundary.</li></ul>';
    const out = htmlToLexical(html);
    expect(out.root.children.map((c) => c.type)).toEqual(['paragraph', 'heading', 'list']);
  });

  it('promotes a Webflow .artcileCtaBox into an inlineCta block', () => {
    const html =
      '<p>Body before.</p>' +
      "<div data-rt-embed-type='true'><div class=\"artcileCtaBox\">" +
      '<h3>Need to see how this looks in practice?<a href="https://www.cleanstart.com/book-a-demo">Book a quick walkthrough</a></h3>' +
      '</div></div><p>Body after.</p>';
    const out = htmlToLexical(html);
    expect(out.root.children.map((c) => c.type)).toEqual(['paragraph', 'block', 'paragraph']);
    const block = out.root.children[1];
    if (block?.type !== 'block') throw new Error('not block');
    expect(block.fields).toMatchObject({
      blockType: 'inlineCta',
      heading: 'Need to see how this looks in practice?',
      buttonLabel: 'Book a quick walkthrough',
      buttonUrl: 'https://www.cleanstart.com/book-a-demo',
      variant: 'soft',
    });
  });

  it('leaves a non-CTA div heading-with-link as a plain heading', () => {
    const html = '<div><h3>Read the <a href="/docs">documentation</a></h3></div>';
    const out = htmlToLexical(html);
    expect(out.root.children[0]?.type).toBe('heading');
  });
});
