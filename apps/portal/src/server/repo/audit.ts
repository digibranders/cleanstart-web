import { and, count, desc, eq, getTableColumns, gte, ilike, lt, or, type SQL, sql } from 'drizzle-orm';
import { z } from 'zod';
import { auditLog } from '@/db/schema';
import { type Clock, systemClock } from '@/lib/clock';
import type { AuditKind, AuditWho } from '@/lib/domain';
import type { AuditEntryDto, AuditPeriod, PageDto } from '@/lib/dto';
import type { Viewer } from '@/server/auth/types';
import { ValidationError } from '@/server/errors';
import { assertStaff, type Tx } from './context';
import { defineIsolation } from './isolation.registry';

export interface AuditFilter {
  period: AuditPeriod;
  /** Custom range, UTC days, inclusive. Used only when period is 'custom'. */
  from?: string;
  to?: string;
  kind?: AuditKind;
  event?: string;
  who?: AuditWho;
  q?: string;
  partnerId?: string;
  cursor?: string;
  limit?: number;
}

const PERIOD_DAYS: Record<Exclude<AuditPeriod, 'custom'>, number> = { '24h': 1, '7d': 7, '30d': 30, '90d': 90 };
const DAY_MS = 86_400_000;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const EXPORT_CAP = 5000;

/** A timestamptz as Postgres prints it: `2026-11-12 09:14:03.123456+00`. Checked here so a forged cursor never reaches a SQL cast. */
const PG_TIMESTAMP = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d{1,6})?[+-]\d{2}(:\d{2})?$/;

const cursorSchema = z.object({
  at: z.string().max(40).regex(PG_TIMESTAMP).refine((value) => !Number.isNaN(Date.parse(value))),
  id: z.string().uuid(),
});

/** The cursor carries the timestamp as Postgres prints it (microseconds), because a JS Date keeps only milliseconds. */
const encodeCursor = (at: string, id: string): string => Buffer.from(JSON.stringify({ at, id })).toString('base64url');

const decodeCursor = (cursor: string): z.infer<typeof cursorSchema> => {
  try {
    return cursorSchema.parse(JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')));
  } catch {
    throw new ValidationError([{ path: 'cursor', message: 'That page link is not valid.' }]);
  }
};

const escapeLike = (value: string): string => value.replace(/[\\%_]/g, '\\$&');

function conditions(input: Omit<AuditFilter, 'cursor' | 'limit'>, clock: Clock): SQL[] {
  const parts: SQL[] = [];
  if (input.period === 'custom') {
    if (!input.from || !input.to || input.from > input.to) {
      throw new ValidationError([{ path: 'period', message: 'Pick a start day and an end day, start first.' }]);
    }
    parts.push(gte(auditLog.at, new Date(`${input.from}T00:00:00Z`)));
    parts.push(lt(auditLog.at, new Date(new Date(`${input.to}T00:00:00Z`).getTime() + DAY_MS)));
  } else {
    parts.push(gte(auditLog.at, new Date(clock.now().getTime() - PERIOD_DAYS[input.period] * DAY_MS)));
  }
  if (input.event) parts.push(eq(auditLog.event, input.event));
  if (input.kind) parts.push(eq(auditLog.kind, input.kind));
  if (input.who) parts.push(eq(auditLog.who, input.who));
  if (input.partnerId) parts.push(eq(auditLog.partnerId, input.partnerId));
  const q = input.q?.trim();
  if (q) {
    const pattern = `%${escapeLike(q)}%`;
    const match = or(ilike(auditLog.actorLabel, pattern), ilike(auditLog.action, pattern), ilike(auditLog.target, pattern));
    if (match) parts.push(match);
  }
  return parts;
}

type AuditRow = typeof auditLog.$inferSelect;

const toDto = (row: AuditRow): AuditEntryDto => ({
  id: row.id,
  at: row.at.toISOString(),
  actorId: row.actorId,
  actorLabel: row.actorLabel,
  actorRole: row.actorRole,
  whoKind: row.who,
  kind: row.kind,
  event: row.event,
  action: row.action ?? row.text,
  target: row.target ?? '',
  source: row.source,
  before: row.before,
  after: row.after,
  note: row.note,
  partnerId: row.partnerId,
  subjectType: row.subjectType,
  subjectId: row.subjectId,
});

/** Partner manager only. Newest first. `q` matches actor, action and target. */
export async function listAudit(
  tx: Tx,
  viewer: Viewer,
  input: AuditFilter,
  clock: Clock,
): Promise<PageDto<AuditEntryDto>> {
  assertStaff(viewer);
  const limit = Math.min(Math.max(Math.trunc(input.limit ?? DEFAULT_LIMIT), 1), MAX_LIMIT);
  const parts = conditions(input, clock);
  const where = and(...parts);

  const pageParts = [...parts];
  if (input.cursor) {
    const cursor = decodeCursor(input.cursor);
    pageParts.push(sql`(${auditLog.at}, ${auditLog.id}) < (${cursor.at}::timestamptz, ${cursor.id}::uuid)`);
  }

  const rows = await tx
    .select({ ...getTableColumns(auditLog), atText: sql<string>`${auditLog.at}::text` })
    .from(auditLog)
    .where(and(...pageParts))
    .orderBy(desc(auditLog.at), desc(auditLog.id))
    .limit(limit + 1);
  const [counted] = await tx.select({ total: count() }).from(auditLog).where(where);

  const page = rows.slice(0, limit);
  const last = page.at(-1);
  return {
    rows: page.map(toDto),
    total: counted?.total ?? 0,
    nextCursor: rows.length > limit && last ? encodeCursor(last.atText, last.id) : null,
  };
}

/** Partner manager only. Same filters, no paging, capped at 5000 rows (ValidationError above that). */
export async function exportAudit(
  tx: Tx,
  viewer: Viewer,
  input: Omit<AuditFilter, 'cursor' | 'limit'>,
  clock: Clock,
): Promise<AuditEntryDto[]> {
  assertStaff(viewer);
  const rows = await tx
    .select()
    .from(auditLog)
    .where(and(...conditions(input, clock)))
    .orderBy(desc(auditLog.at), desc(auditLog.id))
    .limit(EXPORT_CAP + 1);
  if (rows.length > EXPORT_CAP) {
    throw new ValidationError([
      { path: 'period', message: `More than ${EXPORT_CAP} events match. Narrow the period or the filters.` },
    ]);
  }
  return rows.map(toDto);
}

export const isolation = defineIsolation<'listAudit' | 'exportAudit'>({
  listAudit: {
    scope: 'staff-only',
    expect: 'forbidden',
    probe: (tx, viewer) => listAudit(tx, viewer, { period: '90d' }, systemClock),
  },
  exportAudit: {
    scope: 'staff-only',
    expect: 'forbidden',
    probe: (tx, viewer) => exportAudit(tx, viewer, { period: '90d' }, systemClock),
  },
});
