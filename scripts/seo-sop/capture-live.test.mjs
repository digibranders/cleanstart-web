import test from 'node:test';
import assert from 'node:assert/strict';
import { extractHead, summarizeHeaders } from './capture-live.mjs';

const HTML = `<!doctype html><html><head>
<title>Hardened Container Images | CleanStart</title>
<meta name="description" content="Near-zero CVE base images.">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="https://www.cleanstart.com/cleanstart-images"/>
<link rel="alternate" hreflang="en" href="https://www.cleanstart.com/x"/>
<meta property="og:title" content="Hardened Container Images"/>
<meta property="og:image" content="https://www.cleanstart.com/api/og?t=x"/>
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebPage"},{"@type":"Organization"}]}</script>
</head><body><h1>Images</h1><h1>Second</h1></body></html>`;

test('extractHead pulls the title and description', () => {
  const h = extractHead(HTML);
  assert.equal(h.title, 'Hardened Container Images | CleanStart');
  assert.equal(h.description, 'Near-zero CVE base images.');
});

test('extractHead counts canonicals and returns the href', () => {
  const h = extractHead(HTML);
  assert.equal(h.canonicalCount, 1);
  assert.equal(h.canonical, 'https://www.cleanstart.com/cleanstart-images');
});

test('extractHead reports the robots meta and hreflang count', () => {
  const h = extractHead(HTML);
  assert.equal(h.metaRobots, 'index,follow,max-image-preview:large');
  assert.equal(h.hreflangCount, 1);
});

test('extractHead counts h1 elements so duplicates are detectable', () => {
  assert.equal(extractHead(HTML).h1Count, 2);
});

test('extractHead collects JSON-LD @type values including @graph members', () => {
  assert.deepEqual(extractHead(HTML).jsonLdTypes.sort(), ['Organization', 'WebPage']);
});

test('extractHead reports zero canonicals rather than throwing when absent', () => {
  const h = extractHead('<html><head><title>t</title></head><body></body></html>');
  assert.equal(h.canonicalCount, 0);
  assert.equal(h.canonical, null);
});

test('extractHead tolerates malformed JSON-LD without throwing', () => {
  const h = extractHead(`<script type="application/ld+json">{not json}</script>`);
  assert.deepEqual(h.jsonLdTypes, []);
  assert.equal(h.jsonLdParseErrors, 1);
});

test('summarizeHeaders lifts the SEO-relevant headers', () => {
  const headers = new Headers({
    'x-robots-tag': 'max-image-preview:large',
    'cache-control': 'public, max-age=0, must-revalidate',
    'content-type': 'text/html; charset=utf-8',
  });
  assert.deepEqual(summarizeHeaders(headers), {
    xRobotsTag: 'max-image-preview:large',
    cacheControl: 'public, max-age=0, must-revalidate',
    contentType: 'text/html; charset=utf-8',
    link: null,
  });
});
