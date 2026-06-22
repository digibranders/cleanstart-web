import { describe, expect, it } from 'vitest';

import { extractSchemaBlocks } from './page-live-schema';

describe('extractSchemaBlocks', () => {
  it('flattens a single @graph script into per-node blocks', () => {
    const html = `<html><head>
      <script type="application/ld+json">${JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'BreadcrumbList', itemListElement: [] },
          { '@type': 'WebPage', name: 'Home' },
        ],
      })}</script></head></html>`;
    const blocks = extractSchemaBlocks(html);
    expect(blocks.map((b) => b.type)).toEqual(['BreadcrumbList', 'WebPage']);
    expect(blocks[1]?.json).toContain('"name": "Home"');
  });

  it('handles multiple separate scripts and \\u003c-escaped content', () => {
    const html = `
      <script type="application/ld+json">{"@type":"Organization","name":"X"}</script>
      <script type="application/ld+json">{"@type":"WebSite","url":"https://a.b\\u003cnot-a-tag"}</script>`;
    const blocks = extractSchemaBlocks(html);
    expect(blocks.map((b) => b.type)).toEqual(['Organization', 'WebSite']);
  });

  it('skips unparseable scripts, returns [] when none', () => {
    expect(extractSchemaBlocks('<script type="application/ld+json">not json</script>')).toEqual([]);
    expect(extractSchemaBlocks('<html>no schema</html>')).toEqual([]);
  });
});
