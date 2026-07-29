#!/usr/bin/env node
/**
 * Capture live-site SEO evidence for the SOP conformance report.
 *
 * Regex extraction is deliberate: this records what the server actually sent
 * on the wire, before any DOM normalisation. It is evidence capture, not a
 * spec-compliant parser.
 *
 * Usage: node scripts/seo-sop/capture-live.mjs docs/seo/evidence/url-matrix.json
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const UA = 'Mozilla/5.0 (compatible; CleanStart-SEO-Audit/1.0)';

const TIMEOUT_MS = 15_000;

const attr = (html, re, group = 1) => {
  const m = re.exec(html);
  return m ? m[group].trim() : null;
};

export function extractHead(html) {
  const canonicals = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/gi) ?? [];
  const jsonLdTypes = new Set();
  let jsonLdParseErrors = 0;

  for (const block of html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) ??
    []) {
    const body = block.replace(/^[\s\S]*?>/, '').replace(/<\/script>$/i, '');
    try {
      // for...of rather than forEach: biome's noForEach rule governs root scripts/.
      const collect = (node) => {
        if (Array.isArray(node)) {
          for (const item of node) collect(item);
          return;
        }
        if (!node || typeof node !== 'object') return;
        if (typeof node['@type'] === 'string') jsonLdTypes.add(node['@type']);
        if (Array.isArray(node['@type'])) {
          for (const t of node['@type']) jsonLdTypes.add(t);
        }
        if (node['@graph']) collect(node['@graph']);
      };
      collect(JSON.parse(body));
    } catch {
      jsonLdParseErrors += 1;
    }
  }

  // Attribute values are captured with a quote backreference — (["'])(...)\1 — so a
  // double-quoted value containing an apostrophe ("CleanStart's images") is not
  // truncated at the apostrophe. The captured value is group 2.
  return {
    title: attr(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
    description: attr(
      html,
      /<meta[^>]+name=["']description["'][^>]+content=(["'])([\s\S]*?)\1/i,
      2,
    ),
    metaRobots: attr(html, /<meta[^>]+name=["']robots["'][^>]+content=(["'])([\s\S]*?)\1/i, 2),
    canonical: canonicals.length ? attr(canonicals[0], /href=(["'])([\s\S]*?)\1/i, 2) : null,
    canonicalCount: canonicals.length,
    hreflangCount: (html.match(/hreflang=["'][^"']+["']/gi) ?? []).length,
    h1Count: (html.match(/<h1[\s>]/gi) ?? []).length,
    ogTitle: attr(html, /<meta[^>]+property=["']og:title["'][^>]+content=(["'])([\s\S]*?)\1/i, 2),
    ogImage: attr(html, /<meta[^>]+property=["']og:image["'][^>]+content=(["'])([\s\S]*?)\1/i, 2),
    jsonLdTypes: [...jsonLdTypes],
    jsonLdParseErrors,
  };
}

export function summarizeHeaders(headers) {
  return {
    xRobotsTag: headers.get('x-robots-tag'),
    cacheControl: headers.get('cache-control'),
    contentType: headers.get('content-type'),
    link: headers.get('link'),
  };
}

async function trace(url) {
  const chain = [];
  let current = url;
  for (let hop = 0; hop < 10; hop += 1) {
    const res = await fetch(current, {
      redirect: 'manual',
      headers: { 'user-agent': UA },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    chain.push({ url: current, status: res.status });
    const location = res.headers.get('location');
    if (!location) return { chain, final: res };
    current = new URL(location, current).toString();
  }
  return { chain, final: null };
}

async function main() {
  const matrixPath = process.argv[2] ?? 'docs/seo/evidence/url-matrix.json';
  const outPath = process.argv[3] ?? 'docs/seo/evidence/live-capture.json';
  const matrix = JSON.parse(await readFile(matrixPath, 'utf8'));

  const pages = [];
  for (const { template, url } of matrix.urls) {
    let traced;
    try {
      traced = await trace(url);
    } catch (err) {
      // A timeout or transport failure is evidence too — record it and keep going,
      // rather than aborting a 50-URL capture run on one bad response.
      pages.push({ template, url, error: `fetch failed: ${err.message}` });
      continue;
    }
    const { chain, final } = traced;
    if (!final) {
      pages.push({ template, url, error: 'redirect loop or >10 hops', chain });
      continue;
    }
    const html = final.headers.get('content-type')?.includes('text/html') ? await final.text() : '';
    pages.push({
      template,
      url,
      status: chain.at(-1).status,
      redirects: chain.length - 1,
      chain,
      headers: summarizeHeaders(final.headers),
      head: html ? extractHead(html) : null,
    });
  }

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(
    outPath,
    `${JSON.stringify({ capturedAt: new Date().toISOString(), pages }, null, 2)}\n`,
  );
  console.info(`✓ captured ${pages.length} URL(s) → ${outPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
