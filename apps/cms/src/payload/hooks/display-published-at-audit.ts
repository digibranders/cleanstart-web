import type { CollectionAfterChangeHook } from 'payload';

import { extractRequestMeta } from '../lib/request-meta';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const AUDIT_THRESHOLD_HOURS = 24;

const readIso = (doc: unknown, key: string): string | null => {
  const v = (doc as Record<string, unknown> | null | undefined)?.[key];
  return typeof v === 'string' && v.length > 0 ? v : null;
};

/**
 * afterChange hook factory that writes an `audit-log` row whenever the
 * editor sets `displayPublishedAt` to a value more than 24h away from
 * the row's `publishedAt` (or `now()` if the row has never been
 * published). Backdating beyond Google's 30-day spam-policy boundary
 * is the case we most want forensic evidence for, but the threshold
 * is set at 24h so any non-trivial deviation surfaces in the trail.
 *
 * No-op when:
 *  - `displayPublishedAt` is unchanged from `previousDoc`.
 *  - Both before and after sit within ±24h of `publishedAt`.
 *  - The auto-backfill stamp (set in lock-step with `publishedAt`
 *    by `displayPublishedAtBackfillHook`) — the |delta| is < 1ms
 *    by construction, so the threshold check filters it out.
 *
 * Wiring: each versioned collection that exposes `displayPublishedAt`
 * appends `displayPublishedAtAuditHook(slug)` to its `afterChange`
 * array. Mirrors the `schemaOverrideAuditHook` shape so the audit-log
 * compliance contract stays uniform.
 */
export const displayPublishedAtAuditHook = (
  collectionSlug: string,
): CollectionAfterChangeHook => {
  return async ({ doc, previousDoc, req, operation }) => {
    if (operation !== 'create' && operation !== 'update') return doc;

    const next = readIso(doc, 'displayPublishedAt');
    const prev = readIso(previousDoc, 'displayPublishedAt');
    if (next === prev) return doc;
    if (!next) return doc; // clearing the override isn't an audit event

    const reference =
      readIso(doc, 'publishedAt') ??
      readIso(previousDoc, 'publishedAt') ??
      new Date().toISOString();

    const deltaMs = new Date(next).getTime() - new Date(reference).getTime();
    if (!Number.isFinite(deltaMs)) return doc;

    const deltaHours = Math.abs(deltaMs) / (60 * 60 * 1000);
    if (deltaHours < AUDIT_THRESHOLD_HOURS) return doc;

    const deltaDays = Math.round((deltaMs / MS_PER_DAY) * 10) / 10;

    const actorRaw = (req.user as { id?: string | number } | null | undefined)?.id;
    const actorUserId: number | null =
      typeof actorRaw === 'number' && Number.isFinite(actorRaw)
        ? actorRaw
        : typeof actorRaw === 'string'
          ? (Number.isFinite(Number.parseInt(actorRaw, 10)) ? Number.parseInt(actorRaw, 10) : null)
          : null;

    const meta = extractRequestMeta(req.headers);

    try {
      await req.payload.create({
        collection: 'audit-log',
        data: {
          timestamp: new Date().toISOString(),
          action: 'display_publish_date_overridden',
          targetCollection: collectionSlug,
          targetId: String((doc as { id: string | number }).id),
          actorUserId,
          requestIp: meta.ip,
          userAgent: meta.userAgent ?? null,
          acceptLanguage: meta.acceptLanguage ?? null,
          proxyChainLength: meta.proxyChainLength,
          metadata: {
            previous: prev,
            next,
            reference,
            deltaDays,
          },
        },
        overrideAccess: true,
      });
    } catch (err) {
      // Audit-log write failures must NOT block the parent save —
      // mirror the schema-override-audit + lead-deletion hook
      // behaviour. Log and move on.
      // eslint-disable-next-line no-console -- audit forensics
      console.error(
        `[display-published-at-audit] Failed to write audit-log row for ${collectionSlug}#${String(
          (doc as { id: string | number }).id,
        )}:`,
        err,
      );
    }

    return doc;
  };
};
