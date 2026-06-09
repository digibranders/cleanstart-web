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
    expect(out.root.children.map((c) => c.type)).toEqual([
      'paragraph',
      'horizontalrule',
      'paragraph',
    ]);
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
      '<div data-rt-embed-type=\'true\'><div class="artcileCtaBox">' +
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

  it('converts a table into table/tablerow/tablecell nodes with header state', () => {
    const html =
      '<table><thead><tr><th>A</th><th>B</th></tr></thead>' +
      '<tbody><tr><td>1</td><td>2</td></tr></tbody></table>';
    const out = htmlToLexical(html);
    expect(out.root.children).toHaveLength(1);
    const table = out.root.children[0];
    if (table?.type !== 'table') throw new Error('not table');
    expect(table.children).toHaveLength(2);
    const [headRow, bodyRow] = table.children;
    expect(headRow?.type).toBe('tablerow');
    expect(headRow?.children).toHaveLength(2);
    const headCell = headRow?.children[0];
    if (headCell?.type !== 'tablecell') throw new Error('not cell');
    expect(headCell.headerState).toBe(2); // column header
    // cell content is wrapped in a paragraph
    const headPara = headCell.children[0];
    if (headPara?.type !== 'paragraph') throw new Error('cell not paragraph');
    expect(headPara.children[0]).toMatchObject({ type: 'text', text: 'A' });
    const bodyCell = bodyRow?.children[0];
    if (bodyCell?.type !== 'tablecell') throw new Error('not cell');
    expect(bodyCell.headerState).toBe(0); // body cell
    const bodyText = bodyCell.children[0];
    if (bodyText?.type !== 'paragraph') throw new Error('cell not paragraph');
    expect(bodyText.children[0]).toMatchObject({ type: 'text', text: '1' });
  });

  it('marks <th> in a body row as a row header (headerState 1)', () => {
    const html = '<table><tbody><tr><th>Key</th><td>Val</td></tr></tbody></table>';
    const out = htmlToLexical(html);
    const table = out.root.children[0];
    if (table?.type !== 'table') throw new Error('not table');
    const cell = table.children[0]?.children[0];
    if (cell?.type !== 'tablecell') throw new Error('not cell');
    expect(cell.headerState).toBe(1);
  });

  it('handles a table whose <tr> sit directly under <table>', () => {
    const html = '<table><tr><td>x</td><td>y</td></tr></table>';
    const out = htmlToLexical(html);
    const table = out.root.children[0];
    if (table?.type !== 'table') throw new Error('not table');
    expect(table.children).toHaveLength(1);
    expect(table.children[0]?.children).toHaveLength(2);
  });

  it('converts <pre data-lang> into a codeBlock block preserving newlines + language', () => {
    const html = '<pre data-lang="dockerfile">FROM ubuntu:22.04\nRUN apt-get update</pre>';
    const out = htmlToLexical(html);
    expect(out.root.children).toHaveLength(1);
    const block = out.root.children[0];
    if (block?.type !== 'block') throw new Error('not block');
    expect(block.fields).toMatchObject({
      blockType: 'codeBlock',
      language: 'dockerfile',
      content: 'FROM ubuntu:22.04\nRUN apt-get update',
      showLineNumbers: false,
    });
    expect(typeof (block.fields as { id: string }).id).toBe('string');
  });

  it('defaults an unknown / missing code language to text and aliases short names', () => {
    const unknown = htmlToLexical('<pre>plain stuff</pre>').root.children[0];
    if (unknown?.type !== 'block') throw new Error('not block');
    expect((unknown.fields as { language: string }).language).toBe('text');

    const aliased = htmlToLexical('<pre data-lang="sh">echo hi</pre>').root.children[0];
    if (aliased?.type !== 'block') throw new Error('not block');
    expect((aliased.fields as { language: string }).language).toBe('bash');
  });

  it('reads a language-xxx class on a nested <code> when no data-lang is present', () => {
    const out = htmlToLexical('<pre><code class="language-yaml">key: value</code></pre>');
    const block = out.root.children[0];
    if (block?.type !== 'block') throw new Error('not block');
    expect((block.fields as { language: string; content: string }).language).toBe('yaml');
    expect((block.fields as { content: string }).content).toBe('key: value');
  });
});
