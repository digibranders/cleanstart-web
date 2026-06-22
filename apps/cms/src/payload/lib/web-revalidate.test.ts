import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { revalidateWeb } from './web-revalidate';

type PayloadArg = Parameters<typeof revalidateWeb>[0];

const fakePayload = (): PayloadArg =>
  ({ logger: { info: vi.fn(), warn: vi.fn() } }) as unknown as PayloadArg;

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 200 })));
  vi.stubEnv('WEB_REVALIDATE_URL', 'https://web.example.com/api/revalidate');
  vi.stubEnv('WEB_REVALIDATE_SECRET', 'shh');
  vi.stubEnv('WEB_REVALIDATE_SUPPRESS', '');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('revalidateWeb', () => {
  it('posts to apps/web when URL + secret are set', async () => {
    const payload = fakePayload();
    await revalidateWeb(payload, { paths: ['/blogs'] });

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] ?? [];
    expect(url).toBe('https://web.example.com/api/revalidate');
    expect((init as { headers: Record<string, string> }).headers.authorization).toBe(
      'Bearer shh',
    );
  });

  it('no-ops when WEB_REVALIDATE_SUPPRESS=true even with URL + secret set', async () => {
    vi.stubEnv('WEB_REVALIDATE_SUPPRESS', 'true');
    const payload = fakePayload();

    await revalidateWeb(payload, { paths: ['/blogs', '/blogs/my-post'] });

    expect(fetch).not.toHaveBeenCalled();
  });

  it('no-ops when the URL/secret are unset', async () => {
    vi.stubEnv('WEB_REVALIDATE_URL', '');
    vi.stubEnv('WEB_REVALIDATE_SECRET', '');
    const payload = fakePayload();

    await revalidateWeb(payload, { paths: ['/blogs'] });

    expect(fetch).not.toHaveBeenCalled();
  });

  it('no-ops when there are no paths or tags to revalidate', async () => {
    const payload = fakePayload();
    await revalidateWeb(payload, {});

    expect(fetch).not.toHaveBeenCalled();
  });
});
