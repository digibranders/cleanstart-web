import { and, asc, eq, inArray, ne, sql } from 'drizzle-orm';
import { registrationContacts, registrationEvents, registrations } from '@/db/schema';
import { type Clock, fixedClock } from '@/lib/clock';
import { normalizeDomain } from '@/lib/customer';
import { PRODUCT_LABEL } from '@/lib/domain';
import type { RegistrationDetailDto } from '@/lib/dto';
import { changedFields, type FieldChange, hasReachableContact, type RegistrationPatch } from '@/lib/registration-edit';
import type { Viewer } from '@/server/auth/types';
import { ConflictError, NotFoundError, ValidationError } from '@/server/errors';
import type { Tx } from './context';
import { defineIsolation } from './isolation.registry';
import { getRegistration, lockRegistration } from './registrations';

export interface ContactInput {
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
}

export interface EditResult {
  registration: RegistrationDetailDto;
  /** Empty when nothing really changed; the caller then skips the audit entry and the alert. */
  changes: FieldChange[];
}

const NEEDS_CONTACT = 'Keep at least one contact with an email or a phone number.';

/** Locks the row and refuses anything but a pending registration: after acceptance the partner manager owns the changes. */
async function lockPending(tx: Tx, viewer: Viewer, id: string): Promise<RegistrationDetailDto> {
  const current = await lockRegistration(tx, viewer, id);
  if (current.status !== 'pending') {
    throw new ConflictError('not_pending', 'Accepted registrations are changed by your partner manager. Ask them in the conversation.');
  }
  return current;
}

async function event(tx: Tx, viewer: Viewer, registrationId: string, text: string, clock: Clock): Promise<void> {
  await tx.insert(registrationEvents).values({ registrationId, at: clock.now(), text, byLabel: viewer.name, source: 'portal' });
}

export async function editRegistration(
  tx: Tx,
  viewer: Viewer,
  input: { id: string; patch: RegistrationPatch },
  clock: Clock,
): Promise<EditResult> {
  const current = await lockPending(tx, viewer, input.id);
  const patch: RegistrationPatch = { ...input.patch };
  if (patch.website !== undefined) patch.website = normalizeDomain(patch.website);
  const changes = changedFields(current, patch);
  if (changes.length === 0) return { registration: current, changes };

  if (changes.some((c) => c.field === 'customer') && patch.customer !== undefined) {
    const clash = await tx
      .select({ id: registrations.id })
      .from(registrations)
      .where(
        and(
          eq(registrations.partnerId, current.partnerId),
          eq(registrations.product, current.product),
          ne(registrations.id, current.id),
          inArray(registrations.status, ['pending', 'accepted']),
          sql`lower(${registrations.customerName}) = ${patch.customer.trim().toLowerCase()}`,
        ),
      )
      .limit(1);
    if (clash.length > 0) {
      throw new ConflictError(
        'duplicate_registration',
        `You already have an open registration for ${patch.customer.trim()}, ${PRODUCT_LABEL[current.product]}.`,
      );
    }
  }

  await tx
    .update(registrations)
    .set({
      ...(patch.customer !== undefined ? { customerName: patch.customer.trim() } : {}),
      ...(patch.website !== undefined ? { customerDomain: patch.website } : {}),
      ...(patch.customerCountry !== undefined ? { customerCountry: patch.customerCountry } : {}),
      ...(patch.customerIndustry !== undefined ? { customerIndustry: patch.customerIndustry } : {}),
      ...(patch.useCase !== undefined ? { useCase: patch.useCase } : {}),
      ...(patch.competitor !== undefined ? { competitor: patch.competitor } : {}),
      ...(patch.seats !== undefined ? { seats: patch.seats } : {}),
      ...(patch.dealValue !== undefined ? { dealValue: patch.dealValue } : {}),
      ...(patch.currency !== undefined ? { currency: patch.currency } : {}),
      ...(patch.salesStage !== undefined ? { salesStage: patch.salesStage } : {}),
      ...(patch.expectedClose !== undefined ? { expectedClose: patch.expectedClose } : {}),
      ...(patch.decisionDate !== undefined ? { decisionDate: patch.decisionDate } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
    })
    .where(and(eq(registrations.id, current.id), eq(registrations.status, 'pending')));
  await event(tx, viewer, current.id, `Edited by the partner: ${changes.map((c) => c.label.toLowerCase()).join(', ')}`, clock);
  return { registration: await getRegistration(tx, viewer, current.id), changes };
}

/** Contacts read newest first and the first is primary, so a new one is stamped just before the oldest to stay behind the primary. */
export async function addRegistrationContact(
  tx: Tx,
  viewer: Viewer,
  input: { id: string; contact: ContactInput },
  clock: Clock,
): Promise<RegistrationDetailDto> {
  const current = await lockPending(tx, viewer, input.id);
  if (current.contacts.length >= 10) throw new ValidationError([{ path: 'contacts', message: 'Add at most 10 contacts.' }]);
  const rows = await tx
    .select({ createdAt: registrationContacts.createdAt })
    .from(registrationContacts)
    .where(eq(registrationContacts.registrationId, current.id))
    .orderBy(asc(registrationContacts.createdAt))
    .limit(1);
  const oldest = rows[0]?.createdAt;
  await tx.insert(registrationContacts).values({
    registrationId: current.id,
    ...input.contact,
    createdAt: oldest ? new Date(oldest.getTime() - 1) : clock.now(),
  });
  await event(tx, viewer, current.id, `Contact added: ${input.contact.name}`, clock);
  return getRegistration(tx, viewer, current.id);
}

async function otherContacts(tx: Tx, registrationId: string, contactId: string): Promise<Array<{ email: string | null; phone: string | null }>> {
  return tx
    .select({ email: registrationContacts.email, phone: registrationContacts.phone })
    .from(registrationContacts)
    .where(and(eq(registrationContacts.registrationId, registrationId), ne(registrationContacts.id, contactId)));
}

async function requireContact(tx: Tx, registrationId: string, contactId: string): Promise<{ name: string }> {
  const [row] = await tx
    .select({ name: registrationContacts.name })
    .from(registrationContacts)
    .where(and(eq(registrationContacts.id, contactId), eq(registrationContacts.registrationId, registrationId)))
    .limit(1);
  if (!row) throw new NotFoundError('contact');
  return row;
}

export async function updateRegistrationContact(
  tx: Tx,
  viewer: Viewer,
  input: { id: string; contactId: string; contact: ContactInput },
  clock: Clock,
): Promise<RegistrationDetailDto> {
  const current = await lockPending(tx, viewer, input.id);
  await requireContact(tx, current.id, input.contactId);
  const rest = await otherContacts(tx, current.id, input.contactId);
  if (!hasReachableContact([...rest, input.contact])) throw new ValidationError([{ path: 'contact', message: NEEDS_CONTACT }]);
  await tx
    .update(registrationContacts)
    .set({ name: input.contact.name, role: input.contact.role, email: input.contact.email, phone: input.contact.phone })
    .where(and(eq(registrationContacts.id, input.contactId), eq(registrationContacts.registrationId, current.id)));
  await event(tx, viewer, current.id, `Contact updated: ${input.contact.name}`, clock);
  return getRegistration(tx, viewer, current.id);
}

export async function removeRegistrationContact(
  tx: Tx,
  viewer: Viewer,
  input: { id: string; contactId: string },
  clock: Clock,
): Promise<RegistrationDetailDto> {
  const current = await lockPending(tx, viewer, input.id);
  const gone = await requireContact(tx, current.id, input.contactId);
  const rest = await otherContacts(tx, current.id, input.contactId);
  if (!hasReachableContact(rest)) throw new ValidationError([{ path: 'contact', message: NEEDS_CONTACT }]);
  await tx
    .delete(registrationContacts)
    .where(and(eq(registrationContacts.id, input.contactId), eq(registrationContacts.registrationId, current.id)));
  await event(tx, viewer, current.id, `Contact removed: ${gone.name}`, clock);
  return getRegistration(tx, viewer, current.id);
}

const probeClock = fixedClock('2026-11-06T14:02:00Z');
const probeContact: ContactInput = { name: 'Probe', role: null, email: 'probe@example.com', phone: null };

export const isolation = defineIsolation<
  'editRegistration' | 'addRegistrationContact' | 'updateRegistrationContact' | 'removeRegistrationContact'
>({
  editRegistration: {
    scope: 'tenant',
    expect: 'not_found',
    probe: (tx, viewer, ctx) => editRegistration(tx, viewer, { id: ctx.b.registrationId, patch: { notes: 'probe' } }, probeClock),
  },
  addRegistrationContact: {
    scope: 'tenant',
    expect: 'not_found',
    probe: (tx, viewer, ctx) => addRegistrationContact(tx, viewer, { id: ctx.b.registrationId, contact: probeContact }, probeClock),
  },
  updateRegistrationContact: {
    scope: 'tenant',
    expect: 'not_found',
    probe: (tx, viewer, ctx) =>
      updateRegistrationContact(tx, viewer, { id: ctx.b.registrationId, contactId: ctx.b.contactId, contact: probeContact }, probeClock),
  },
  removeRegistrationContact: {
    scope: 'tenant',
    expect: 'not_found',
    probe: (tx, viewer, ctx) => removeRegistrationContact(tx, viewer, { id: ctx.b.registrationId, contactId: ctx.b.contactId }, probeClock),
  },
});
