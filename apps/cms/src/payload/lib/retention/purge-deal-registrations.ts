import type { BasePayload } from 'payload';

const DAY_MS = 24 * 60 * 60 * 1000;

export const purgeDealRegistrations = async (
  payload: BasePayload,
  options: { retentionDays: number },
): Promise<{ scanned: number; redacted: number; errors: number }> => {
  const cutoff = new Date(Date.now() - options.retentionDays * DAY_MS).toISOString();
  const found = await payload.find({
    collection: 'deal-registrations',
    where: {
      and: [{ createdAt: { less_than: cutoff } }, { piiRedactedAt: { equals: null } }],
    },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  });
  let redacted = 0;
  let errors = 0;
  for (const doc of found.docs as Array<{ id: number }>) {
    try {
      const redaction: Record<string, null | string> = {
        partnerRepFirstName: null,
        partnerRepLastName: null,
        partnerRepEmail: null,
        partnerRepPhone: null,
        prospectFirstName: null,
        prospectLastName: null,
        prospectEmail: null,
        prospectPhone: null,
        ip: null,
        userAgent: null,
        piiRedactedAt: new Date().toISOString(),
      };
      await payload.update({
        collection: 'deal-registrations',
        id: doc.id,
        data: redaction,
        overrideAccess: true,
      });
      redacted += 1;
    } catch (err) {
      errors += 1;
      payload.logger?.warn?.(
        { id: doc.id, err: err instanceof Error ? err.message : String(err) },
        'deal-registration PII redaction failed for row',
      );
    }
  }
  return { scanned: found.docs.length, redacted, errors };
};
