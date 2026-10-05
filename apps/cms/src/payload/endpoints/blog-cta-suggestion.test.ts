import { describe, expect, it, vi } from 'vitest';

import { resolveSuggestion, webSuggestionUrl } from './blog-cta-suggestion';

const editor = { roles: ['editor'] };
const env = { WEB_REVALIDATE_URL: 'https://www.cleanstart.com/api/revalidate', WEB_REVALIDATE_SECRET: 's3cret' };
const answer = { ok: true, resource: { title: 'A paper', typeLabel: 'Whitepaper', slug: 'a-paper' }, image: { name: 'ollama' } };

const deps = (over: Partial<Parameters<typeof resolveSuggestion>[2]> = {}) => ({
  env,
  fetchImpl: vi.fn(async () => new Response(JSON.stringify(answer))) as unknown as typeof fetch,
  loadSlug: vi.fn(async () => 'my-post'),
  ...over,
});

describe('webSuggestionUrl', () => {
  it('points at the web route on the same origin as the revalidate URL', () => {
    expect(webSuggestionUrl(env, 'my-post')).toBe('https://www.cleanstart.com/api/blog-cta-suggestion?slug=my-post');
  });

  it('is null without the URL or the secret', () => {
    expect(webSuggestionUrl({}, 'x')).toBeNull();
    expect(webSuggestionUrl({ WEB_REVALIDATE_URL: env.WEB_REVALIDATE_URL }, 'x')).toBeNull();
    expect(webSuggestionUrl({ WEB_REVALIDATE_URL: 'not a url', WEB_REVALIDATE_SECRET: 's' }, 'x')).toBeNull();
  });
});

describe('resolveSuggestion', () => {
  it('rejects anonymous users and users without an editing role', async () => {
    expect((await resolveSuggestion(null, '1', deps())).status).toBe(401);
    expect((await resolveSuggestion({ roles: ['hr'] }, '1', deps())).status).toBe(403);
  });

  it('rejects an id that is not a positive integer', async () => {
    expect((await resolveSuggestion(editor, 'abc', deps())).status).toBe(400);
    expect((await resolveSuggestion(editor, null, deps())).status).toBe(400);
    expect((await resolveSuggestion(editor, '-3', deps())).status).toBe(400);
  });

  it('is 404 when the post does not exist', async () => {
    expect((await resolveSuggestion(editor, '1', deps({ loadSlug: async () => null }))).status).toBe(404);
  });

  it('asks the web app with the secret and returns its pick', async () => {
    const d = deps();
    const out = await resolveSuggestion(editor, '88', d);
    expect(out).toEqual({ status: 200, body: { ok: true, available: true, resource: answer.resource, image: answer.image } });
    const call = (d.fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(call[0]).toBe('https://www.cleanstart.com/api/blog-cta-suggestion?slug=my-post');
    expect((call[1].headers as Record<string, string>).authorization).toBe('Bearer s3cret');
  });

  it('says "not available" rather than failing when the web app is not configured, errors, or answers badly', async () => {
    const soft = (reason: string) => ({ status: 200, body: { ok: true, available: false, reason } });
    expect(await resolveSuggestion(editor, '1', deps({ env: {} }))).toEqual(soft('web_not_configured'));
    expect(
      await resolveSuggestion(editor, '1', deps({ fetchImpl: (async () => new Response('no', { status: 500 })) as typeof fetch })),
    ).toEqual(soft('web_unavailable'));
    expect(
      await resolveSuggestion(editor, '1', deps({ fetchImpl: (async () => new Response('{"ok":false}')) as typeof fetch })),
    ).toEqual(soft('web_unavailable'));
    expect(
      await resolveSuggestion(editor, '1', deps({ fetchImpl: (async () => { throw new Error('timeout'); }) as typeof fetch })),
    ).toEqual(soft('web_unavailable'));
  });
});
