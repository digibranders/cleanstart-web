#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: publish a copy of a blog post as a security advisory.
 *
 * The first advisory (PHP2Shell, 2026-10-23) already ran as a blog post, so the
 * advisory reuses its title, slug, abstract, hero image, body, FAQs, authors,
 * reviewer and SEO fields, and keeps the blog's publish date. The blog post is
 * left untouched. Skips if an advisory with the slug already exists.
 *
 * The publish hook defers its web purge on an unref'd timer and this script
 * exits before it fires, so the purge is sent here once the create returns.
 *
 * Local:   pnpm exec tsx --env-file=.env scripts/copy-blog-to-advisory.ts --dry-run
 * In the prod container (env is in the process, there is no .env):
 *   /app/node_modules/.bin/tsx scripts/copy-blog-to-advisory.ts --dry-run
 *   /app/node_modules/.bin/tsx scripts/copy-blog-to-advisory.ts
 * Pass `--slug <blog-slug>` to copy a different post.
 */
import { getPayload } from 'payload';

import { revalidateWeb } from '../src/payload/lib/web-revalidate.ts';
import payloadConfig from '../src/payload.config.ts';

const DEFAULT_SLUG = 'php2shell-what-you-need-to-know-about-two-critical-php-vulnerabilities';

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const slugFlag = argv.indexOf('--slug');
const SLUG = slugFlag >= 0 ? argv[slugFlag + 1] : DEFAULT_SLUG;

const log = (msg: string): void => {
  // eslint-disable-next-line no-console -- script output
  console.log(msg);
};

/** Fields an advisory shares with a blog post. Everything else is blog-only or derived. */
const COPIED_FIELDS = [
  'title',
  'abstract',
  'heroImage',
  'body',
  'faqs',
  'authors',
  'reviewedBy',
  'lastReviewedAt',
  'schemaAddons',
  'publishedAt',
  'displayPublishedAt',
  'tocDepth',
  'seo',
] as const;

/** Array-row ids belong to the blog's own rows; the advisory gets fresh ones. */
const stripRowIds = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((row) => {
      if (row === null || typeof row !== 'object') return row;
      const { id: _id, ...rest } = row as Record<string, unknown>;
      return Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, stripRowIds(v)]));
    });
  }
  if (value !== null && typeof value === 'object' && !('root' in value)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, stripRowIds(v)]),
    );
  }
  return value;
};

const run = async (): Promise<void> => {
  if (!SLUG) throw new Error('--slug needs a value');
  const payload = await getPayload({ config: payloadConfig });
  log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'WRITE'}\n`);

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

  const found = await payload.find({
    collection: 'blogs',
    where: { slug: { equals: SLUG }, _status: { equals: 'published' } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const blog = found.docs[0] as Record<string, unknown> | undefined;
  if (!blog) throw new Error(`Published blog ${SLUG} not found`);
  log(`  blog     ${SLUG} (id ${String(blog.id)}, published ${String(blog.publishedAt)})`);

  const data: Record<string, unknown> = { slug: SLUG, _status: 'published' };
  for (const field of COPIED_FIELDS) {
    if (blog[field] !== undefined && blog[field] !== null) data[field] = stripRowIds(blog[field]);
  }

  if (DRY_RUN) {
    log(`  would create advisory with: ${Object.keys(data).join(', ')}`);
    return;
  }

  const advisory = await payload.create({
    collection: 'advisories',
    data: data as Record<string, unknown>,
    overrideAccess: true,
  });
  log(`  created  advisory ${SLUG} (id ${advisory.id}), published`);

  const purge = await revalidateWeb(payload, {
    paths: [`/advisories/${SLUG}`, '/advisories'],
  });
  log(`  purge    web cache: ${purge.ok ? 'ok' : `failed (${purge.status ?? purge.error ?? 'disabled'})`}`);
};

run()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console -- script output
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
