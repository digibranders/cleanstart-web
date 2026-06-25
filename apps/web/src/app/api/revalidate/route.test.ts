import { afterEach, describe, expect, it, vi } from 'vitest';

const { revalidatePath, revalidateTag } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath, revalidateTag }));

import { POST } from './route';

const post = (body: unknown) =>
  POST(
    new Request('https://web.test/api/revalidate', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer s3cret' },
      body: JSON.stringify(body),
    }) as never,
  );

describe('POST /api/revalidate layoutPaths', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('revalidates layoutPaths with the "layout" type', async () => {
    vi.stubEnv('WEB_REVALIDATE_SECRET', 's3cret');
    const res = await post({ layoutPaths: ['/'] });

    expect(res.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });

  it('ignores non-string / non-slash layoutPaths', async () => {
    vi.stubEnv('WEB_REVALIDATE_SECRET', 's3cret');
    await post({ layoutPaths: ['no-slash', 42, '/ok'] });

    expect(revalidatePath).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledWith('/ok', 'layout');
  });
});
