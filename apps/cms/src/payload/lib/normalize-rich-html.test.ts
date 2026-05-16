// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';

import {
  extractInlineImages,
  looksLikeRichDoc,
  normalizeRichHtml,
} from './normalize-rich-html';

const parse = (html: string): Element => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body;
};

describe('looksLikeRichDoc', () => {
  it('detects HTML containing paragraph tags', () => {
    expect(looksLikeRichDoc('<p>Some content here that is long enough.</p>')).toBe(true);
  });

  it('detects MS-Office signatures', () => {
    expect(looksLikeRichDoc('<div><p class="MsoNormal">word stuff</p></div>')).toBe(true);
  });

  it('rejects short or empty input', () => {
    expect(looksLikeRichDoc('')).toBe(false);
    expect(looksLikeRichDoc('<p>x</p>')).toBe(false);
  });

  it('rejects plain URL paste', () => {
    expect(looksLikeRichDoc('https://example.com/some/long/url/path/here')).toBe(false);
  });
});

describe('normalizeRichHtml', () => {
  it('promotes Word MsoHeading2 paragraphs to <h2>', () => {
    const root = parse('<p class="MsoHeading2">My heading</p><p class="MsoNormal">Body</p>');
    normalizeRichHtml(root);
    expect(root.innerHTML).toContain('<h2>My heading</h2>');
    expect(root.innerHTML).toContain('<p>Body</p>');
  });

  it('promotes inline-styled paragraph (font-size + bold) to a heading', () => {
    const root = parse('<p style="font-size:18.0pt;font-weight:700">Big heading</p>');
    normalizeRichHtml(root);
    expect(root.innerHTML).toContain('<h2>Big heading</h2>');
  });

  it('promotes all-bold paragraph to <h3>', () => {
    const root = parse('<p><strong>Whole bold heading</strong></p>');
    normalizeRichHtml(root);
    expect(root.innerHTML).toContain('<h3>');
    expect(root.innerHTML).toContain('Whole bold heading');
  });

  it('rewrites inline font-weight spans into <strong>', () => {
    const root = parse(
      '<p>Lead <span style="font-weight:700">bold</span> tail.</p>',
    );
    normalizeRichHtml(root);
    expect(root.innerHTML).toContain('<strong>bold</strong>');
    expect(root.querySelectorAll('span').length).toBe(0);
  });

  it('rewrites inline font-style spans into <em>', () => {
    const root = parse(
      '<p>Lead <span style="font-style:italic">italics</span> tail.</p>',
    );
    normalizeRichHtml(root);
    expect(root.innerHTML).toContain('<em>italics</em>');
  });

  it('rewrites inline text-decoration spans into <u>', () => {
    const root = parse(
      '<p>Lead <span style="text-decoration:underline">under</span> tail.</p>',
    );
    normalizeRichHtml(root);
    expect(root.innerHTML).toContain('<u>under</u>');
  });

  it('combines inline styles into nested format tags', () => {
    const root = parse(
      '<p>Lead <span style="font-weight:700;font-style:italic">both</span> tail.</p>',
    );
    normalizeRichHtml(root);
    const inner = root.innerHTML;
    expect(inner).toContain('both');
    // Both <strong> and <em> should appear, wrapping the same text.
    expect(/<strong>[^<]*<em>both<\/em>[^<]*<\/strong>/.test(inner) ||
      /<em>[^<]*<strong>both<\/strong>[^<]*<\/em>/.test(inner)).toBe(true);
  });

  it('strips <o:p>, <style>, <script> entirely', () => {
    const root = parse(
      '<style>p{color:red}</style><p>Real <o:p></o:p>text</p><script>x()</script>',
    );
    normalizeRichHtml(root);
    expect(root.innerHTML).not.toContain('<style');
    expect(root.innerHTML).not.toContain('<o:p');
    expect(root.innerHTML).not.toContain('<script');
    expect(root.innerHTML).toContain('Real');
    expect(root.innerHTML).toContain('text');
  });

  it('removes class/style attributes from regular tags', () => {
    const root = parse('<p class="MsoNormal" style="margin:0">Plain</p>');
    normalizeRichHtml(root);
    expect(root.innerHTML).toContain('<p>Plain</p>');
  });

  it('preserves anchor href and target', () => {
    const root = parse(
      '<p>see <a href="https://example.com" target="_blank" rel="noopener">site</a></p>',
    );
    normalizeRichHtml(root);
    const anchor = root.querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('https://example.com');
    expect(anchor?.getAttribute('target')).toBe('_blank');
    expect(anchor?.getAttribute('rel')).toBe('noopener');
  });

  it('unwraps <font> tags without losing inner text', () => {
    const root = parse('<p><font face="Arial" size="3">text</font></p>');
    normalizeRichHtml(root);
    expect(root.innerHTML).toContain('text');
    expect(root.innerHTML).not.toContain('<font');
  });

  it('preserves <ul>/<li> structure intact', () => {
    const root = parse('<ul><li>One</li><li>Two</li></ul>');
    normalizeRichHtml(root);
    expect(root.querySelectorAll('ul li').length).toBe(2);
  });

  it('strips Word desktop namespaced cruft (<v:imagedata>, <w:sdt>, <m:oMath>)', () => {
    const root = parse(
      '<p>Real text<v:imagedata src="x.png"/><w:sdt><w:sdtPr/></w:sdt><m:oMath>x</m:oMath></p>',
    );
    normalizeRichHtml(root);
    expect(root.innerHTML).not.toMatch(/<v:|<w:|<m:/);
    expect(root.innerHTML).toContain('Real text');
  });

  it('promotes Word Online <p role="heading" aria-level="2"> to <h2>', () => {
    const root = parse(
      '<p role="heading" aria-level="2">Word Online heading</p><p>Body</p>',
    );
    normalizeRichHtml(root);
    expect(root.innerHTML).toContain('<h2>Word Online heading</h2>');
    expect(root.innerHTML).toContain('<p>Body</p>');
  });

  it('promotes Word Online <div role="heading" aria-level="3"> to <h3>', () => {
    const root = parse(
      '<div role="heading" aria-level="3"><span>Subheading</span></div>',
    );
    normalizeRichHtml(root);
    expect(root.innerHTML).toContain('<h3>');
    expect(root.innerHTML).toContain('Subheading');
  });

  it('drops Word Online EOP marker spans', () => {
    const root = parse(
      '<p><span class="TextRun">Visible</span><span class="EOP" data-ccp="1"> </span></p>',
    );
    normalizeRichHtml(root);
    expect(root.innerHTML).toContain('Visible');
    expect(root.innerHTML).not.toMatch(/eop/i);
  });

  it('handles a realistic Word desktop heading + paragraph with bold/italic', () => {
    const root = parse(`
      <p class="MsoHeading2"><span style="font-size:18.0pt;font-weight:700">Section heading</span></p>
      <p class="MsoNormal">
        <span>Body with </span>
        <span style="font-weight:700">bold</span>
        <span> and </span>
        <span style="font-style:italic">italic</span>
        <span>.</span>
        <o:p></o:p>
      </p>
    `);
    normalizeRichHtml(root);
    const html = root.innerHTML;
    expect(html).toContain('<h2>');
    expect(html).toContain('Section heading');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).not.toContain('<o:p');
    expect(html).not.toMatch(/class=|style=|mso-/);
  });

  it('handles a realistic Word Online heading + paragraph block', () => {
    // Approximation of Word-for-Web clipboard structure: OutlineElement
    // wrappers, semantic <h2>, EOP markers on body paragraphs, NormalTextRun spans.
    const root = parse(`
      <div class="OutlineElement Ltr BCX0 SCXW123" data-contrast="auto">
        <h2><span class="TextRun">Section heading</span></h2>
      </div>
      <div class="OutlineElement Ltr BCX0 SCXW123">
        <p class="Paragraph SCXW123">
          <span class="TextRun NormalTextRun">Body with </span>
          <span class="TextRun" style="font-weight:bold">bold</span>
          <span class="TextRun"> and </span>
          <span class="TextRun" style="font-style:italic">italic</span>
          <span class="TextRun">.</span>
          <span class="EOP" data-ccp-props="{}"> </span>
        </p>
      </div>
    `);
    normalizeRichHtml(root);
    const html = root.innerHTML;
    expect(html).toContain('<h2>');
    expect(html).toContain('Section heading');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).not.toMatch(/eop|outlineelement|textrun/i);
  });
});

describe('extractInlineImages', () => {
  it('collects absolute http(s) srcs in document order and removes the tags', () => {
    const root = parse(
      '<p>One</p>' +
        '<img src="https://cdn.example.com/a.png" alt="A">' +
        '<p>Two</p>' +
        '<img src="http://cdn.example.com/b.jpg" alt="">' +
        '<p>Three</p>',
    );
    const collected = extractInlineImages(root);
    expect(collected).toHaveLength(2);
    expect(collected[0]).toMatchObject({ src: 'https://cdn.example.com/a.png', alt: 'A' });
    expect(collected[1]).toMatchObject({ src: 'http://cdn.example.com/b.jpg', alt: '' });
    expect(collected[0]?.placeholderId).toMatch(/^i0-/);
    expect(collected[1]?.placeholderId).toMatch(/^i1-/);
    expect(root.querySelectorAll('img')).toHaveLength(0);
    expect(root.innerHTML).toContain('<p>One</p>');
    expect(root.innerHTML).toContain('<p>Two</p>');
    expect(root.innerHTML).toContain('<p>Three</p>');
  });

  it('inserts placeholder paragraphs at original image positions', () => {
    const root = parse(
      '<p>Intro paragraph.</p>' +
        '<img src="https://cdn.example.com/a.png" alt="A">' +
        '<p>Middle paragraph.</p>' +
        '<img src="https://cdn.example.com/b.png" alt="B">' +
        '<p>Closing paragraph.</p>',
    );
    const collected = extractInlineImages(root);
    // Top-level children, in order, should be:
    //   p(Intro), p(placeholder0), p(Middle), p(placeholder1), p(Closing)
    const top = Array.from(root.children).map((el) => ({
      tag: el.tagName.toLowerCase(),
      text: (el.textContent || '').trim(),
    }));
    expect(top).toHaveLength(5);
    expect(top[0]).toEqual({ tag: 'p', text: 'Intro paragraph.' });
    expect(top[1]?.tag).toBe('p');
    expect(top[1]?.text).toBe(`CS_IMG_PLACEHOLDER:${collected[0]?.placeholderId}`);
    expect(top[2]).toEqual({ tag: 'p', text: 'Middle paragraph.' });
    expect(top[3]?.tag).toBe('p');
    expect(top[3]?.text).toBe(`CS_IMG_PLACEHOLDER:${collected[1]?.placeholderId}`);
    expect(top[4]).toEqual({ tag: 'p', text: 'Closing paragraph.' });
  });

  it('lifts an image out of its block ancestor and removes the now-empty parent', () => {
    const root = parse(
      '<p>Before</p>' +
        '<figure><img src="https://cdn.example.com/x.png" alt="X"></figure>' +
        '<p>After</p>',
    );
    const collected = extractInlineImages(root);
    expect(collected).toHaveLength(1);
    expect(root.querySelector('figure')).toBeNull();
    const top = Array.from(root.children).map((el) => el.tagName.toLowerCase());
    expect(top).toEqual(['p', 'p', 'p']); // Before, placeholder, After
  });

  it('keeps surrounding text when the block ancestor still has content', () => {
    const root = parse(
      '<p>Text before <img src="https://cdn.example.com/inline.png" alt=""> text after</p>',
    );
    extractInlineImages(root);
    // Original paragraph keeps its surrounding text; placeholder is inserted after it.
    const top = Array.from(root.children).map((el) => (el.textContent || '').trim());
    expect(top[0]).toMatch(/Text before/);
    expect(top[0]).toMatch(/text after/);
    expect(top[1]).toMatch(/^CS_IMG_PLACEHOLDER:/);
    expect(root.querySelectorAll('img')).toHaveLength(0);
  });

  it('drops non-http srcs (data:, blob:, relative) but still removes the tag', () => {
    const root = parse(
      '<img src="data:image/png;base64,AAAA">' +
        '<img src="blob:https://example.com/abc">' +
        '<img src="/local/path.png">' +
        '<img>',
    );
    expect(extractInlineImages(root)).toEqual([]);
    expect(root.querySelectorAll('img')).toHaveLength(0);
    expect(root.querySelectorAll('p')).toHaveLength(0);
  });
});
