import type { BasePayload } from 'payload';

export type PurgeCareerApplicationsOptions = {
  retentionDays: number;
  now?: Date;
};

export type PurgeCareerApplicationsResult = { redacted: number };

type ExpiredRow = { id: number; resume: number | { id?: number } | null };

/**
 * Hard-deletes the resume file and redacts applicant PII on every
 * career-application older than `retentionDays`. Idempotent: redacted rows
 * (piiRedactedAt set) are excluded by the query, so re-runs skip them.
 */
export const purgeCareerApplications = async (
  payload: BasePayload,
  options: PurgeCareerApplicationsOptions,
): Promise<PurgeCareerApplicationsResult> => {
  const now = options.now ?? new Date();
  const cutoff = new Date(now.getTime() - options.retentionDays * 24 * 60 * 60 * 1000).toISOString();

  const res = await payload.find({
    collection: 'career-applications',
    where: { and: [{ createdAt: { less_than: cutoff } }, { piiRedactedAt: { exists: false } }] },
    limit: 500,
    depth: 0,
    overrideAccess: true,
  });
  const docs = res.docs as unknown as ExpiredRow[];

  let redacted = 0;
  for (const doc of docs) {
    const resumeId = typeof doc.resume === 'object' && doc.resume !== null ? doc.resume.id : doc.resume;
    if (typeof resumeId === 'number') {
      try {
        await payload.delete({ collection: 'resumes', id: resumeId, overrideAccess: true });
      } catch (err) {
        payload.logger.warn(
          { err: err instanceof Error ? err.message : String(err), resumeId },
          'Resume delete failed during purge',
        );
      }
    }
    await payload.update({
      collection: 'career-applications',
      id: doc.id,
      data: {
        firstName: null,
        lastName: null,
        email: null,
        phone: null,
        coverLetter: null,
        linkedinUrl: null,
        ip: null,
        userAgent: null,
        piiRedactedAt: now.toISOString(),
      },
      overrideAccess: true,
    });
    redacted += 1;
  }

  return { redacted };
};
