import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const verifyTurnstileToken = vi.fn();
const sendBrevoEmail = vi.fn();

vi.mock('../lib/turnstile', () => ({
  verifyTurnstileToken: (...a: unknown[]) => verifyTurnstileToken(...a),
}));
vi.mock('../lib/email/brevo', () => ({
  sendBrevoEmail: (...a: unknown[]) => sendBrevoEmail(...a),
}));

import {
  CAREERS_MAX_BYTES,
  careersApplyEndpoint,
  careersApplyOptionsEndpoint,
} from './careers-apply';

const ALLOWED = 'https://cleanstart.com';

let ipCounter = 0;
const nextIp = (): string => `192.0.2.${++ipCounter}`;

const pdf = (size = 1024): File =>
  new File([new Uint8Array(size)], 'resume.pdf', { type: 'application/pdf' });

const baseFields: Record<string, string> = {
  jobSlug: 'senior-engineer',
  firstName: 'Dana',
  lastName: 'Lee',
  email: 'dana@example.com',
};

const buildForm = (
  fields: Record<string, string> = baseFields,
  resume: File | null = pdf(),
  extra?: (f: FormData) => void,
): FormData => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  if (resume) f.set('resume', resume);
  extra?.(f);
  return f;
};

const openJob = {
  id: 5,
  title: 'Senior Engineer',
  slug: 'senior-engineer',
  _status: 'published',
  hiringStatus: 'open',
  source: 'cms',
  remote: true,
  locations: [],
};

const makeReq = ({
  origin = ALLOWED,
  headers = {},
  form,
  formThrows = false,
  job = openJob,
  resumeCreateThrows = false,
  appCreateThrows = false,
}: {
  origin?: string | null;
  headers?: Record<string, string>;
  form?: FormData;
  formThrows?: boolean;
  job?: unknown;
  resumeCreateThrows?: boolean;
  appCreateThrows?: boolean;
}) => {
  const h = new Headers({ 'cf-connecting-ip': nextIp(), ...headers });
  if (origin != null) h.set('origin', origin);

  const create = vi.fn().mockImplementation(async ({ collection }: { collection: string }) => {
    if (collection === 'resumes') {
      if (resumeCreateThrows) throw new Error('r2 down');
      return { id: 99 };
    }
    if (collection === 'career-applications' && appCreateThrows) throw new Error('db down');
    return { id: 1 };
  });

  return {
    url: 'http://localhost/api/career-applications/apply',
    headers: h,
    formData: formThrows
      ? async () => { throw new Error('bad multipart'); }
      : async () => form ?? buildForm(),
    payload: {
      find: vi.fn().mockResolvedValue({ docs: job ? [job] : [] }),
      create,
      findGlobal: vi.fn().mockResolvedValue({ policyVersion: 'v3' }),
      delete: vi.fn().mockResolvedValue({ id: 99 }),
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    },
  };
};

const runPost = (req: unknown): Promise<Response> =>
  (careersApplyEndpoint.handler as (r: unknown) => Promise<Response>)(req);
const runOptions = (req: unknown): Promise<Response> =>
  (careersApplyOptionsEndpoint.handler as (r: unknown) => Promise<Response>)(req);

beforeEach(() => {
  verifyTurnstileToken.mockResolvedValue({ ok: true });
  sendBrevoEmail.mockResolvedValue({ status: 'sent', messageId: 'm-1' });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('careersApplyOptionsEndpoint', () => {
  it('204s for an allowed origin, 403s otherwise', async () => {
    expect((await runOptions(makeReq({}))).status).toBe(204);
    expect((await runOptions(makeReq({ origin: 'https://evil.example' }))).status).toBe(403);
  });
});

describe('careersApplyEndpoint', () => {
  it('rejects a disallowed origin with 403', async () => {
    expect((await runPost(makeReq({ origin: 'https://evil.example' }))).status).toBe(403);
  });

  it('rejects an over-limit content-length with 413', async () => {
    const res = await runPost(makeReq({ headers: { 'content-length': String(CAREERS_MAX_BYTES + 1) } }));
    expect(res.status).toBe(413);
  });

  it('rejects an unparseable multipart body with 400', async () => {
    expect((await runPost(makeReq({ formThrows: true }))).status).toBe(400);
  });

  it('rejects invalid consent JSON with 400', async () => {
    const form = buildForm(baseFields, pdf(), (f) => f.set('consent', '{not-json'));
    const res = await runPost(makeReq({ form }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'invalid_consent' });
  });

  it('rejects a schema-invalid body with 400', async () => {
    const res = await runPost(makeReq({ form: buildForm({ jobSlug: 'x' }) }));
    expect(res.status).toBe(400);
  });

  it('honeypot: returns 200 without touching uploads or email', async () => {
    const form = buildForm({ ...baseFields, website: 'spam' });
    const req = makeReq({ form });
    const res = await runPost(req);
    expect(res.status).toBe(200);
    expect(req.payload.create).not.toHaveBeenCalled();
    expect(sendBrevoEmail).not.toHaveBeenCalled();
  });

  it('requires a resume file', async () => {
    const res = await runPost(makeReq({ form: buildForm(baseFields, null) }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'resume_required' });
  });

  it('rejects an unsupported resume mime type', async () => {
    const bad = new File([new Uint8Array(16)], 'r.txt', { type: 'text/plain' });
    const res = await runPost(makeReq({ form: buildForm(baseFields, bad) }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'resume_type_unsupported' });
  });

  it('rejects an over-sized resume', async () => {
    const big = new File([new Uint8Array(11 * 1024 * 1024)], 'big.pdf', { type: 'application/pdf' });
    const res = await runPost(makeReq({ form: buildForm(baseFields, big) }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'resume_too_large' });
  });

  it('rejects a failed Turnstile challenge with 403', async () => {
    verifyTurnstileToken.mockResolvedValue({ ok: false, reason: 'bad' });
    expect((await runPost(makeReq({}))).status).toBe(403);
  });

  it('rejects an unpublished/closed/non-cms job with invalid_job', async () => {
    const closed = { ...openJob, hiringStatus: 'closed' };
    const res = await runPost(makeReq({ job: closed }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'invalid_job' });

    const missing = await runPost(makeReq({ job: null }));
    expect(missing.status).toBe(400);
  });

  it('happy path: uploads resume, emails HR, creates the application row', async () => {
    process.env.CAREERS_HR_EMAIL = 'hr@cleanstart.com';
    const req = makeReq({});
    const res = await runPost(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(req.payload.create).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'resumes' }),
    );
    expect(sendBrevoEmail).toHaveBeenCalledTimes(1);
    expect(req.payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'career-applications',
        data: expect.objectContaining({ job: 5, resume: 99, turnstilePassed: true }),
      }),
    );
    process.env.CAREERS_HR_EMAIL = '';
  });

  it('returns 502 when the resume upload fails', async () => {
    const res = await runPost(makeReq({ resumeCreateThrows: true }));
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ error: 'capture_failed' });
  });

  it('returns 502 and rolls back the resume when the application create fails', async () => {
    const req = makeReq({ appCreateThrows: true });
    const res = await runPost(req);
    expect(res.status).toBe(502);
    expect(req.payload.delete).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'resumes', id: 99 }),
    );
  });
});
