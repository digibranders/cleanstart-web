import type { BasePayload } from 'payload';

export type DeletePartnerApplicationsResult = { deleted: number };

/**
 * GDPR Art. 17 erasure for partner inquiries: hard-deletes every partner
 * application matching the email. No linked files to remove.
 */
export const deletePartnerApplicationsByEmail = async (
  payload: BasePayload,
  email: string,
): Promise<DeletePartnerApplicationsResult> => {
  const res = await payload.find({
    collection: 'partner-applications',
    where: { email: { equals: email } },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  });
  const docs = res.docs as unknown as { id: number }[];
  let deleted = 0;
  for (const doc of docs) {
    await payload.delete({ collection: 'partner-applications', id: doc.id, overrideAccess: true });
    deleted += 1;
  }
  return { deleted };
};
