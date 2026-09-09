/**
 * Regenerates src/free-email-domains.ts from its two upstream sources.
 * Run when the corpus goes stale: `pnpm --filter @cleanstart/forms refresh-domains`.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCES = [
  {
    url: 'https://raw.githubusercontent.com/Kikobeats/free-email-domains/master/domains.json',
    parse: (text) => JSON.parse(text),
  },
  {
    url: 'https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/main/disposable_email_blocklist.conf',
    parse: (text) => text.split('\n'),
  },
];

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'free-email-domains.ts');

const collected = [];
for (const source of SOURCES) {
  const res = await fetch(source.url);
  if (!res.ok) {
    throw new Error(`${source.url} responded ${res.status}`);
  }
  collected.push(...source.parse(await res.text()));
}

const domains = [
  ...new Set(
    collected
      .map((entry) => String(entry ?? '').trim().toLowerCase())
      .filter((entry) => entry.includes('.') && /^[a-z0-9.-]+$/u.test(entry)),
  ),
].sort();

if (domains.length < 10_000) {
  throw new Error(`Only ${domains.length} domains parsed — refusing to shrink the list.`);
}

const today = new Date().toISOString().slice(0, 10);
writeFileSync(
  OUT,
  `/**
 * Consumer webmail and disposable-mailbox domains. Any address on one of these
 * is a personal mailbox, not a company one.
 *
 * Generated from two public sources, merged and deduplicated:
 *   - github.com/Kikobeats/free-email-domains  (free consumer providers)
 *   - github.com/disposable-email-domains/disposable-email-domains
 *
 * Snapshot taken ${today}. ${domains.length} domains. Regenerate with
 * \`pnpm --filter @cleanstart/forms refresh-domains\`.
 *
 * Server-side only — this is ~190 KB of source and must never reach the
 * browser bundle. Import FREE_EMAIL_DOMAINS from \`@cleanstart/forms/server\`
 * rather than this raw corpus: the corpus has real gaps (it misses tutanota,
 * mailbox.org, sfr.fr, globo.com and ~40 others), so the server set is this
 * unioned with the curated COMMON_FREE_EMAIL_DOMAINS.
 */

const RAW = \`${domains.join('\n')}\`;

export const UPSTREAM_FREE_EMAIL_DOMAINS: ReadonlySet<string> = new Set(RAW.split('\\n'));
`,
);

console.log(`Wrote ${domains.length} domains to ${OUT}`);
