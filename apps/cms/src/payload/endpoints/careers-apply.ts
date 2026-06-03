import type { Endpoint } from 'payload';

import { applicationFieldsSchema } from '../lib/careers/application-schema';
import { buildHrApplicationEmail } from '../lib/careers/hr-email';
import { formatJobLocation } from '../lib/careers/job-location';
import { clientIpFromHeaders } from '../lib/client-ip';
import { sendBrevoEmail } from '../lib/email/brevo';
import { DEFAULT_RATE_LIMITS, checkAndRecord } from '../lib/rate-limit';
import { verifyTurnstileToken } from '../lib/turnstile';
import { RESUME_LIMIT, checkUploadSize } from '../lib/upload-limits';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

/** Maximum body size accepted on /api/career-applications/apply (resume +
 * small text fields). When Content-Length is present it's rejected with 413
 * before rate-limit. When Content-Length is absent (chunked transfer-encoding),
 * the body is buffered through arrayBuffer() and bounced on overflow BEFORE the
 * multipart parser runs, so an unbounded chunked upload can't exhaust memory. */
export const CAREERS_MAX_BYTES = 12 * 1024 * 1024;
const RESUME_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const DEFAULT_ALLOWED_ORIGINS = [
  'https://cleanstart.com',
  'https://www.cleanstart.com',
  'https://staging.cleanstart.com',
];
const allowedOrigins = (): string[] => {
  const raw = process.env.LEAD_SUBMIT_ALLOWED_ORIGINS;
  if (!raw || raw.trim().length === 0) return DEFAULT_ALLOWED_ORIGINS;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};
const isAllowedOrigin = (origin: string | null): origin is string =>
  origin != null && allowedOrigins().includes(origin);
const corsHeaders = (origin: string): Record<string, string> => ({
  'access-control-allow-origin': origin,
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  vary: 'Origin',
});

export const careersApplyOptionsEndpoint: Endpoint = {
  path: '/apply',
  method: 'options',
  handler: async (req) => {
    const origin = req.headers.get('origin');
    if (!isAllowedOrigin(origin)) return json({ ok: false, error: 'origin_forbidden' }, { status: 403 });
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  },
};

type JobLookup = {
  id: number;
  title?: string | null;
  slug?: string | null;
  _status?: string | null;
  hiringStatus?: string | null;
  source?: string | null;
  remote?: boolean | null;
  locations?: Array<number | { name?: string | null }> | null;
};

export const careersApplyEndpoint: Endpoint = {
  path: '/apply',
  method: 'post',
  handler: async (req) => {
    const origin = req.headers.get('origin');
    if (origin != null && !isAllowedOrigin(origin)) {
      return json({ ok: false, error: 'origin_forbidden' }, { status: 403 });
    }
    const cors = isAllowedOrigin(origin) ? corsHeaders(origin) : {};

    const contentLengthRaw = req.headers.get('content-length');
    if (contentLengthRaw != null) {
      const contentLength = Number.parseInt(contentLengthRaw, 10);
      if (!Number.isFinite(contentLength) || contentLength < 0) {
        return json({ ok: false, error: 'invalid_content_length' }, { status: 400, headers: cors });
      }
      if (contentLength > CAREERS_MAX_BYTES) {
        return json(
          { ok: false, error: 'payload_too_large', limit: CAREERS_MAX_BYTES },
          { status: 413, headers: cors },
        );
      }
    }

    const ip = clientIpFromHeaders(req.headers);
    const limit = checkAndRecord(`careers:${ip}`, DEFAULT_RATE_LIMITS);
    if (!limit.ok) {
      return json(
        { ok: false, error: 'rate_limited', retryAfterSeconds: Math.ceil(limit.retryAfterMs / 1000) },
        { status: 429, headers: cors },
      );
    }

    let form: FormData;
    try {
      // If Content-Length was absent (chunked transfer-encoding), defend against
      // unbounded bodies by buffering through arrayBuffer() and bouncing on
      // overflow BEFORE the multipart parser buffers the whole file. The
      // original content-type header (with its multipart boundary) is carried
      // via req.headers, so reconstructing a Request re-parses correctly.
      if (contentLengthRaw == null && typeof req.arrayBuffer === 'function') {
        const raw = await req.arrayBuffer();
        if (raw.byteLength > CAREERS_MAX_BYTES) {
          return json(
            { ok: false, error: 'payload_too_large', limit: CAREERS_MAX_BYTES },
            { status: 413, headers: cors },
          );
        }
        form = await new Request(req.url ?? 'http://localhost/api/career-applications/apply', {
          method: 'POST',
          headers: req.headers,
          body: raw,
        }).formData();
      } else {
        form = await (req as unknown as { formData: () => Promise<FormData> }).formData();
      }
    } catch {
      return json({ ok: false, error: 'invalid_multipart' }, { status: 400, headers: cors });
    }

    const rawFields: Record<string, unknown> = {};
    for (const key of [
      'jobSlug',
      'firstName',
      'lastName',
      'email',
      'phone',
      'coverLetter',
      'linkedinUrl',
      'source',
      'turnstileToken',
      'website',
    ]) {
      const v = form.get(key);
      if (typeof v === 'string') rawFields[key] = v;
    }
    const consentRaw = form.get('consent');
    if (typeof consentRaw === 'string' && consentRaw.length > 0) {
      try {
        rawFields.consent = JSON.parse(consentRaw);
      } catch {
        return json({ ok: false, error: 'invalid_consent' }, { status: 400, headers: cors });
      }
    }

    const parsed = applicationFieldsSchema.safeParse(rawFields);
    if (!parsed.success) {
      return json(
        {
          ok: false,
          error: 'invalid_body',
          issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
        },
        { status: 400, headers: cors },
      );
    }
    const data = parsed.data;
    const userAgent = req.headers.get('user-agent') ?? undefined;

    // Honeypot — return 200 OK so bots don't learn they tripped the trap.
    if (typeof data.website === 'string' && data.website.trim().length > 0) {
      req.payload.logger.info({ ip }, 'Career application flagged — honeypot tripped');
      return json({ ok: true }, { headers: cors });
    }

    // Resume file: required, mime + size checked.
    const file = form.get('resume');
    if (!(file instanceof File) || file.size === 0) {
      return json({ ok: false, error: 'resume_required' }, { status: 400, headers: cors });
    }
    if (!RESUME_MIMES.has(file.type)) {
      return json({ ok: false, error: 'resume_type_unsupported' }, { status: 400, headers: cors });
    }
    // Resumes are hard-capped at 10 MB regardless of type. limitForMime grants
    // PDFs 50 MB (for Media uploads), so this explicit cap must run first.
    if (file.size > RESUME_LIMIT) {
      return json({ ok: false, error: 'resume_too_large' }, { status: 400, headers: cors });
    }
    const sized = checkUploadSize(file.type, file.size);
    if (!sized.ok) {
      return json({ ok: false, error: 'resume_too_large', reason: sized.reason }, { status: 400, headers: cors });
    }

    // Turnstile (no exemption for careers).
    const turnstile = await verifyTurnstileToken(data.turnstileToken, ip);
    if (!turnstile.ok) {
      return json({ ok: false, error: 'turnstile_failed', reason: turnstile.reason }, { status: 403, headers: cors });
    }

    // Resolve the job: must be a published, open, CMS-native posting.
    const invalidJob = json({ ok: false, error: 'invalid_job' }, { status: 400, headers: cors });
    let job: JobLookup | null = null;
    try {
      const res = await req.payload.find({
        collection: 'jobs',
        where: { slug: { equals: data.jobSlug } },
        limit: 1,
        // depth 1 resolves the `locations` relationship to jobLocations docs so
        // we can read their `name` for the location string.
        depth: 1,
        overrideAccess: true,
      });
      const doc = res.docs[0] as JobLookup | undefined;
      job = doc ?? null;
    } catch {
      return invalidJob;
    }
    if (!job || job._status !== 'published' || job.hiringStatus !== 'open' || job.source !== 'cms') {
      return invalidJob;
    }

    const locationNames = (job.locations ?? [])
      .map((loc) => (typeof loc === 'object' && loc !== null ? (loc.name ?? '') : ''))
      .filter((name): name is string => name.length > 0);
    const jobLocation = formatJobLocation({ remote: job.remote, locationNames });

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Store the resume (private upload collection).
    let resumeId: number;
    try {
      const created = await req.payload.create({
        collection: 'resumes',
        data: {},
        file: { data: buffer, mimetype: file.type, name: file.name || 'resume', size: file.size },
        overrideAccess: true,
      });
      resumeId = created.id as number;
    } catch (err) {
      req.payload.logger.error(
        { err: err instanceof Error ? err.message : String(err) },
        'Resume upload failed — application not stored',
      );
      return json({ ok: false, error: 'capture_failed' }, { status: 502, headers: cors });
    }

    // 2. Inject live policyVersion into the consent snapshot.
    let policyVersion: string | undefined;
    if (data.consent != null) {
      try {
        const legal = (await req.payload.findGlobal({ slug: 'legal', depth: 0, overrideAccess: true })) as {
          policyVersion?: string | null;
        } | null;
        policyVersion = legal?.policyVersion ?? undefined;
      } catch (err) {
        req.payload.logger.warn(
          { err: err instanceof Error ? err.message : String(err) },
          'Could not read Legal global for policyVersion',
        );
      }
    }

    // 3. Send HR email (non-fatal) BEFORE the application create so the result
    //    is written in the initial append-only row.
    const { subject, htmlContent } = buildHrApplicationEmail({
      jobTitle: job.title ?? data.jobSlug,
      jobLocation,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      coverLetter: data.coverLetter,
      linkedinUrl: data.linkedinUrl,
    });
    const hrEmail = process.env.CAREERS_HR_EMAIL;
    const delivery = hrEmail
      ? await sendBrevoEmail({
          to: [{ email: hrEmail }],
          replyTo: { email: data.email, name: `${data.firstName} ${data.lastName}`.trim() },
          subject,
          htmlContent,
          attachments: [{ name: file.name || 'resume', content: buffer.toString('base64') }],
        })
      : ({ status: 'skipped', reason: 'no-hr-recipient' } as const);

    // 4. Create the append-only application row with delivery embedded.
    try {
      await req.payload.create({
        collection: 'career-applications',
        data: {
          job: job.id,
          jobTitleSnapshot: job.title ?? data.jobSlug,
          jobLocationSnapshot: jobLocation ?? null,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone ?? null,
          coverLetter: data.coverLetter ?? null,
          linkedinUrl: data.linkedinUrl ?? null,
          resume: resumeId,
          source: data.source ?? null,
          ip: ip ?? null,
          userAgent: userAgent ?? null,
          consentGivenAt: data.consent?.givenAt ?? null,
          consentSnapshot: data.consent?.snapshot ?? null,
          privacyPolicyVersion: policyVersion ?? null,
          emailDelivery: {
            status: delivery.status,
            messageId: 'messageId' in delivery ? (delivery.messageId ?? null) : null,
            error: delivery.status === 'failed' ? delivery.error : null,
          },
          turnstilePassed: true,
        },
        overrideAccess: true,
      });
    } catch (err) {
      req.payload.logger.error(
        { err: err instanceof Error ? err.message : String(err), resumeId },
        'Career application create failed after resume upload',
      );
      return json({ ok: false, error: 'capture_failed' }, { status: 502, headers: cors });
    }

    return json({ ok: true }, { headers: cors });
  },
};
