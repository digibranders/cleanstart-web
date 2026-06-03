import type { BasePayload } from 'payload';

export type DeleteCareerApplicationsResult = { deleted: number };

type Row = { id: number; resume: number | { id?: number } | null };

/**
 * GDPR Art. 17 erasure for career applications: deletes every application
 * matching the email and hard-deletes each linked resume file. Resume delete
 * failures are logged but never block the application delete.
 */
export const deleteCareerApplicationsByEmail = async (
  payload: BasePayload,
  email: string,
): Promise<DeleteCareerApplicationsResult> => {
  const res = await payload.find({
    collection: 'career-applications',
    where: { email: { equals: email } },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  });
  const docs = res.docs as unknown as Row[];

  let deleted = 0;
  for (const doc of docs) {
    const resumeId = typeof doc.resume === 'object' && doc.resume !== null ? doc.resume.id : doc.resume;
    if (typeof resumeId === 'number') {
      try {
        await payload.delete({ collection: 'resumes', id: resumeId, overrideAccess: true });
      } catch (err) {
        payload.logger.warn(
          { err: err instanceof Error ? err.message : String(err), resumeId },
          'Resume delete failed during DSAR erasure',
        );
      }
    }
    await payload.delete({ collection: 'career-applications', id: doc.id, overrideAccess: true });
    deleted += 1;
  }

  return { deleted };
};
