#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: fix external and internal links flagged by the Nov 2026 technical
 * SEO audit, in the rich-text body of published docs.
 *
 *  - 9 links marked rel=nofollow that are first-party or editorial citations
 *    become rel=follow (the sibling links in the same articles already are).
 *  - A legal agreement link to /legal (a 308) points at its final page.
 *  - A moved Trend Micro URL and three NVD URLs (one carried utm_source=chatgpt.com,
 *    the others had upper-case CVE ids that 301 to lower case) point at the final URL.
 *
 * Only the `url` and `rel` of a matching link node change. Link text and every
 * other node are left as they are. A doc whose newest version is an unpublished
 * draft is skipped, so an editor's work in progress is never published by this.
 *
 * The publish hook defers its web purge on an unref'd timer that dies with
 * process.exit, so the purge is sent here directly after each write.
 *
 * In the prod container (env is in the process, there is no .env):
 *   /app/node_modules/.bin/tsx scripts/fix-article-links-nov-2026.ts --dry-run
 *   /app/node_modules/.bin/tsx scripts/fix-article-links-nov-2026.ts
 */
import { getPayload } from 'payload';

import { revalidateWeb } from '../src/payload/lib/web-revalidate.ts';
import payloadConfig from '../src/payload.config.ts';

type Collection = 'blogs' | 'news' | 'legalDocuments';

interface LinkEdit {
  collection: Collection;
  slug: string;
  url: string;
  newUrl?: string;
  rel?: 'follow';
}

const NOFOLLOW_TO_FOLLOW: Array<[Collection, string, string]> = [
  ['blogs', 'php2shell-what-you-need-to-know-about-two-critical-php-vulnerabilities', 'https://images.cleanstart.com/images/drupal/details'],
  ['blogs', 'official-redis-image-vs-cleanstart-redis-image', 'https://hub.docker.com/layers/library/redis/8.10/images/sha256-4a81ac268fb0cad305f0654ec80047bb018b9d2b411ec2d1d428ee1b841dfc9c'],
  ['blogs', 'eu-cyber-resilience-act-cra-what-manufacturers-must-report-by-11-september-2026', 'https://digital-strategy.ec.europa.eu/en/policies/cra-reporting'],
  ['blogs', 'official-go-docker-image-vs-cleanstart-hardened-go-image', 'https://hub.docker.com/r/cleanstart/go?tag=1.26.5'],
  ['blogs', 'what-is-a-cve-the-naming-system-behind-every-vulnerability', 'https://www.cve.org/ProgramOrganization/CNAs'],
  ['blogs', 'what-is-a-cve-the-naming-system-behind-every-vulnerability', 'https://nvd.nist.gov/'],
  ['news', 'cleanstart-expands-middle-east-operations-as-demand-grows', 'https://www.linkedin.com/in/vijendra-katiyar-55456ba/'],
  ['news', 'cleanstart-expands-middle-east-operations-as-demand-grows', 'https://www.linkedin.com/in/abdul-rahaman-mohammad-110820194/'],
  ['news', 'cleanstart-expands-middle-east-operations-as-demand-grows', 'https://gulfitglobal.com/'],
];

const EDITS: LinkEdit[] = [
  ...NOFOLLOW_TO_FOLLOW.map(([collection, slug, url]): LinkEdit => ({ collection, slug, url, rel: 'follow' })),
  {
    collection: 'legalDocuments',
    slug: 'master-service-and-license-agreement',
    url: 'https://www.cleanstart.com/legal',
    newUrl: 'https://www.cleanstart.com/legal/additional-third-party-terms',
  },
  {
    collection: 'blogs',
    slug: 'why-you-cannot-trust-prebuilt-container-images-from-official-registries',
    url: 'https://www.trendmicro.com/vinfo/us/security/news/virtualization-and-cloud/exposed-container-registries-a-potential-vector-for-supply-chain-attacks',
    newUrl: 'https://www.trendaisecurity.com/en-us/resources-insights/deep-research/exposed-container-registries-a-potential-vector-for-supply-chain-attacks',
  },
  {
    collection: 'blogs',
    slug: 'http2shell-cve-2026-111497',
    url: 'https://nvd.nist.gov/vuln/detail/CVE-2026-111497?utm_source=chatgpt.com',
    newUrl: 'https://nvd.nist.gov/vuln/detail/cve-2026-111497',
  },
  {
    collection: 'blogs',
    slug: 'ai-infrastructure-security-gitlab-ai-gateway-vulnerability',
    url: 'https://nvd.nist.gov/vuln/detail/CVE-2026-1868',
    newUrl: 'https://nvd.nist.gov/vuln/detail/cve-2026-1868',
  },
  {
    collection: 'blogs',
    slug: 'nginx-rift-exposes',
    url: 'https://nvd.nist.gov/vuln/detail/CVE-2026-42945',
    newUrl: 'https://nvd.nist.gov/vuln/detail/cve-2026-42945',
  },
];

const WEB_PATH_PREFIX: Record<Collection, string> = {
  blogs: '/blogs',
  news: '/news',
  legalDocuments: '/legal',
};

const DRY_RUN = process.argv.slice(2).includes('--dry-run');

const log = (msg: string): void => {
  // eslint-disable-next-line no-console -- script output
  console.log(msg);
};

interface LinkNode {
  type?: string;
  fields?: { url?: string; rel?: string };
  [key: string]: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const collectLinks = (node: unknown, out: LinkNode[]): void => {
  if (Array.isArray(node)) {
    node.forEach((child) => collectLinks(child, out));
    return;
  }
  if (!isRecord(node)) return;
  if ((node.type === 'link' || node.type === 'autolink') && isRecord(node.fields)) out.push(node as LinkNode);
  Object.values(node).forEach((child) => collectLinks(child, out));
};

interface Doc {
  id: number | string;
  slug?: string;
  _status?: string;
  body?: unknown;
}

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });
  log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'WRITE'}\n`);

  const groups = new Map<string, LinkEdit[]>();
  for (const edit of EDITS) {
    const key = `${edit.collection}|${edit.slug}`;
    groups.set(key, [...(groups.get(key) ?? []), edit]);
  }

  let missing = 0;
  for (const [key, edits] of groups) {
    const [collection, slug] = key.split('|') as [Collection, string];
    const found = await payload.find({
      collection,
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const doc = found.docs[0] as Doc | undefined;
    if (!doc) {
      log(`MISSING  ${collection}/${slug}`);
      missing += 1;
      continue;
    }

    const newest = await payload.findVersions({
      collection,
      where: { parent: { equals: doc.id } },
      sort: '-updatedAt',
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const newestStatus = (newest.docs[0] as { version?: { _status?: string } } | undefined)?.version?._status;
    log(`${collection}/${slug} (id ${doc.id}, status ${doc._status}, newest version ${newestStatus ?? 'unknown'})`);
    if (doc._status !== 'published' || newestStatus === 'draft') {
      log('  SKIP     doc has an unpublished draft or is not published');
      missing += 1;
      continue;
    }

    const links: LinkNode[] = [];
    collectLinks(doc.body, links);
    let changed = 0;
    for (const edit of edits) {
      const matches = links.filter((link) => link.fields?.url === edit.url);
      if (matches.length === 0) {
        log(`  MISSING  link ${edit.url}`);
        missing += 1;
        continue;
      }
      for (const link of matches) {
        const fields = link.fields as { url?: string; rel?: string };
        const before = `rel=${fields.rel ?? '-'} url=${fields.url}`;
        if (edit.newUrl) fields.url = edit.newUrl;
        if (edit.rel) fields.rel = edit.rel;
        log(`  ${DRY_RUN ? 'would   ' : 'edit    '} ${before}\n           -> rel=${fields.rel ?? '-'} url=${fields.url}`);
        changed += 1;
      }
    }

    if (DRY_RUN || changed === 0) continue;

    await payload.update({
      collection,
      id: doc.id,
      data: { body: doc.body, _status: 'published' } as Record<string, unknown>,
      overrideAccess: true,
    });
    const purge = await revalidateWeb(payload, { paths: [`${WEB_PATH_PREFIX[collection]}/${slug}`] });
    log(`  updated  ${changed} link(s); purge ${purge.ok ? 'ok' : `failed (${purge.status ?? purge.error ?? 'disabled'})`}`);
  }

  log(`\nDone. ${groups.size} docs, ${missing} problem(s).`);
  if (missing > 0) process.exitCode = 1;
};

run()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console -- script output
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
