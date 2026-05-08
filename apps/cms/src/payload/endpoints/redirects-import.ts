import type { Endpoint } from 'payload';
import { z } from 'zod';

import {
  IMPORT_SOURCE_LABEL,
  type RedirectsPayload,
  planBulkRedirectImport,
} from '../lib/redirects/bulk-import';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

const MAX_ROWS = 5000;

const hasEditorRole = (
  user: { role?: string | null } | null | undefined,
): boolean => user?.role === 'admin' || user?.role === 'editor';

/**
 * Boundary schema for the bulk-import payload. Per CLAUDE.md "Zod at
 * boundaries" — every REST surface validates here before any value
 * crosses into the planner. Field-level shape (status enum, path/URL
 * shape, self-loop check) is re-validated by `validateRow` inside the
 * planner so seed-records and direct planner callers also get the
 * full check.
 */
const importRowSchema = z.object({
  from: z.string().min(1).max(2048),
  to: z.string().max(2048).optional(),
  status: z.enum(['301', '302', '307', '308', '410']).optional(),
  notes: z.string().max(4096).optional(),
});

const importBodySchema = z.object({
  rows: z.array(importRowSchema).max(MAX_ROWS),
  dryRun: z.boolean().optional(),
});

/**
 * POST /api/redirects/import
 *
 * Bulk-upsert redirects in a single call. Body shape:
 *
 *   { rows: [{ from, to, status?, notes? }, ...], dryRun?: boolean }
 *
 * - `from` must be a site-relative path or absolute URL.
 * - `status` defaults to `301`. `410` rows are accepted with empty `to`.
 * - System-managed rows (source=slug-change) are never overwritten.
 * - The redirectCycleGuardHook still runs per row, so cycles introduced
 *   by an import are rejected the same way as a manual edit.
 *
 * Auth: admin or editor only. The endpoint is exposed under /api on
 * the CMS — there is no public route.
 */
export const redirectsImportEndpoint: Endpoint = {
  path: '/redirects/import',
  method: 'post',
  handler: async (req) => {
    if (!hasEditorRole(req.user as { role?: string } | null)) {
      return json({ ok: false, error: 'forbidden' }, { status: 403 });
    }

    let raw: unknown;
    try {
      raw = req.json ? await req.json() : null;
    } catch {
      return json({ ok: false, error: 'invalid_json' }, { status: 400 });
    }

    // 5000-row cap is enforced by the schema — surface as 413 (the more
    // useful status for a too-many-rows case) rather than the generic
    // 400 Zod would emit on its own.
    if (
      raw != null &&
      typeof raw === 'object' &&
      Array.isArray((raw as { rows?: unknown }).rows) &&
      ((raw as { rows: unknown[] }).rows.length > MAX_ROWS)
    ) {
      return json(
        {
          ok: false,
          error: 'too_many_rows',
          limit: MAX_ROWS,
          received: (raw as { rows: unknown[] }).rows.length,
        },
        { status: 413 },
      );
    }

    const parsed = importBodySchema.safeParse(raw);
    if (!parsed.success) {
      return json(
        {
          ok: false,
          error: 'invalid_body',
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const dryRun = parsed.data.dryRun === true;
    const plan = await planBulkRedirectImport({
      rows: parsed.data.rows,
      payload: req.payload as unknown as RedirectsPayload,
    });

    if (dryRun) {
      return json({
        ok: true,
        dryRun: true,
        toCreate: plan.create.length,
        toUpdate: plan.update.length,
        skipped: plan.skipped,
        errors: plan.errors,
      });
    }

    let created = 0;
    let updated = 0;
    const runtimeErrors: { index: number; message: string }[] = [];

    for (const row of plan.create) {
      try {
        await req.payload.create({
          collection: 'redirects',
          data: {
            from: row.from,
            to: row.to,
            status: row.status as '301' | '302' | '307' | '308' | '410',
            source: IMPORT_SOURCE_LABEL as 'migration-seed',
            ...(row.notes ? { notes: row.notes } : {}),
          },
          overrideAccess: true,
        });
        created += 1;
      } catch (err) {
        runtimeErrors.push({
          index: -1,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    for (const { id, row } of plan.update) {
      try {
        await req.payload.update({
          collection: 'redirects',
          id,
          data: {
            to: row.to,
            status: row.status as '301' | '302' | '307' | '308' | '410',
            ...(row.notes ? { notes: row.notes } : {}),
          },
          overrideAccess: true,
        });
        updated += 1;
      } catch (err) {
        runtimeErrors.push({
          index: -1,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return json({
      ok: true,
      created,
      updated,
      skipped: plan.skipped,
      errors: [...plan.errors, ...runtimeErrors],
    });
  },
};
