import type { Endpoint } from 'payload';

import { applicationFieldsSchema } from '../lib/careers/application-schema';
import { buildHrApplicationEmail } from '../lib/careers/hr-email';
import { formatJobLocation } from '../lib/careers/job-location';
import { clientIpFromHeaders } from '../lib/client-ip';
import { type BrevoSendResult, sendBrevoEmail } from '../lib/email/brevo';
import { DEFAULT_RATE_LIMITS, checkAndRecord } from '../lib/rate-limit';
import { verifyTurnstileToken } from '../lib/turnstile';
import { RESUME_LIMIT, checkUploadSize } from '../lib/upload-limits';

/**
 * Human-readable submission timestamp for the HR email (Brevo templates can't
 * format dates). UTC with an explicit "UTC" suffix so it's unambiguous
 * regardless of where the server or recipient sits. e.g. "Jun 4, 2026, 12:56 PM UTC".
 */
const formatSubmittedAt = (date: Date): string =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
    timeZoneName: 'short',
  }).format(date);

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
      'location',
      'howDidYouHear',
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

    // Optional cover-letter file — same MIME allow-list + 10 MB cap as the resume.
    const coverFileRaw = form.get('coverLetterFile');
    let coverFile: File | null = null;
    if (coverFileRaw instanceof File && coverFileRaw.size > 0) {
      if (!RESUME_MIMES.has(coverFileRaw.type) || coverFileRaw.size > RESUME_LIMIT) {
        return json({ ok: false, error: 'cover_letter_file_invalid' }, { status: 400, headers: cors });
      }
      coverFile = coverFileRaw;
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
    let resumeUrl: string | undefined;
    try {
      const created = await req.payload.create({
        collection: 'resumes',
        data: {},
        file: { data: buffer, mimetype: file.type, name: file.name || 'resume', size: file.size },
        overrideAccess: true,
      });
      resumeId = created.id as number;
      // Access-controlled file route (NOT a public/CDN URL): the resumes
      // collection keeps Payload access control on, so this only opens for a
      // signed-in admin/editor. Absolute URL required for the email link.
      const serverUrl = (process.env.PAYLOAD_PUBLIC_SERVER_URL ?? '').replace(/\/$/, '');
      const createdUrl = (created as { url?: string | null }).url ?? null;
      const filename = (created as { filename?: string | null }).filename ?? null;
      if (createdUrl?.startsWith('http')) {
        resumeUrl = createdUrl;
      } else if (serverUrl) {
        const path = createdUrl ?? (filename ? `/api/resumes/file/${encodeURIComponent(filename)}` : null);
        if (path) resumeUrl = `${serverUrl}${path}`;
      }
    } catch (err) {
      req.payload.logger.error(
        { err: err instanceof Error ? err.message : String(err) },
        'Resume upload failed — application not stored',
      );
      return json({ ok: false, error: 'capture_failed' }, { status: 502, headers: cors });
    }

    // 1b. Store the cover-letter file if provided (same private collection).
    //     Non-fatal: a failure here doesn't block the application.
    let coverLetterFileId: number | null = null;
    let coverBuffer: Buffer | null = null;
    if (coverFile) {
      try {
        coverBuffer = Buffer.from(await coverFile.arrayBuffer());
        const created = await req.payload.create({
          collection: 'resumes',
          data: {},
          file: {
            data: coverBuffer,
            mimetype: coverFile.type,
            name: coverFile.name || 'cover-letter',
            size: coverFile.size,
          },
          overrideAccess: true,
        });
        coverLetterFileId = created.id as number;
      } catch (err) {
        req.payload.logger.warn(
          { err: err instanceof Error ? err.message : String(err) },
          'Cover-letter file upload failed — continuing without it',
        );
        coverBuffer = null;
      }
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
    const fullName = `${data.firstName} ${data.lastName}`.trim();
    const attachments = [{ name: file.name || 'resume', content: buffer.toString('base64') }];
    if (coverBuffer && coverFile) {
      attachments.push({ name: coverFile.name || 'cover-letter', content: coverBuffer.toString('base64') });
    }
    const hrEmail = process.env.CAREERS_HR_EMAIL;
    // Use the Brevo dashboard template when BREVO_TEMPLATE_ID is a positive
    // integer; otherwise fall back to the code-built HTML (hr-email.ts).
    const templateIdRaw = process.env.BREVO_TEMPLATE_ID;
    const templateIdParsed = templateIdRaw ? Number.parseInt(templateIdRaw, 10) : Number.NaN;
    const templateId =
      Number.isInteger(templateIdParsed) && templateIdParsed > 0 ? templateIdParsed : undefined;

    // Careers emails are sent from the careers sender identity (falls back to
    // the global BREVO_SENDER_* env when CAREERS_SENDER_* is unset).
    const careersSender: { senderEmail?: string; senderName?: string } = {
      ...(process.env.CAREERS_SENDER_EMAIL ? { senderEmail: process.env.CAREERS_SENDER_EMAIL } : {}),
      ...(process.env.CAREERS_SENDER_NAME ? { senderName: process.env.CAREERS_SENDER_NAME } : {}),
    };

    let delivery: BrevoSendResult;
    if (!hrEmail) {
      delivery = { status: 'skipped', reason: 'no-hr-recipient' };
    } else if (templateId != null) {
      delivery = await sendBrevoEmail({
        ...careersSender,
        to: [{ email: hrEmail }],
        replyTo: { email: data.email, name: fullName },
        templateId,
        params: {
          jobTitle: job.title ?? data.jobSlug,
          jobLocation: jobLocation ?? '',
          fullName,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone ?? '',
          location: data.location ?? '',
          howDidYouHear: data.howDidYouHear ?? '',
          linkedinUrl: data.linkedinUrl ?? '',
          coverLetter: data.coverLetter ?? '',
          coverLetterAttached: coverLetterFileId != null ? 'Yes' : '',
          resumeUrl: resumeUrl ?? '',
          submittedAt: formatSubmittedAt(new Date()),
        },
        attachments,
      });
    } else {
      const { subject, htmlContent } = buildHrApplicationEmail({
        jobTitle: job.title ?? data.jobSlug,
        jobLocation,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        location: data.location,
        howDidYouHear: data.howDidYouHear,
        coverLetter: data.coverLetter,
        coverLetterAttached: coverLetterFileId != null,
        linkedinUrl: data.linkedinUrl,
      });
      delivery = await sendBrevoEmail({
        ...careersSender,
        to: [{ email: hrEmail }],
        replyTo: { email: data.email, name: fullName },
        subject,
        htmlContent,
        attachments,
      });
    }

    // Roll back orphaned R2 uploads when the submission ultimately fails: the
    // resume/cover-letter files are only persisted to storage for a successfully
    // created application. Best-effort — a cleanup failure is logged, not raised.
    const rollbackUpload = async (id: number): Promise<void> => {
      try {
        await req.payload.delete({ collection: 'resumes', id, overrideAccess: true });
      } catch (cleanupErr) {
        req.payload.logger.warn(
          { err: cleanupErr instanceof Error ? cleanupErr.message : String(cleanupErr), resumeId: id },
          'Failed to roll back orphaned resume upload after application create failure',
        );
      }
    };

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
          location: data.location ?? null,
          howDidYouHear: data.howDidYouHear ?? null,
          coverLetter: data.coverLetter ?? null,
          coverLetterFile: coverLetterFileId,
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
      await rollbackUpload(resumeId);
      if (coverLetterFileId != null) await rollbackUpload(coverLetterFileId);
      return json({ ok: false, error: 'capture_failed' }, { status: 502, headers: cors });
    }

    return json({ ok: true }, { headers: cors });
  },
};
