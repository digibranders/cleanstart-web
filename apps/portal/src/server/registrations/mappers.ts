import { and, asc, desc, eq, getTableColumns, inArray, or, sql } from 'drizzle-orm';
import {
  partners,
  registrationContacts,
  registrationEvents,
  registrationMessages,
  registrations,
  users,
} from '@/db/schema';
import type { PartnerCategory } from '@/lib/domain';
import type { RegistrationCheckDto, RegistrationDetailDto, RegistrationListItem, RegistrationMessageDto } from '@/lib/dto';
import type { Tx } from '@/server/repo/context';

export type RegistrationRow = typeof registrations.$inferSelect;
type ContactRow = typeof registrationContacts.$inferSelect;
type MessageRow = typeof registrationMessages.$inferSelect;
type EventRow = typeof registrationEvents.$inferSelect;

/** A registration with the joined names every list item needs. */
export interface ListRow extends RegistrationRow {
  partnerName: string;
  partnerCategory: PartnerCategory;
  managerName: string | null;
}

/** The one select every read goes through. The manager join is a left join, and RLS may hide a removed manager. */
export const selectRows = (tx: Tx) =>
  tx
    .select({
      ...getTableColumns(registrations),
      partnerName: partners.name,
      partnerCategory: partners.category,
      managerName: users.name,
    })
    .from(registrations)
    .innerJoin(partners, eq(partners.id, registrations.partnerId))
    .leftJoin(users, eq(users.id, registrations.managerId));

export const toListItem = (row: ListRow): RegistrationListItem => ({
  id: row.id,
  customer: row.customerName,
  website: row.customerDomain,
  partnerId: row.partnerId,
  partnerName: row.partnerName,
  partnerCategory: row.partnerCategory,
  product: row.product,
  region: row.region,
  managerId: row.managerId,
  managerName: row.managerName,
  registeredById: row.registeredBy,
  registeredByName: row.registeredByName,
  registeredOn: row.registeredOn,
  registeredAt: row.createdAt.toISOString(),
  resubmittedOn: row.resubmittedOn,
  status: row.status,
  stage: row.stage,
  protectionEnd: row.protectionEnd,
  closedOn: row.closedOn,
  decidedOn: row.decidedAt ? row.decidedAt.toISOString().slice(0, 10) : null,
  decidedByLabel: row.decidedByLabel,
  rejectionReason: row.rejectionReason,
  crmRef: row.hubspotDealId ? `HS-${row.hubspotDealId}` : null,
  crmSyncedAt: row.hubspotSyncedAt ? row.hubspotSyncedAt.toISOString() : null,
  extensionStatus: row.extensionStatus,
  expectedClose: row.expectedClose,
});

export const toMessageDto = (m: MessageRow): RegistrationMessageDto => ({
  id: m.id,
  authorId: m.authorId,
  authorName: m.authorName,
  authorOrg: m.authorOrg,
  side: m.side,
  body: m.body,
  createdAt: m.createdAt.toISOString(),
  auto: m.auto,
});

const toDetail = (
  row: ListRow,
  parts: { contacts: ContactRow[]; messages: MessageRow[]; events: EventRow[] },
): RegistrationDetailDto => ({
  ...toListItem(row),
  notes: row.notes,
  extensionRequestedAt: row.extensionRequestedAt ? row.extensionRequestedAt.toISOString() : null,
  extensionReason: row.extensionReason,
  extensionGrantedAt: row.extensionGrantedAt ? row.extensionGrantedAt.toISOString() : null,
  extensionDays: row.extensionDays,
  hubspotMissing: row.hubspotMissing,
  decidedAt: row.decidedAt ? row.decidedAt.toISOString() : null,
  contacts: parts.contacts.map((c) => ({ id: c.id, name: c.name, role: c.role, email: c.email, phone: c.phone })),
  thread: parts.messages.map(toMessageDto),
  history: parts.events.map((e) => ({
    id: e.id,
    at: e.at.toISOString(),
    text: e.text,
    byLabel: e.byLabel,
    source: e.source,
    auto: e.auto,
  })),
});

const group = <T extends { registrationId: string }>(items: readonly T[]): Map<string, T[]> => {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const list = map.get(item.registrationId);
    if (list) list.push(item);
    else map.set(item.registrationId, [item]);
  }
  return map;
};

/** Contacts (newest first, so the contact added on a resubmission leads), thread (oldest first) and history (newest first). */
export async function loadDetails(tx: Tx, rows: readonly ListRow[]): Promise<RegistrationDetailDto[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const contacts = await tx
    .select()
    .from(registrationContacts)
    .where(inArray(registrationContacts.registrationId, ids))
    .orderBy(desc(registrationContacts.createdAt), desc(registrationContacts.id));
  const messages = await tx
    .select()
    .from(registrationMessages)
    .where(inArray(registrationMessages.registrationId, ids))
    .orderBy(asc(registrationMessages.createdAt), asc(registrationMessages.id));
  const events = await tx
    .select()
    .from(registrationEvents)
    .where(inArray(registrationEvents.registrationId, ids))
    .orderBy(desc(registrationEvents.at), desc(registrationEvents.id));
  const byContact = group(contacts);
  const byMessage = group(messages);
  const byEvent = group(events);
  return rows.map((row) =>
    toDetail(row, {
      contacts: byContact.get(row.id) ?? [],
      messages: byMessage.get(row.id) ?? [],
      events: byEvent.get(row.id) ?? [],
    }),
  );
}

const sameNameIs = (name: string) => sql`lower(${registrations.customerName}) = ${name.toLowerCase()}`;

/** Accepted rivals first, then the earliest registration. */
const strongest = (a: ListRow, b: ListRow): number =>
  Number(b.status === 'accepted') - Number(a.status === 'accepted') || a.createdAt.getTime() - b.createdAt.getTime();

/**
 * Staff only data. Another partner's pending or accepted registration for the same customer and product is a conflict;
 * the same partner already holding an accepted registration for another product of that customer is information.
 * Region is not applied: the point of the check is to see across regions.
 */
export async function computeChecks(tx: Tx, rows: readonly ListRow[]): Promise<Record<string, RegistrationCheckDto>> {
  const checks: Record<string, RegistrationCheckDto> = {};
  const names = [...new Set(rows.map((r) => r.customerName.toLowerCase()))];
  if (names.length === 0) return checks;
  const others = await selectRows(tx).where(
    and(or(...names.map(sameNameIs)), inArray(registrations.status, ['pending', 'accepted'])),
  );
  for (const row of rows) {
    const same = others.filter((o) => o.id !== row.id && o.customerName.toLowerCase() === row.customerName.toLowerCase());
    const rival = same.filter((o) => o.product === row.product && o.partnerId !== row.partnerId).sort(strongest)[0];
    if (rival) {
      checks[row.id] = {
        kind: 'conflict',
        other: {
          id: rival.id,
          partnerName: rival.partnerName,
          product: rival.product,
          status: rival.status,
          registeredOn: rival.registeredOn,
          protectionEnd: rival.protectionEnd,
          registeredFirst: rival.createdAt.getTime() < row.createdAt.getTime(),
        },
      };
      continue;
    }
    const held = same.find((o) => o.partnerId === row.partnerId && o.product !== row.product && o.status === 'accepted' && o.protectionEnd);
    checks[row.id] = held
      ? {
          kind: 'info',
          other: {
            id: held.id,
            partnerName: held.partnerName,
            product: held.product,
            status: held.status,
            registeredOn: held.registeredOn,
            protectionEnd: held.protectionEnd,
            registeredFirst: false,
          },
        }
      : { kind: 'none' };
  }
  return checks;
}
