import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/turnstile', () => ({
  verifyTurnstileToken: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock('../lib/lead-handlers/registry', () => ({
  submitLead: vi.fn().mockResolvedValue({ ok: true, duplicateOfLeadId: null, secondaries: [] }),
}));

vi.mock('../lib/lead-fallback-queue', () => ({
  parkSubmission: vi.fn().mockResolvedValue({ ok: true, key: 'k', sink: 'r2' }),
}));

import {
  LEAD_SUBMIT_MAX_BYTES,
  submitLeadEndpoint,
  submitLeadOptionsEndpoint,
} from './submit-lead';
import { __resetRateLimitStore } from '../lib/rate-limit';
import { verifyTurnstileToken } from '../lib/turnstile';

type FakeHeaders = { get: (name: string) => string | null };

const makeHeaders = (entries: Record<string, string | undefined>): FakeHeaders => ({
  get: (name: string) => entries[name.toLowerCase()] ?? null,
});

const SEEDED_FORM = {
  id: 7,
  _status: 'published',
  slug: 'book-a-demo',
  schemaVersion: 1,
  fields: [{ name: 'email', type: 'email', required: true }],
};

const fakePayload = {
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  findByID: vi.fn().mockResolvedValue({ _status: 'published', fields: [] }),
  // `forms` lookups resolve a slug to the seeded row; every other collection
  // (e.g. webhook destinations queried by dispatchEvent) resolves empty.
  find: vi.fn(async ({ collection }: { collection: string }) =>
    collection === 'forms' ? { docs: [SEEDED_FORM] } : { docs: [] },
  ),
  create: vi.fn().mockResolvedValue({ id: 99 }),
  findGlobal: vi.fn().mockResolvedValue({ policyVersion: '2026-06-01' }),
};

const ORIGINAL_ALLOWED = process.env.LEAD_SUBMIT_ALLOWED_ORIGINS;

beforeEach(() => {
  Reflect.deleteProperty(process.env, 'LEAD_SUBMIT_ALLOWED_ORIGINS');
  __resetRateLimitStore();
  fakePayload.logger.info.mockClear();
  fakePayload.logger.warn.mockClear();
  fakePayload.logger.error.mockClear();
  fakePayload.findByID.mockClear();
});

afterEach(() => {
  if (ORIGINAL_ALLOWED == null) {
    Reflect.deleteProperty(process.env, 'LEAD_SUBMIT_ALLOWED_ORIGINS');
  } else {
    process.env.LEAD_SUBMIT_ALLOWED_ORIGINS = ORIGINAL_ALLOWED;
  }
});

const optionsHandler = submitLeadOptionsEndpoint.handler;
const postHandler = submitLeadEndpoint.handler;
if (!optionsHandler || !postHandler) throw new Error('endpoint handlers undefined');

const callOptions = async (origin: string | undefined): Promise<Response> => {
  const req = {
    headers: makeHeaders({ origin }),
    payload: fakePayload,
  } as unknown as Parameters<typeof optionsHandler>[0];
  const result = await optionsHandler(req);
  return result as Response;
};

const callPost = async (init: {
  headers: Record<string, string | undefined>;
  body?: string;
}): Promise<Response> => {
  const bodyText = init.body;
  const req = {
    headers: makeHeaders(init.headers),
    payload: fakePayload,
    url: 'http://internal/api/leads/submit',
    json: bodyText != null ? () => Promise.resolve(JSON.parse(bodyText)) : undefined,
    arrayBuffer:
      bodyText != null
        ? () => Promise.resolve(new TextEncoder().encode(bodyText).buffer as ArrayBuffer)
        : () => Promise.resolve(new ArrayBuffer(0)),
  } as unknown as Parameters<typeof postHandler>[0];
  const result = await postHandler(req);
  return result as Response;
};

describe('OPTIONS /submit (CORS preflight)', () => {
  it('rejects disallowed origins with 403', async () => {
    const res = await callOptions('https://evil.example');
    expect(res.status).toBe(403);
  });

  it('rejects requests with no Origin header (no preflight from non-browsers)', async () => {
    const res = await callOptions(undefined);
    expect(res.status).toBe(403);
  });

  it('returns 204 with echoed origin + CORS headers for allowed origin', async () => {
    const res = await callOptions('https://cleanstart.com');
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('https://cleanstart.com');
    expect(res.headers.get('access-control-allow-methods')).toContain('POST');
    expect(res.headers.get('vary')).toBe('Origin');
  });

  it('respects LEAD_SUBMIT_ALLOWED_ORIGINS override', async () => {
    process.env.LEAD_SUBMIT_ALLOWED_ORIGINS = 'https://staging.cleanstart.com';
    const res = await callOptions('https://staging.cleanstart.com');
    expect(res.status).toBe(204);
    const denied = await callOptions('https://cleanstart.com');
    expect(denied.status).toBe(403);
  });
});

describe('POST /submit body-size guard (W-D-12)', () => {
  it('returns 413 when Content-Length exceeds the cap', async () => {
    const res = await callPost({
      headers: {
        origin: 'https://cleanstart.com',
        'content-length': String(LEAD_SUBMIT_MAX_BYTES + 1),
      },
      body: '{}',
    });
    expect(res.status).toBe(413);
    const json = (await res.json()) as { error: string; limit: number };
    expect(json.error).toBe('payload_too_large');
    expect(json.limit).toBe(LEAD_SUBMIT_MAX_BYTES);
  });

  it('rejects oversized chunked bodies (no Content-Length) via arrayBuffer fallback', async () => {
    const big = JSON.stringify({ pad: 'x'.repeat(LEAD_SUBMIT_MAX_BYTES + 100) });
    const res = await callPost({
      headers: { origin: 'https://cleanstart.com' },
      body: big,
    });
    expect(res.status).toBe(413);
  });

  it('does not consume rate-limit quota on a 413 (header-only abuse)', async () => {
    // Burn perMinute quota with small valid Content-Length values would consume it.
    // Instead: submit 50 oversized requests, then verify a small valid request still works.
    for (let i = 0; i < 50; i += 1) {
      await callPost({
        headers: {
          origin: 'https://cleanstart.com',
          'content-length': String(LEAD_SUBMIT_MAX_BYTES + 1),
        },
        body: '{}',
      });
    }
    // A subsequent legit submit should not be rate-limited (it'll fail
    // for other reasons — invalid form id, missing turnstile etc — but
    // the status must not be 429).
    const res = await callPost({
      headers: { origin: 'https://cleanstart.com', 'content-length': '2' },
      body: '{}',
    });
    expect(res.status).not.toBe(429);
  });

  it('returns 400 when Content-Length is malformed', async () => {
    const res = await callPost({
      headers: { origin: 'https://cleanstart.com', 'content-length': 'banana' },
      body: '{}',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /submit CORS allow-list (W-D-13)', () => {
  it('rejects disallowed cross-origin POSTs with 403', async () => {
    const res = await callPost({
      headers: { origin: 'https://evil.example', 'content-length': '2' },
      body: '{}',
    });
    expect(res.status).toBe(403);
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe('origin_forbidden');
  });

  it('allows requests with no Origin header (server-to-server)', async () => {
    // No origin = not a browser cross-origin request; must not be rejected
    // by the allow-list (status will be 400 or 200 from later checks).
    const res = await callPost({
      headers: { 'content-length': '2' },
      body: '{}',
    });
    expect(res.status).not.toBe(403);
  });

  it('echoes origin in response headers for allowed origins', async () => {
    const res = await callPost({
      headers: { origin: 'https://www.cleanstart.com', 'content-length': '2' },
      body: '{}',
    });
    expect(res.headers.get('access-control-allow-origin')).toBe('https://www.cleanstart.com');
  });
});

describe('POST /submit form resolution by slug', () => {
  const submit = (body: Record<string, unknown>): Promise<Response> =>
    callPost({ headers: { origin: 'https://cleanstart.com' }, body: JSON.stringify(body) });

  it('resolves a published form by slug and accepts the submission', async () => {
    const res = await submit({
      formSlug: 'book-a-demo',
      fields: { email: 'cto@acme.com' },
      turnstileToken: 'tok',
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean };
    expect(json.ok).toBe(true);
    // Slug path goes through find(), not findByID().
    expect(fakePayload.find).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'forms', where: { slug: { equals: 'book-a-demo' } } }),
    );
  });

  it('rejects a body with neither formId nor formSlug as invalid_body', async () => {
    const res = await submit({ fields: { email: 'a@b.com' }, turnstileToken: 'tok' });
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe('invalid_body');
  });

  it('returns invalid_form when the slug matches no published form', async () => {
    fakePayload.find.mockResolvedValueOnce({ docs: [] });
    const res = await submit({
      formSlug: 'does-not-exist',
      fields: { email: 'a@b.com' },
      turnstileToken: 'tok',
    });
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe('invalid_form');
  });

  it('skips Turnstile verification for the exempt newsletter form', async () => {
    vi.mocked(verifyTurnstileToken).mockClear();
    fakePayload.find.mockResolvedValueOnce({
      docs: [{ ...SEEDED_FORM, slug: 'newsletter', fields: [] }],
    });
    // No turnstileToken sent — would 403 for a non-exempt form.
    const res = await submit({ formSlug: 'newsletter', fields: { email: 'a@b.com' } });
    expect(res.status).toBe(200);
    expect(verifyTurnstileToken).not.toHaveBeenCalled();
  });
});
