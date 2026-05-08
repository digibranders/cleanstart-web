import type { CollectionAfterChangeHook } from 'payload';

import { extractRequestMeta } from '../lib/request-meta';

/**
 * afterChange hook factory that writes an `audit-log` row whenever
 * `seo.additionalSchema` changes — created, edited, or cleared by an
 * admin. Mirrors the existing canonicalOverride / lead-deletion audit
 * patterns: `payload.create({ collection: 'audit-log', overrideAccess: true })`
 * with the `actor`, `request meta`, and a per-action `metadata` JSON
 * payload carrying the before/after diff.
 *
 * Wiring: each content collection that exposes the `additionalSchema`
 * field appends `schemaOverrideAuditHook(slug)` to its `afterChange`
 * array. The hook is a no-op when the field hasn't changed.
 */
export const schemaOverrideAuditHook = (
  collectionSlug: string,
): CollectionAfterChangeHook => {
  return async ({ doc, previousDoc, req, operation }) => {
    if (operation !== 'create' && operation !== 'update') return doc;

    const next = (doc as { seo?: { additionalSchema?: unknown } | null })?.seo
      ?.additionalSchema;
    const prev = (previousDoc as { seo?: { additionalSchema?: unknown } | null })?.seo
      ?.additionalSchema;

    // Compare via JSON serialisation — both values are plain JSON
    // objects/arrays/null. Catches additions, removals, and edits.
    const nextSerialized = next == null ? null : JSON.stringify(next);
    const prevSerialized = prev == null ? null : JSON.stringify(prev);
    if (nextSerialized === prevSerialized) return doc;

    const actorRaw = (req.user as { id?: string | number } | null | undefined)?.id;
    const actorUserId: number | null =
      typeof actorRaw === 'number' && Number.isFinite(actorRaw)
        ? actorRaw
        : typeof actorRaw === 'string'
          ? Number.parseInt(actorRaw, 10) || null
          : null;

    const meta = extractRequestMeta(req.headers);

    try {
      await req.payload.create({
        collection: 'audit-log',
        data: {
          timestamp: new Date().toISOString(),
          action: 'schema_override_changed',
          targetCollection: collectionSlug,
          targetId: String((doc as { id: string | number }).id),
          actorUserId,
          requestIp: meta.ip,
          userAgent: meta.userAgent ?? null,
          acceptLanguage: meta.acceptLanguage ?? null,
          proxyChainLength: meta.proxyChainLength,
          metadata: {
            // Capture both sides so post-hoc forensics can reconstruct
            // exactly what shipped. Truncated by the field-level Zod
            // 16 KB cap, so this stays bounded.
            before: prev ?? null,
            after: next ?? null,
            operation: prev == null ? 'created' : next == null ? 'cleared' : 'updated',
          },
        },
        overrideAccess: true,
      });
    } catch (err) {
      // Audit-log write failures must NOT block the parent save —
      // mirror lead-deletion hook behaviour. Log and move on.
      // eslint-disable-next-line no-console -- audit forensics
      console.error(
        `[schema-override-audit] Failed to write audit-log row for ${collectionSlug}#${String((doc as { id: string | number }).id)}:`,
        err,
      );
    }

    return doc;
  };
};
