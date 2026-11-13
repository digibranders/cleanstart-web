import { randomUUID } from 'node:crypto';
import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import { partners, registrationContacts, registrationEvents, registrations } from '@/db/schema';
import { type Clock, fixedClock } from '@/lib/clock';
import { normalizeDomain } from '@/lib/customer';
import {
  type DealRegion,
  PRODUCT_LABEL,
  type Product,
  type RegistrationStatus,
  STAGE_AWAITING_REVIEW,
} from '@/lib/domain';
import type { CustomerSuggestionDto, RegistrationDetailDto, RegistrationListItem } from '@/lib/dto';
import type { Viewer } from '@/server/auth/types';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/server/errors';
import { isUniqueViolation } from '@/server/registrations/pg-errors';
import { loadDetails, selectRows, toListItem } from '@/server/registrations/mappers';
import { assertUuid, registrationScope } from '@/server/registrations/scope';
import type { Tx } from './context';
import { defineIsolation } from './isolation.registry';
import { listManagerOptions } from './staff';

export interface ListRegistrationsInput {
  status?: RegistrationStatus[];
  product?: Product;
  region?: DealRegion;
  managerId?: string;
  /** Staff only. */
  partnerId?: string;
  /** Matches customer and, for staff, partner name. */
  q?: string;
  limit?: number;
}

export interface NewRegistrationsInput {
  /** Staff only (register on a partner's behalf). Partner viewers always use their own company. */
  partnerId?: string;
  customer: string;
  website: string | null;
  products: Product[];
  region: DealRegion;
  /** Must be one of listManagerOptions(). Defaults to the manager whose scope covers `region`. */
  managerId?: string | null;
  contact: { name: string; role: string | null; email: string | null; phone: string | null } | null;
  expectedClose: string | null;
  notes: string | null;
}

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 1000;
const OPEN_STATUSES: RegistrationStatus[] = ['pending', 'accepted'];
const SUGGESTION_LIMIT = 8;

const escapeLike = (text: string): string => text.replace(/[\\%_]/g, (c) => `\\${c}`);
const clampLimit = (limit: number | undefined): number => Math.min(Math.max(limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);

/**
 * Role scoping lives here: partner admin sees the company, partner sales only registered_by = viewer, staff sales
 * only their region, partner technical and marketing get ForbiddenError. Newest first by registeredAt.
 */
export async function listRegistrations(tx: Tx, viewer: Viewer, input: ListRegistrationsInput): Promise<RegistrationListItem[]> {
  const scope = registrationScope(viewer);
  if (input.partnerId !== undefined && viewer.kind !== 'staff') throw new ForbiddenError('the partner filter is staff only');
  const filters: Array<SQL | undefined> = [scope];
  if (input.status && input.status.length > 0) filters.push(inArray(registrations.status, input.status));
  if (input.product) filters.push(eq(registrations.product, input.product));
  if (input.region) filters.push(eq(registrations.region, input.region));
  if (input.managerId) filters.push(eq(registrations.managerId, input.managerId));
  if (input.partnerId) filters.push(eq(registrations.partnerId, input.partnerId));
  const q = input.q?.trim();
  if (q) {
    const like = `%${escapeLike(q)}%`;
    filters.push(viewer.kind === 'staff' ? or(ilike(registrations.customerName, like), ilike(partners.name, like)) : ilike(registrations.customerName, like));
  }
  const rows = await selectRows(tx)
    .where(and(...filters))
    .orderBy(desc(registrations.createdAt), desc(registrations.id))
    .limit(clampLimit(input.limit));
  return rows.map(toListItem);
}

/** Throws NotFoundError for another company's id and for a sales user's colleague's deal. */
export async function getRegistration(tx: Tx, viewer: Viewer, id: string): Promise<RegistrationDetailDto> {
  assertUuid(id, 'registration');
  const rows = await selectRows(tx).where(and(eq(registrations.id, id), registrationScope(viewer))).limit(1);
  const row = rows[0];
  if (!row) throw new NotFoundError('registration');
  const [detail] = await loadDetails(tx, [row]);
  if (!detail) throw new NotFoundError('registration');
  return detail;
}

/** Like getRegistration but SELECT ... FOR UPDATE on the registration row. For use before a state change. */
export async function lockRegistration(tx: Tx, viewer: Viewer, id: string): Promise<RegistrationDetailDto> {
  assertUuid(id, 'registration');
  const locked = await tx
    .select({ id: registrations.id })
    .from(registrations)
    .where(and(eq(registrations.id, id), registrationScope(viewer)))
    .limit(1)
    .for('update');
  if (!locked[0]) throw new NotFoundError('registration');
  return getRegistration(tx, viewer, id);
}

async function resolvePartnerId(viewer: Viewer, requested: string | undefined): Promise<string> {
  if (viewer.kind === 'partner') {
    if (requested !== undefined && requested !== viewer.partnerId) throw new ForbiddenError('partners register for their own company only');
    return viewer.partnerId;
  }
  if (!requested) throw new ValidationError([{ path: 'partnerId', message: 'Pick the partner.' }]);
  return requested;
}

/** The chosen manager if offered, else the partner's own manager when they cover the region, else the one covering the region. */
async function resolveManager(
  tx: Tx,
  viewer: Viewer,
  requested: string | null | undefined,
  region: DealRegion,
  partnerManagerId: string | null,
): Promise<string | null> {
  const options = await listManagerOptions(tx, viewer);
  if (requested) {
    if (!options.some((o) => o.id === requested)) {
      throw new ValidationError([{ path: 'managerId', message: 'Pick one of the listed account managers.' }]);
    }
    return requested;
  }
  const covering = options.filter((o) => o.region === region || o.region === 'all');
  const chosen =
    covering.find((o) => o.id === partnerManagerId) ??
    covering.find((o) => o.region === region) ??
    covering[0] ??
    options.find((o) => o.id === partnerManagerId) ??
    options[0];
  return chosen?.id ?? null;
}

const sameNameSql = (name: string): SQL => sql`lower(${registrations.customerName}) = ${name.toLowerCase()}`;

/**
 * One registration per product, status 'pending', stage 'Awaiting review', routing from the partner and region,
 * first event "Registered". Moves an 'onboarding' partner to 'active'. A unique violation on
 * (partner, lower(customer), product) while pending or accepted throws ConflictError('duplicate_registration').
 * Returns the created rows; the action audits (registration.submitted, one per product) and notifies the manager.
 */
export async function createRegistrations(
  tx: Tx,
  viewer: Viewer,
  input: NewRegistrationsInput,
  clock: Clock,
): Promise<RegistrationListItem[]> {
  const customer = input.customer.trim();
  if (!customer) throw new ValidationError([{ path: 'customer', message: "Enter the customer's company name." }]);
  const products = [...new Set(input.products)];
  if (products.length === 0) throw new ValidationError([{ path: 'products', message: 'Pick at least one product.' }]);

  const partnerId = await resolvePartnerId(viewer, input.partnerId);
  const [partner] = await tx
    .select({ id: partners.id, managerId: partners.managerId })
    .from(partners)
    .where(eq(partners.id, partnerId))
    .limit(1);
  if (!partner) throw new NotFoundError('partner');
  const managerId = await resolveManager(tx, viewer, input.managerId, input.region, partner.managerId);

  const taken = await tx
    .select({ product: registrations.product })
    .from(registrations)
    .where(
      and(
        eq(registrations.partnerId, partnerId),
        sameNameSql(customer),
        inArray(registrations.status, OPEN_STATUSES),
        inArray(registrations.product, products),
      ),
    );
  if (taken.length > 0) {
    throw new ConflictError(
      'duplicate_registration',
      `You already have an open registration for ${customer}: ${taken.map((t) => PRODUCT_LABEL[t.product]).join(', ')}.`,
    );
  }

  const now = clock.now();
  const created = products.map((product) => ({ id: randomUUID(), product }));
  try {
    await tx.insert(registrations).values(
      created.map(({ id, product }) => ({
        id,
        partnerId,
        registeredBy: viewer.id,
        registeredByName: viewer.name,
        customerName: customer,
        customerDomain: normalizeDomain(input.website),
        product,
        region: input.region,
        managerId,
        expectedClose: input.expectedClose,
        notes: input.notes,
        status: 'pending' as const,
        stage: STAGE_AWAITING_REVIEW,
        registeredOn: clock.today(),
        createdAt: now,
      })),
    );
  } catch (error) {
    if (isUniqueViolation(error, 'registrations_open_unique')) {
      throw new ConflictError('duplicate_registration', `You already have an open registration for ${customer}.`);
    }
    throw error;
  }

  if (input.contact) {
    const { name, role, email, phone } = input.contact;
    await tx.insert(registrationContacts).values(created.map(({ id }) => ({ registrationId: id, name, role, email, phone })));
  }
  await tx.insert(registrationEvents).values(
    created.map(({ id }) => ({ registrationId: id, at: now, text: 'Registered', byLabel: viewer.name, source: 'portal' as const })),
  );
  await tx.update(partners).set({ status: 'active' }).where(and(eq(partners.id, partnerId), eq(partners.status, 'onboarding')));

  const rows = await selectRows(tx)
    .where(inArray(registrations.id, created.map((c) => c.id)))
    .orderBy(asc(registrations.product));
  return rows.map(toListItem);
}

/** Rejected only. Adds the contact, sets status 'pending', stage 'Awaiting review', resubmittedOn today, clears the rejection. */
export async function resubmitRegistration(
  tx: Tx,
  viewer: Viewer,
  input: { id: string; contact: { name: string; role: string | null; email: string }; note: string | null },
  clock: Clock,
): Promise<RegistrationDetailDto> {
  const current = await lockRegistration(tx, viewer, input.id);
  if (current.status !== 'rejected') {
    throw new ConflictError('not_rejected', 'Only a registration that was not accepted can be resubmitted.');
  }
  try {
    await tx
      .update(registrations)
      .set({
        status: 'pending',
        stage: STAGE_AWAITING_REVIEW,
        resubmittedOn: clock.today(),
        decidedBy: null,
        decidedByLabel: null,
        decidedAt: null,
        rejectionReason: null,
      })
      .where(and(eq(registrations.id, current.id), eq(registrations.status, 'rejected')));
  } catch (error) {
    if (isUniqueViolation(error, 'registrations_open_unique')) {
      throw new ConflictError('duplicate_registration', `You already have an open registration for ${current.customer}.`);
    }
    throw error;
  }
  const note = input.note?.trim();
  await tx.insert(registrationContacts).values({
    registrationId: current.id,
    name: input.contact.name,
    role: input.contact.role,
    email: input.contact.email,
    createdAt: clock.now(),
  });
  await tx.insert(registrationEvents).values({
    registrationId: current.id,
    at: clock.now(),
    text: note ? `Resubmitted: ${note}` : 'Resubmitted with a new contact',
    byLabel: viewer.name,
    source: 'portal',
  });
  return getRegistration(tx, viewer, current.id);
}

/** The customers this company already registered, for the form's lookup. Partner viewers only; never another company's data. */
export async function customerSuggestions(tx: Tx, viewer: Viewer, input: { q: string }): Promise<CustomerSuggestionDto[]> {
  if (viewer.kind !== 'partner' || viewer.role === 'technical') throw new ForbiddenError('customer lookup is for partner sales and admin');
  const q = input.q.trim();
  const like = `%${escapeLike(q)}%`;
  const rows = await tx
    .select({
      id: registrations.id,
      name: registrations.customerName,
      website: registrations.customerDomain,
      product: registrations.product,
      status: registrations.status,
      protectionEnd: registrations.protectionEnd,
    })
    .from(registrations)
    .where(and(eq(registrations.partnerId, viewer.partnerId), q ? or(ilike(registrations.customerName, like), ilike(registrations.customerDomain, like)) : undefined))
    .orderBy(asc(registrations.createdAt), asc(registrations.id));
  const byName = new Map<string, CustomerSuggestionDto>();
  for (const row of rows) {
    const key = row.name.toLowerCase();
    const entry = byName.get(key) ?? { name: row.name, website: null, registrations: [] };
    entry.website = entry.website ?? row.website;
    entry.registrations.push({ id: row.id, product: row.product, status: row.status, protectionEnd: row.protectionEnd });
    byName.set(key, entry);
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name)).slice(0, SUGGESTION_LIMIT);
}

const probeClock = fixedClock('2026-11-06T14:02:00Z');

export const isolation = defineIsolation<
  'listRegistrations' | 'getRegistration' | 'lockRegistration' | 'createRegistrations' | 'resubmitRegistration' | 'customerSuggestions'
>({
  listRegistrations: {
    scope: 'tenant',
    expect: 'empty',
    probe: async (tx, viewer) => (await listRegistrations(tx, viewer, { limit: 1000 })).filter((r) => r.partnerId !== viewer.partnerId),
  },
  getRegistration: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => getRegistration(tx, viewer, ctx.b.registrationId) },
  lockRegistration: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => lockRegistration(tx, viewer, ctx.b.registrationId) },
  createRegistrations: {
    scope: 'tenant',
    expect: 'forbidden',
    probe: (tx, viewer, ctx) =>
      createRegistrations(
        tx,
        viewer,
        { partnerId: ctx.b.partnerId, customer: 'Isolation Probe', website: null, products: ['images'], region: 'india', contact: null, expectedClose: null, notes: null },
        probeClock,
      ),
  },
  resubmitRegistration: {
    scope: 'tenant',
    expect: 'not_found',
    probe: (tx, viewer, ctx) =>
      resubmitRegistration(tx, viewer, { id: ctx.b.registrationId, contact: { name: 'Probe', role: null, email: 'probe@example.com' }, note: null }, probeClock),
  },
  customerSuggestions: {
    scope: 'tenant',
    expect: 'empty',
    probe: async (tx, viewer, ctx) =>
      (await customerSuggestions(tx, viewer, { q: '' })).flatMap((s) => s.registrations).filter((r) => r.id === ctx.b.registrationId),
  },
});
