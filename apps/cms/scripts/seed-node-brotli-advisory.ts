#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: create the CVE-2026-111497 (Node.js Brotli) advisory from the
 * client's sample (Biplab Paul, 2026-10-26). Saved as a DRAFT unless
 * `--publish` is passed. Skips if the slug already exists.
 *
 * Local:   pnpm exec tsx --env-file=.env scripts/seed-node-brotli-advisory.ts [--publish]
 * Prod container (env in process, no .env):
 *   /app/node_modules/.bin/tsx scripts/seed-node-brotli-advisory.ts [--publish]
 */
import { getPayload } from 'payload';

import { revalidateWeb } from '../src/payload/lib/web-revalidate.ts';
import payloadConfig from '../src/payload.config.ts';

const SLUG = 'cve-2026-111497-nodejs-brotli-decoder-out-of-bounds-write';
const PUBLISH = process.argv.includes('--publish');

type Node = Record<string, unknown>;

const text = (value: string, format = 0): Node => ({
  type: 'text',
  text: value,
  format,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
});
const code = (value: string): Node => text(value, 16);
const paragraph = (...children: Node[]): Node => ({
  type: 'paragraph',
  format: '',
  indent: 0,
  version: 1,
  direction: null,
  textFormat: 0,
  textStyle: '',
  children,
});
const cell = (header: boolean, ...children: Node[]): Node => ({
  type: 'tablecell',
  format: '',
  indent: 0,
  version: 1,
  colSpan: 1,
  rowSpan: 1,
  direction: null,
  backgroundColor: null,
  headerState: header ? 1 : 0,
  children: [paragraph(...children)],
});
const table = (head: string[], rows: Node[][]): Node => ({
  type: 'table',
  format: '',
  indent: 0,
  version: 1,
  direction: null,
  children: [
    { type: 'tablerow', format: '', indent: 0, version: 1, direction: null, children: head.map((h) => cell(true, text(h))) },
    ...rows.map((r) => ({
      type: 'tablerow',
      format: '',
      indent: 0,
      version: 1,
      direction: null,
      children: r.map((c) => cell(false, c)),
    })),
  ],
});
const codeBlock = (content: string): Node => ({
  type: 'block',
  format: '',
  version: 2,
  fields: { blockType: 'codeBlock', blockName: '', language: 'bash', content, showLineNumbers: true },
});
const root = (...children: Node[]): Node => ({
  root: { type: 'root', format: '', indent: 0, version: 1, direction: null, children },
});

const DIGESTS: Array<[string, string, string]> = [
  ['26.12.1', 'linux/amd64', 'sha256:fd92997c4a7197a7fad98f7b81ca2cefb879b2edab6b91d9b777ebdd74ffeae2'],
  ['26.12.1', 'linux/arm64', 'sha256:b07a08a1faa7190d1e4b5e96c9ecf0e1cf940c982acd7b0bb17a45cd5ed8eb5b'],
  ['26.12.1-dev', 'linux/amd64', 'sha256:642d9530eb3fbafdbd07589e10221d41d2f1bf6b0821d81b32f90e6a0675feeb'],
  ['26.12.1-dev', 'linux/arm64', 'sha256:b09f2209ed33d7d628fa5ec261e4e1d22a8ccb6f996a254925fd6c1e4c9041ea'],
];

const data = {
  title: 'Node.js Brotli decoder out-of-bounds write',
  slug: SLUG,
  cves: ['CVE-2026-111497'],
  technology: 'Node.js',
  cvssScore: 9.2,
  fixStatus: 'fixed',
  abstract:
    'CVE-2026-111497 (CVSS 9.2) lets a crafted Brotli stream make Node.js write out of bounds. Affected versions and the patched CleanStart Node.js image.',
  publishedAt: '2026-10-26T00:00:00.000Z',
  displayPublishedAt: '2026-10-26T00:00:00.000Z',
  body: root(
    paragraph(
      text(
        'A crafted Brotli-compressed stream can make the Brotli decoder bundled in Node.js write out of bounds, which can lead to remote code execution. Applications that decompress Brotli data from untrusted sources are at risk, including through ',
      ),
      code('fetch()'),
      text(' and '),
      code('zlib'),
      text(' Brotli APIs.'),
    ),
  ),
  impact: root(
    table(
      ['Package', 'Affected'],
      [
        [text('Node.js 26.x'), text('below 26.12.1')],
        [text('Node.js 24.x'), text('below 24.22.1')],
        [text('Node.js 22.x'), text('below 22.23.4')],
        [text('Node.js 25.x and earlier'), text('all')],
        [text('Brotli'), text('1.0.3 to 1.2.0')],
      ],
    ),
    paragraph(
      text(
        'You are affected if your container runs Node.js below 22.23.4 on the 22.x line, below 24.22.1 on 24.x, below 26.12.1 on 26.x, or any release on an end-of-life line (25.x, 23.x, 21.x, 20.x and older). The Node.js project states that end-of-life lines are always affected when a security release occurs, and they receive no upstream fix.',
      ),
    ),
  ),
  resolution: root(
    paragraph(
      text('Upgrade to '),
      code('cleanstart/node:26.12.1'),
      text(' (also tagged '),
      code('latest'),
      text('), which includes the fix. Pull by digest:'),
    ),
    table(
      ['Tag', 'Platform', 'Digest'],
      DIGESTS.map(([tag, platform, digest]) => [code(tag), text(platform), code(digest)]),
    ),
    codeBlock(`docker pull cleanstart/node@${DIGESTS[0][2]}`),
  ),
  _status: PUBLISH ? 'published' : 'draft',
};

const log = (msg: string): void => {
  // eslint-disable-next-line no-console -- script output
  console.log(msg);
};

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });
  const existing = await payload.find({
    collection: 'advisories',
    where: { slug: { equals: SLUG } },
    limit: 1,
    depth: 0,
    draft: true,
    overrideAccess: true,
  });
  if (existing.docs[0]) {
    log(`  skip     advisory ${SLUG} already exists (id ${existing.docs[0].id})`);
    return;
  }
  const doc = await payload.create({
    collection: 'advisories',
    data: data as Record<string, unknown>,
    draft: !PUBLISH,
    overrideAccess: true,
  });
  log(`  created  advisory ${SLUG} (id ${doc.id}) as ${PUBLISH ? 'published' : 'draft'}`);
  if (PUBLISH) {
    const purge = await revalidateWeb(payload, { paths: ['/advisories', `/advisories/${SLUG}`] });
    log(`  purge    web cache: ${purge.ok ? 'ok' : `failed (${purge.status ?? purge.error ?? 'disabled'})`}`);
  }
};

run()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console -- script output
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
