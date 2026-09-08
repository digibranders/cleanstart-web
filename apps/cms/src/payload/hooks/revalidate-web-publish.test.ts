import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  revalidateWebAfterDeleteHook,
  revalidateWebPublishAfterChangeHook,
} from './revalidate-web-publish';

const revalidateWeb = vi.hoisted(() => vi.fn(async () => ({ ok: true })));
vi.mock('../lib/web-revalidate', () => ({ revalidateWeb }));

const req = { payload: { logger: { warn: vi.fn() } } } as never;

/** Paths passed to revalidateWeb by the most recent hook invocation. */
const purgedPaths = (): string[] => {
  const call = revalidateWeb.mock.calls.at(-1) as unknown as [unknown, { paths?: string[] }];
  return call?.[1]?.paths ?? [];
};

/** Cache tags passed to revalidateWeb by the most recent hook invocation. */
const purgedTags = (): string[] => {
  const call = revalidateWeb.mock.calls.at(-1) as unknown as [unknown, { tags?: string[] }];
  return call?.[1]?.tags ?? [];
};

const publish = async (collection: string, slug: string): Promise<void> => {
  await revalidateWebPublishAfterChangeHook(collection)({
    doc: { _status: 'published', slug },
    previousDoc: { _status: 'draft', slug },
    req,
  } as never);
};

beforeEach(() => revalidateWeb.mockClear());
afterEach(() => vi.clearAllMocks());

describe('sitemap purge on publish', () => {
  it('purges the sitemap cache TAG, not the /sitemap.xml path', async () => {
    // The path form is useless here: sitemap.ts is a Route Handler, and on
    // Vercel revalidatePath silently no-ops on those. Only the data-cache tag
    // the route reads actually clears it.
    await publish('guides', 'go-dependency-verification');

    expect(purgedTags()).toEqual(['sitemap:guides']);
    expect(purgedPaths()).toEqual(
      expect.arrayContaining(['/guide', '/guide/go-dependency-verification']),
    );
    expect(purgedPaths()).not.toContain('/sitemap.xml');
  });

  it.each([
    ['blogs', '/blogs'],
    ['news', '/news'],
    ['resources', '/resource-center'],
    ['events', '/events'],
    ['jobs', '/careers'],
    ['authors', '/author'],
    ['knowledgeBase', '/knowledge-hub'],
    ['legalDocuments', '/legal'],
  ])('purges the sitemap tag for %s, which contributes <loc> entries', async (collection) => {
    await publish(collection, 'a-slug');

    expect(purgedTags()).toEqual([`sitemap:${collection}`]);
  });

  it.each([
    // Listing-only on the web: the sitemap entry is a hard-coded static route,
    // so publishing cannot change the URL set. These still purge their own
    // listing, so the assertion below is about the sitemap specifically and
    // not about the hook having done nothing.
    ['webinars', '/webinars'],
    ['case-studies', '/case-studies'],
  ])('purges %s own listing but not the sitemap', async (collection, listing) => {
    await publish(collection, 'a-slug');

    expect(revalidateWeb).toHaveBeenCalled();
    expect(purgedPaths()).toContain(listing);
    expect(purgedTags()).toEqual([]);
  });

  it('never fires for emailSignatures, which has no public URL at all', async () => {
    // Not merely absent from the sitemap: the collection has no ROUTE_PREFIX
    // and no listing override, so the hook finds no paths and returns early.
    // Asserted explicitly so this case cannot silently become a vacuous
    // "does not contain /sitemap.xml" pass.
    await publish('emailSignatures', 'a-slug');

    expect(revalidateWeb).not.toHaveBeenCalled();
  });

  it('purges the sitemap on delete, since the URL must stop being advertised', async () => {
    await revalidateWebAfterDeleteHook('blogs')({
      doc: { _status: 'published', slug: 'gone' },
      req,
    } as never);

    expect(purgedPaths()).toEqual(expect.arrayContaining(['/blogs', '/blogs/gone']));
    expect(purgedTags()).toEqual(['sitemap:blogs']);
  });

  it('stays silent for a draft → draft edit, which changes no live URL', async () => {
    await revalidateWebPublishAfterChangeHook('blogs')({
      doc: { _status: 'draft', slug: 'wip' },
      previousDoc: { _status: 'draft', slug: 'wip' },
      req,
    } as never);

    expect(revalidateWeb).not.toHaveBeenCalled();
  });
});
