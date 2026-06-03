import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { getPayload, type Payload, type SanitizedConfig } from 'payload';

/**
 * The Playwright runner process (which executes this spec's seeding via the
 * Payload local API) does not inherit the CMS `.env` the way the spawned
 * Next.js dev server does. Load it here — mirroring the repo's
 * `node --env-file=.env` script convention — before the Payload config is
 * imported, so `requireEnv('PAYLOAD_SECRET')` / `DATABASE_URI` resolve.
 */
const loadCmsEnv = (): void => {
  const envPath = fileURLToPath(new URL('../../.env', import.meta.url));
  if (existsSync(envPath)) process.loadEnvFile(envPath);
};

/**
 * Phase J — Careers application capture.
 *
 * Exercises the public /api/career-applications/apply endpoint end-to-end:
 *   - A multipart submission against a published, OPEN, CMS-native job stores
 *     a `resumes` row and a linked `career-applications` row, returns
 *     `{ ok: true }` (200), and records the HR-email delivery result.
 *   - A submission against a PAUSED job (or any non-open / non-CMS posting)
 *     is rejected with `invalid_job` (400) and writes nothing.
 *
 * Seeding uses the Payload local API against the same Postgres the dev/CI
 * server is bound to (the spec process and the webServer share `DATABASE_URI`).
 * Turnstile passes because the local/CI env uses Cloudflare's always-pass test
 * secret (`1x000…`); the endpoint's verifier short-circuits on it.
 *
 * `emailDelivery.status` is `skipped` when no HR recipient / Brevo key is
 * configured in the test env (the default), or `synced` when one is.
 */
test.describe('@phase-j-careers', () => {
  let payload: Payload;
  let openJobId: number;
  let pausedJobId: number;
  const openSlug = `e2e-careers-open-${Date.now()}`;
  const pausedSlug = `e2e-careers-paused-${Date.now()}`;
  const createdResumeIds: number[] = [];
  const createdApplicationIds: number[] = [];

  // A minimal but structurally-valid single-page PDF. Payload's upload guard
  // (`validatePDF`) requires the `%PDF-` header plus both an `xref` table and a
  // `%%EOF` marker in the trailing 1 KB, so the fixture carries a real xref.
  const pdfBuffer = Buffer.from(
    '%PDF-1.4\n' +
      '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
      '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
      '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\n' +
      'xref\n0 4\n' +
      '0000000000 65535 f \n' +
      '0000000009 00000 n \n' +
      '0000000052 00000 n \n' +
      '0000000101 00000 n \n' +
      'trailer<</Size 4/Root 1 0 R>>\nstartxref\n164\n%%EOF\n',
    'latin1',
  );

  test.beforeAll(async () => {
    loadCmsEnv();
    const { default: config } = (await import('@payload-config')) as {
      default: Promise<SanitizedConfig> | SanitizedConfig;
    };
    payload = await getPayload({ config });

    const openJob = await payload.create({
      collection: 'jobs',
      data: {
        title: 'E2E Careers — Senior Platform Engineer',
        slug: openSlug,
        source: 'cms',
        hiringStatus: 'open',
        _status: 'published',
      },
      overrideAccess: true,
    });
    openJobId = openJob.id;

    const pausedJob = await payload.create({
      collection: 'jobs',
      data: {
        title: 'E2E Careers — Paused Role',
        slug: pausedSlug,
        source: 'cms',
        hiringStatus: 'paused',
        _status: 'published',
      },
      overrideAccess: true,
    });
    pausedJobId = pausedJob.id;
  });

  test.afterAll(async () => {
    for (const id of createdApplicationIds) {
      await payload
        .delete({ collection: 'career-applications', id, overrideAccess: true })
        .catch(() => undefined);
    }
    for (const id of createdResumeIds) {
      await payload.delete({ collection: 'resumes', id, overrideAccess: true }).catch(() => undefined);
    }
    await payload.delete({ collection: 'jobs', id: openJobId, overrideAccess: true }).catch(() => undefined);
    await payload
      .delete({ collection: 'jobs', id: pausedJobId, overrideAccess: true })
      .catch(() => undefined);
  });

  test('apply to an open CMS job stores resume + linked application and returns ok', async ({
    request,
  }) => {
    const email = `e2e-applicant-${Date.now()}@example.com`;

    const res = await request.post('/api/career-applications/apply', {
      multipart: {
        jobSlug: openSlug,
        firstName: 'Ada',
        lastName: 'Lovelace',
        email,
        phone: '+1-202-555-0100',
        turnstileToken: 'test-token',
        resume: {
          name: 'resume.pdf',
          mimeType: 'application/pdf',
          buffer: pdfBuffer,
        },
      },
    });

    expect(res.status()).toBe(200);
    const body = (await res.json()) as { ok: boolean; error?: string };
    expect(body.ok).toBe(true);

    // A career-applications row was created for this submission and linked to the job.
    const apps = await payload.find({
      collection: 'career-applications',
      where: { email: { equals: email } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    });
    expect(apps.docs).toHaveLength(1);
    const application = apps.docs[0];
    expect(application).toBeDefined();
    createdApplicationIds.push(application.id);

    const linkedJobId = typeof application.job === 'object' ? application.job.id : application.job;
    expect(linkedJobId).toBe(openJobId);

    // The resume relationship points at a real resumes row.
    const resumeId = typeof application.resume === 'object' ? application.resume.id : application.resume;
    expect(typeof resumeId).toBe('number');
    createdResumeIds.push(resumeId as number);

    const resume = await payload.findByID({
      collection: 'resumes',
      id: resumeId as number,
      depth: 0,
      overrideAccess: true,
    });
    expect(resume).toBeDefined();
    expect(resume.id).toBe(resumeId);

    // Email delivery is recorded; skipped without an HR recipient/Brevo key, synced with one.
    expect(['skipped', 'synced']).toContain(application.emailDelivery?.status);
  });

  test('apply to a paused job is rejected with invalid_job', async ({ request }) => {
    const res = await request.post('/api/career-applications/apply', {
      multipart: {
        jobSlug: pausedSlug,
        firstName: 'Grace',
        lastName: 'Hopper',
        email: `e2e-paused-${Date.now()}@example.com`,
        turnstileToken: 'test-token',
        resume: {
          name: 'resume.pdf',
          mimeType: 'application/pdf',
          buffer: pdfBuffer,
        },
      },
    });

    expect(res.status()).toBe(400);
    const body = (await res.json()) as { ok: boolean; error?: string };
    expect(body.ok).toBe(false);
    expect(body.error).toBe('invalid_job');
  });
});
