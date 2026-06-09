import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { getPayload, type Payload, type SanitizedConfig } from 'payload';

/**
 * The Playwright runner process (which executes this spec's verification via the
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
 * Phase J — Partner application capture.
 *
 * Exercises the public partner endpoints end-to-end:
 *   - A valid JSON POST to /api/partner-applications/apply stores an
 *     append-only `partner-applications` row, returns `{ ok: true }` (200), and
 *     records both Brevo delivery results (`emailDeliveryApplicant.status` +
 *     `emailDeliveryAdmin.status`).
 *   - A POST carrying a non-empty honeypot (`hp`) returns `{ ok: true }` (200)
 *     but persists a *flagged* row instead of a real submission: no email is
 *     dispatched (both delivery groups stay unset) and `turnstilePassed` is
 *     false. (The endpoint records honeypot hits for auditing rather than
 *     silently dropping them — see endpoints/partner-apply.ts.)
 *   - GET /api/partner-applications/export-csv without admin/editor auth → 403.
 *
 * Verification uses the Payload local API against the same Postgres the
 * dev/CI server is bound to (the spec process and the webServer share
 * `DATABASE_URI`). Turnstile passes because the local/CI env uses Cloudflare's
 * always-pass test secret; the endpoint's verifier short-circuits on it.
 *
 * Delivery `status` is `skipped` when no recipient / Brevo key is configured
 * (the default — `PARTNERS_NOTIFY_EMAIL` is unset locally, so the admin email
 * is always `skipped`), or `synced` when a Brevo key is set. The applicant
 * email targets a reserved `@example.com` address, so no real mail is sent.
 */
test.describe('@phase-j-partners', () => {
  let payload: Payload;
  const validEmail = `partner.e2e-valid-${Date.now()}@example.com`;
  const honeypotEmail = `partner.e2e-hp-${Date.now()}@example.com`;
  const createdApplicationIds: number[] = [];

  test.beforeAll(async () => {
    loadCmsEnv();
    const { default: config } = (await import('@payload-config')) as {
      default: Promise<SanitizedConfig> | SanitizedConfig;
    };
    payload = await getPayload({ config });
  });

  test.afterAll(async () => {
    for (const email of [validEmail, honeypotEmail]) {
      const rows = await payload.find({
        collection: 'partner-applications',
        where: { email: { equals: email } },
        depth: 0,
        limit: 100,
        overrideAccess: true,
      });
      for (const row of rows.docs) {
        await payload
          .delete({ collection: 'partner-applications', id: row.id, overrideAccess: true })
          .catch(() => undefined);
      }
    }
    for (const id of createdApplicationIds) {
      await payload
        .delete({ collection: 'partner-applications', id, overrideAccess: true })
        .catch(() => undefined);
    }
  });

  test('valid partner submission stores a row and records both delivery statuses', async ({
    request,
  }) => {
    const res = await request.post('/api/partner-applications/apply', {
      data: {
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: validEmail,
        phone: '+1-202-555-0100',
        company: 'Analytical Engines Ltd',
        website: 'https://example.com',
        partnerReason: 'We want to co-sell secure container images.',
        turnstileToken: 'test-token',
      },
    });

    expect(res.status()).toBe(200);
    const body = (await res.json()) as { ok: boolean; error?: string };
    expect(body.ok).toBe(true);

    const apps = await payload.find({
      collection: 'partner-applications',
      where: { email: { equals: validEmail } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    });
    expect(apps.docs).toHaveLength(1);
    const application = apps.docs[0];
    expect(application).toBeDefined();
    createdApplicationIds.push(application.id);

    expect(application.firstName).toBe('Ada');
    expect(application.lastName).toBe('Lovelace');
    expect(application.email).toBe(validEmail);
    expect(application.company).toBe('Analytical Engines Ltd');
    expect(application.turnstilePassed).toBe(true);

    // Both Brevo sends are recorded — never `failed` for a healthy submission.
    expect(['skipped', 'synced']).toContain(application.emailDeliveryApplicant?.status);
    expect(['skipped', 'synced']).toContain(application.emailDeliveryAdmin?.status);
  });

  test('honeypot submission returns ok but persists no real application', async ({ request }) => {
    const res = await request.post('/api/partner-applications/apply', {
      data: {
        firstName: 'Grace',
        lastName: 'Hopper',
        email: honeypotEmail,
        company: 'COBOL Co',
        turnstileToken: 'test-token',
        hp: 'i-am-a-bot',
      },
    });

    expect(res.status()).toBe(200);
    const body = (await res.json()) as { ok: boolean; error?: string };
    expect(body.ok).toBe(true);

    const apps = await payload.find({
      collection: 'partner-applications',
      where: { email: { equals: honeypotEmail } },
      depth: 0,
      limit: 10,
      overrideAccess: true,
    });
    // Whatever is stored is a flagged honeypot row, not a real submission: no
    // email was dispatched and turnstile was not run.
    for (const row of apps.docs) {
      createdApplicationIds.push(row.id);
      expect(row.honeypot).toBe('i-am-a-bot');
      expect(row.turnstilePassed).toBeFalsy();
      expect(row.emailDeliveryApplicant?.status ?? null).toBeNull();
      expect(row.emailDeliveryAdmin?.status ?? null).toBeNull();
    }
  });

  test('export-csv without admin auth is forbidden', async ({ request }) => {
    const res = await request.get('/api/partner-applications/export-csv');
    expect(res.status()).toBe(403);
    const body = (await res.json()) as { ok: boolean; error?: string };
    expect(body.ok).toBe(false);
    expect(body.error).toBe('forbidden');
  });
});
