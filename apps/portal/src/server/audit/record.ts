// src/server/audit/record.ts
import { auditLog } from '@/db/schema';
import type { Db } from '@/db/client';
import { PARTNER_ROLE_LABEL, STAFF_ROLE_LABEL, type EventSource } from '@/lib/domain';
import type { Tx } from '@/server/repo/context';
import type { Actor } from '@/server/auth/types';
import { AUDIT_EVENTS, type AuditEvent } from './events';

export interface AuditEntryInput {
  event: AuditEvent;
  /** What was acted on, as the Audit log "On" column reads it: "Pearl Gulf Bank, CleanSight, from Dunes Networks". */
  target: string;
  /** The "Details" text. */
  note?: string;
  before?: string;
  after?: string;
  /** The partner the entry concerns, so the log can be filtered by company. */
  partnerId?: string | null;
  subject?: { type: 'registration' | 'partner' | 'application' | 'document' | 'user' | 'invite' | 'access_request'; id: string };
  /** 'crm' for HubSpot sourced entries, 'system' for jobs. Default 'portal'. */
  source?: EventSource;
}

const describe = (actor: Actor): { id: string | null; label: string; role: string; who: 'staff' | 'partner' | 'sync' } => {
  if (actor.kind === 'system') return { id: null, label: actor.label, role: actor.roleLabel, who: actor.who };
  if (actor.kind === 'staff') return { id: actor.id, label: actor.name, role: STAFF_ROLE_LABEL[actor.role], who: 'staff' };
  return {
    id: actor.id,
    label: actor.name,
    role: `${actor.partnerName}, ${PARTNER_ROLE_LABEL[actor.role].toLowerCase()}`,
    who: 'partner',
  };
};

/**
 * Writes one append only audit row inside the caller's transaction, so the entry commits or rolls back with the change.
 * No .returning(): the viewer may not be allowed to read the row back (audit_log select is staff only).
 */
export async function recordAudit(tx: Pick<Db | Tx, 'insert'>, actor: Actor, entry: AuditEntryInput): Promise<void> {
  const def = AUDIT_EVENTS[entry.event];
  const who = describe(actor);
  await tx.insert(auditLog).values({
    actorId: who.id,
    actorLabel: who.label,
    actorRole: who.role,
    who: who.who,
    kind: def.kind,
    event: entry.event,
    action: def.action,
    target: entry.target,
    text: `${def.action}: ${entry.target}`,
    source: entry.source ?? (actor.kind === 'system' && actor.who === 'sync' ? 'system' : 'portal'),
    before: entry.before ?? null,
    after: entry.after ?? null,
    note: entry.note ?? null,
    partnerId: entry.partnerId ?? null,
    subjectType: entry.subject?.type ?? null,
    subjectId: entry.subject?.id ?? null,
  });
}
