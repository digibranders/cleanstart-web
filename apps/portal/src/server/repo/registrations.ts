import { randomUUID } from 'node:crypto';
import { and, asc, desc, eq, gte, ilike, inArray, isNotNull, isNull, lte, ne, notExists, or, sql, type SQL } from 'drizzle-orm';
import {
  partners,
  registrationContacts,
  registrationEvents,
  registrationMessages,
  registrationReminders,
  registrations,
} from '@/db/schema';
import { type Clock, fixedClock } from '@/lib/clock';
import { normalizeDomain } from '@/lib/customer';
import { addDays, fmtLong } from '@/lib/dates';
import {
  EXPIRING_SOON_DAYS,
  EXPIRY_REMINDER_DAYS,
  EXTENSION_DAYS,
  extendedEnd,
  isOverSla,
  protectionEndFor,
  RECENT_DECISION_DAYS,
  UNDO_WINDOW_MINUTES,
  waitingBusinessDays,
} from '@/lib/deal-rules';
import type { StageLabel } from '@/server/hubspot/types';
import {
  type DealCurrency,
  type DealRegion,
  PRODUCT_LABEL,
  type Product,
  type RegistrationStatus,
  STAGE_AWAITING_REVIEW,
  STAGE_NOT_ACCEPTED,
} from '@/lib/domain';
import type {
  ApprovalQueueDto,
  ApprovalRowDto,
  CustomerSuggestionDto,
  DecisionResult,
  ExtensionDecisionResult,
  ExtensionResult,
  RegisterAgainDto,
  ReminderCandidateDto,
  RegistrationCheckDto,
  RegistrationDetailDto,
  RegistrationListItem,
} from '@/lib/dto';
import type { SystemActor, Viewer } from '@/server/auth/types';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/server/errors';
import { computeChecks, loadDetails, selectRows, toListItem } from '@/server/registrations/mappers';
import { isUniqueViolation } from '@/server/registrations/pg-errors';
import { nextRegistrationReference } from '@/server/registrations/reference';
import { decisionRecipients, threadRecipients } from '@/server/registrations/recipients';
import { assertUuid, registrationScope } from '@/server/registrations/scope';
import { assertStaff, type Tx } from './context';
import { defineIsolation } from './isolation.registry';
import { listManagerOptions } from './staff';
import { isAllRegions, scopeCovers } from '@/lib/regions';
import { assertRegionAssignable } from './regions';
import { scopeCondition } from '@/server/staff-scope';

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
  /** Several contacts, the first one primary. When given it replaces `contact`. */
  contacts?: Array<{ name: string; role: string | null; email: string | null; phone: string | null }>;
  expectedClose: string | null;
  notes: string | null;
  /** The deal details below are all optional. A missing currency is stored as USD. */
  dealValue?: number | null;
  currency?: DealCurrency;
  customerCountry?: string | null;
  customerIndustry?: string | null;
  useCase?: string | null;
  competitor?: string | null;
  seats?: number | null;
  salesStage?: string | null;
  decisionDate?: string | null;
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
      throw new ValidationError([{ path: 'managerId', message: 'Pick one of the listed partner managers.' }]);
    }
    return requested;
  }
  const covering = options.filter((o) => scopeCovers(o.regions, region));
  const chosen =
    covering.find((o) => o.id === partnerManagerId) ??
    covering.find((o) => !isAllRegions(o.regions)) ??
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
  await assertRegionAssignable(tx, input.region);
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
  const created: Array<{ id: string; product: Product; reference: string }> = [];
  for (const product of products) created.push({ id: randomUUID(), product, reference: await nextRegistrationReference(tx, now) });
  try {
    await tx.insert(registrations).values(
      created.map(({ id, product, reference }) => ({
        id,
        reference,
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
        dealValue: input.dealValue ?? null,
        ...(input.currency ? { currency: input.currency } : {}),
        customerCountry: input.customerCountry ?? null,
        customerIndustry: input.customerIndustry ?? null,
        useCase: input.useCase ?? null,
        competitor: input.competitor ?? null,
        seats: input.seats ?? null,
        salesStage: input.salesStage ?? null,
        decisionDate: input.decisionDate ?? null,
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

  const contacts = input.contacts ?? (input.contact ? [input.contact] : []);
  if (contacts.length > 0) {
    // Contacts read newest first (see loadDetails), so the primary one gets the latest timestamp and leads.
    await tx.insert(registrationContacts).values(
      created.flatMap(({ id }) =>
        contacts.map(({ name, role, email, phone }, index) => ({
          registrationId: id,
          name,
          role,
          email,
          phone,
          createdAt: new Date(now.getTime() - index),
        })),
      ),
    );
  }
  await tx.insert(registrationEvents).values(
    created.map(({ id }) => ({
      registrationId: id,
      at: now,
      text: viewer.kind === 'staff' ? 'Registered by CleanStart on behalf of the partner' : 'Registered',
      byLabel: viewer.name,
      source: 'portal' as const,
    })),
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

/** What the register-again form prefills from an earlier registration of the viewer's own company. */
export async function getRegisterAgainSource(tx: Tx, viewer: Viewer, id: string): Promise<RegisterAgainDto | null> {
  if (viewer.kind !== 'partner') return null;
  let source: RegistrationDetailDto;
  try {
    source = await getRegistration(tx, viewer, id);
  } catch (error) {
    if (error instanceof NotFoundError) return null;
    throw error;
  }
  if (source.partnerId !== viewer.partnerId) return null;
  return {
    customer: source.customer,
    website: source.website,
    country: source.customerCountry,
    industry: source.customerIndustry,
    contacts: source.contacts.map(({ name, role, email, phone }) => ({ name, role, email, phone })),
  };
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

const STAGE_ACCEPTED: StageLabel = 'Accepted';
const MAX_REASON = 500;
const DAY_MS = 86_400_000;

/** The automatic timeline event and thread line a decision writes, both stamped with the decision time so an undo finds exactly them. */
async function writeDecisionLines(
  tx: Tx,
  viewer: Viewer,
  registrationId: string,
  at: Date,
  eventText: string,
  threadText: string,
): Promise<void> {
  await tx.insert(registrationEvents).values({ registrationId, at, text: eventText, byLabel: viewer.name, source: 'portal', auto: true });
  await tx.insert(registrationMessages).values({
    id: randomUUID(),
    registrationId,
    authorId: viewer.id,
    authorName: viewer.name,
    authorOrg: 'CleanStart',
    side: 'staff',
    body: threadText,
    auto: true,
    createdAt: at,
  });
}

async function decisionResult(tx: Tx, viewer: Viewer, id: string, decidedAt: Date): Promise<DecisionResult> {
  const registration = await getRegistration(tx, viewer, id);
  const recipientUserIds = await decisionRecipients(tx, { partnerId: registration.partnerId, registeredById: registration.registeredById });
  return { registration, partnerName: registration.partnerName, decidedAt: decidedAt.toISOString(), recipientUserIds };
}

/**
 * Accept. Requires status 'pending' (else ConflictError('already_decided')). Sets status 'accepted', stage 'Accepted',
 * decided* fields, protection_end = protectionEndFor(clock.today()), writes the timeline event "Accepted, protected
 * until <d>" and the automatic thread line (both auto = true), and returns the recipients. The action audits, enqueues
 * registration.create and notifies.
 */
export async function acceptRegistration(tx: Tx, viewer: Viewer, input: { id: string }, clock: Clock): Promise<DecisionResult> {
  assertStaff(viewer);
  const current = await lockRegistration(tx, viewer, input.id);
  if (current.status !== 'pending') throw new ConflictError('already_decided', 'This registration was already decided.');
  const now = clock.now();
  const end = protectionEndFor(clock.today());
  await tx
    .update(registrations)
    .set({
      status: 'accepted',
      stage: STAGE_ACCEPTED,
      decidedBy: viewer.id,
      decidedByLabel: viewer.name,
      decidedAt: now,
      protectionEnd: end,
      rejectionReason: null,
    })
    .where(and(eq(registrations.id, current.id), eq(registrations.status, 'pending')));
  await writeDecisionLines(tx, viewer, current.id, now, `Accepted, protected until ${fmtLong(end)}`, `Accepted. Protected until ${fmtLong(end)}.`);
  return decisionResult(tx, viewer, current.id, now);
}

/** Reject. Needs a non empty reason. Sets status 'rejected', stage 'Not accepted', and the auto event and thread line. */
export async function rejectRegistration(
  tx: Tx,
  viewer: Viewer,
  input: { id: string; reason: string },
  clock: Clock,
): Promise<DecisionResult> {
  assertStaff(viewer);
  const reason = input.reason.trim();
  if (!reason) throw new ValidationError([{ path: 'reason', message: 'Add a reason the partner will see.' }]);
  if (reason.length > MAX_REASON) throw new ValidationError([{ path: 'reason', message: `Keep the reason under ${MAX_REASON} characters.` }]);
  const current = await lockRegistration(tx, viewer, input.id);
  if (current.status !== 'pending') throw new ConflictError('already_decided', 'This registration was already decided.');
  const now = clock.now();
  await tx
    .update(registrations)
    .set({
      status: 'rejected',
      stage: STAGE_NOT_ACCEPTED,
      decidedBy: viewer.id,
      decidedByLabel: viewer.name,
      decidedAt: now,
      rejectionReason: reason,
    })
    .where(and(eq(registrations.id, current.id), eq(registrations.status, 'pending')));
  await writeDecisionLines(tx, viewer, current.id, now, `Not accepted: ${reason}`, `Not accepted. ${reason}`);
  return decisionResult(tx, viewer, current.id, now);
}

/**
 * Undo within UNDO_WINDOW_MINUTES by the person who decided. Back to 'pending', clears decision fields, deletes the
 * auto event and auto thread line. Throws ConflictError('undo_window_closed') and ConflictError('deal_in_crm') when
 * a HubSpot deal already exists.
 */
export async function undoDecision(tx: Tx, viewer: Viewer, input: { id: string }, clock: Clock): Promise<RegistrationDetailDto> {
  assertStaff(viewer);
  const current = await lockRegistration(tx, viewer, input.id);
  if (current.status !== 'accepted' && current.status !== 'rejected') {
    throw new ConflictError('not_decided', 'Only a registration that was just accepted or rejected can be undone.');
  }
  if (current.crmRef !== null) {
    throw new ConflictError('deal_in_crm', 'The HubSpot deal already exists, so this decision can no longer be undone here.');
  }
  const [raw] = await tx
    .select({ decidedBy: registrations.decidedBy, decidedAt: registrations.decidedAt })
    .from(registrations)
    .where(eq(registrations.id, current.id))
    .limit(1);
  const decidedAt = raw?.decidedAt;
  if (!raw || !decidedAt || raw.decidedBy !== viewer.id || clock.now().getTime() - decidedAt.getTime() > UNDO_WINDOW_MINUTES * 60_000) {
    throw new ConflictError('undo_window_closed', `A decision can be undone by the person who took it, within ${UNDO_WINDOW_MINUTES} minutes.`);
  }
  const events = await tx
    .delete(registrationEvents)
    .where(and(eq(registrationEvents.registrationId, current.id), eq(registrationEvents.auto, true), eq(registrationEvents.at, decidedAt)))
    .returning({ id: registrationEvents.id });
  if (events.length === 0) throw new Error(`undoDecision: no automatic timeline event at the decision time for ${current.id}`);
  await tx
    .delete(registrationMessages)
    .where(and(eq(registrationMessages.registrationId, current.id), eq(registrationMessages.auto, true), eq(registrationMessages.createdAt, decidedAt)));
  await tx
    .update(registrations)
    .set({
      status: 'pending',
      stage: STAGE_AWAITING_REVIEW,
      protectionEnd: null,
      decidedBy: null,
      decidedByLabel: null,
      decidedAt: null,
      rejectionReason: null,
    })
    .where(eq(registrations.id, current.id));
  return getRegistration(tx, viewer, current.id);
}

/** Conflict and same-customer hints from portal data. The HubSpot check is layered on by the action (H4.7). */
export async function conflictChecks(
  tx: Tx,
  viewer: Viewer,
  input: { registrationIds: string[] },
): Promise<Record<string, RegistrationCheckDto>> {
  assertStaff(viewer);
  if (input.registrationIds.length === 0) return {};
  const rows = await selectRows(tx).where(and(inArray(registrations.id, input.registrationIds), registrationScope(viewer)));
  return computeChecks(tx, rows);
}

const bySince = (a: RegistrationDetailDto, b: RegistrationDetailDto): number =>
  (a.resubmittedOn ?? a.registeredOn).localeCompare(b.resubmittedOn ?? b.registeredOn) || a.registeredAt.localeCompare(b.registeredAt);

/**
 * Staff (partner manager, staff sales in scope). `scope: 'mine'` = the viewer's region or managerId; 'all' = every region in
 * the viewer's scope. The counts always cover the viewer's whole scope, whichever rows are listed.
 */
export async function listApprovalQueue(
  tx: Tx,
  viewer: Viewer,
  input: { scope: 'mine' | 'all' },
  clock: Clock,
): Promise<ApprovalQueueDto> {
  assertStaff(viewer);
  const scope = registrationScope(viewer);
  const mine: SQL | undefined =
    input.scope === 'mine' && viewer.kind === 'staff'
      ? isAllRegions(viewer.regions)
        ? eq(registrations.managerId, viewer.id)
        : scopeCondition(viewer.regions, registrations.region)
      : undefined;
  const now = clock.now();
  const today = clock.today();
  const undoCutoff = new Date(now.getTime() - UNDO_WINDOW_MINUTES * 60_000);
  const recentCutoff = new Date(now.getTime() - RECENT_DECISION_DAYS * DAY_MS);

  const rows = await selectRows(tx).where(
    and(
      scope,
      mine,
      or(
        eq(registrations.status, 'pending'),
        and(
          inArray(registrations.status, ['accepted', 'rejected']),
          eq(registrations.decidedBy, viewer.id),
          gte(registrations.decidedAt, undoCutoff),
          isNull(registrations.hubspotDealId),
        ),
      ),
    ),
  );
  const details = await loadDetails(tx, rows);
  const checks = await computeChecks(tx, rows);
  const queueRows: ApprovalRowDto[] = details
    .map((registration): ApprovalRowDto => {
      const since = registration.resubmittedOn ?? registration.registeredOn;
      return {
        registration,
        check: checks[registration.id] ?? { kind: 'none' },
        waitingBusinessDays: waitingBusinessDays(since, today),
        overSla: registration.status === 'pending' && isOverSla(since, today),
        canUndo: registration.status !== 'pending',
      };
    })
    .sort((a, b) => bySince(a.registration, b.registration));

  const decidedWhere = and(scope, isNotNull(registrations.decidedAt), gte(registrations.decidedAt, recentCutoff), ne(registrations.status, 'pending'));
  const [decided] = await tx
    .select({
      accepted: sql<number>`count(*) filter (where ${registrations.status} <> 'rejected')::int`,
      rejected: sql<number>`count(*) filter (where ${registrations.status} = 'rejected')::int`,
    })
    .from(registrations)
    .where(decidedWhere);
  const [expiring] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(registrations)
    .where(and(scope, eq(registrations.status, 'accepted'), gte(registrations.protectionEnd, today), lte(registrations.protectionEnd, addDays(today, EXPIRING_SOON_DAYS))));
  const recent = await selectRows(tx).where(decidedWhere).orderBy(desc(registrations.decidedAt), desc(registrations.id)).limit(50);

  const waiting = queueRows.filter((r) => r.registration.status === 'pending');
  return {
    rows: queueRows,
    counts: {
      waiting: waiting.length,
      overSla: waiting.filter((r) => r.overSla).length,
      conflicts: waiting.filter((r) => r.check.kind === 'conflict').length,
      acceptedLast7Days: decided?.accepted ?? 0,
      rejectedLast7Days: decided?.rejected ?? 0,
      expiringIn14Days: expiring?.n ?? 0,
    },
    recentDecisions: recent.map(toListItem),
  };
}

/** Staff. Pending registrations in the viewer's scope, for the nav badge. Marketing has no deals and counts 0. */
export async function countWaiting(tx: Tx, viewer: Viewer): Promise<number> {
  assertStaff(viewer);
  if (viewer.role === 'marketing') return 0;
  const [row] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(registrations)
    .where(and(registrationScope(viewer), eq(registrations.status, 'pending')));
  return row?.n ?? 0;
}

export interface ConflictHintInput {
  registrationId: string;
  customerName: string;
  customerDomain: string | null;
  partnerHubspotCompanyId: string | null;
}

/** Staff. What the read only HubSpot conflict hint needs for the waiting registrations among `registrationIds`. */
export async function conflictInputs(tx: Tx, viewer: Viewer, input: { registrationIds: string[] }): Promise<ConflictHintInput[]> {
  assertStaff(viewer);
  if (input.registrationIds.length === 0) return [];
  const rows = await tx
    .select({
      id: registrations.id,
      customerName: registrations.customerName,
      customerDomain: registrations.customerDomain,
      partnerHubspotCompanyId: partners.hubspotCompanyId,
    })
    .from(registrations)
    .innerJoin(partners, eq(partners.id, registrations.partnerId))
    .where(and(inArray(registrations.id, input.registrationIds), eq(registrations.status, 'pending'), registrationScope(viewer)));
  return rows.map((r) => ({
    registrationId: r.id,
    customerName: r.customerName,
    customerDomain: r.customerDomain,
    partnerHubspotCompanyId: r.partnerHubspotCompanyId,
  }));
}

const MAX_EXTENSION_REASON = 1000;

/** Partner. Accepted only, once (MAX_EXTENSIONS). Throws ConflictError('extension_already_used'). */
export async function requestExtension(
  tx: Tx,
  viewer: Viewer,
  input: { id: string; reason: string },
  clock: Clock,
): Promise<ExtensionResult> {
  const reason = input.reason.trim();
  if (!reason) throw new ValidationError([{ path: 'reason', message: 'Tell CleanStart why you need more time.' }]);
  if (reason.length > MAX_EXTENSION_REASON) {
    throw new ValidationError([{ path: 'reason', message: `Keep it under ${MAX_EXTENSION_REASON} characters.` }]);
  }
  const current = await lockRegistration(tx, viewer, input.id);
  if (current.status !== 'accepted') throw new ConflictError('not_accepted', 'Only an accepted registration can be extended.');
  if (current.extensionStatus === 'requested') {
    throw new ConflictError('extension_already_used', 'An extension for this registration is already waiting for a decision.');
  }
  if (current.extensionStatus === 'granted') {
    throw new ConflictError('extension_already_used', 'This registration already had its one extension.');
  }
  const now = clock.now();
  await tx
    .update(registrations)
    .set({ extensionStatus: 'requested', extensionRequestedAt: now, extensionReason: reason, extensionGrantedAt: null, extensionDays: null })
    .where(eq(registrations.id, current.id));
  await tx.insert(registrationEvents).values({
    registrationId: current.id,
    at: now,
    text: `Extension requested: ${reason}`,
    byLabel: viewer.name,
    source: 'portal',
  });
  const registration = await getRegistration(tx, viewer, current.id);
  return { registration, partnerName: registration.partnerName, managerUserId: registration.managerId };
}

/**
 * Staff. Needs extension_status 'requested' (else ConflictError('extension_not_requested')). Granting adds
 * EXTENSION_DAYS to protection_end; the action enqueues registration.update_end with version newProtectionEnd.
 */
export async function decideExtension(
  tx: Tx,
  viewer: Viewer,
  input: { id: string; decision: 'grant' | 'decline'; note: string | null },
  clock: Clock,
): Promise<ExtensionDecisionResult> {
  assertStaff(viewer);
  const current = await lockRegistration(tx, viewer, input.id);
  if (current.extensionStatus !== 'requested') {
    throw new ConflictError('extension_not_requested', 'There is no extension request to decide.');
  }
  const note = input.note?.trim() || null;
  const suffix = note ? `: ${note}` : '';
  const now = clock.now();
  let newProtectionEnd: string | null = null;
  if (input.decision === 'grant') {
    if (current.status !== 'accepted' || !current.protectionEnd) {
      throw new ConflictError('not_accepted', 'Only an accepted registration can be extended.');
    }
    newProtectionEnd = extendedEnd(current.protectionEnd);
    await tx
      .update(registrations)
      .set({ protectionEnd: newProtectionEnd, extensionStatus: 'granted', extensionGrantedAt: now, extensionDays: EXTENSION_DAYS })
      .where(eq(registrations.id, current.id));
    await tx.insert(registrationEvents).values({
      registrationId: current.id,
      at: now,
      text: `Extension granted, protected until ${fmtLong(newProtectionEnd)}${suffix}`,
      byLabel: viewer.name,
      source: 'portal',
    });
  } else {
    await tx.update(registrations).set({ extensionStatus: 'declined' }).where(eq(registrations.id, current.id));
    await tx.insert(registrationEvents).values({
      registrationId: current.id,
      at: now,
      text: `Extension declined${suffix}`,
      byLabel: viewer.name,
      source: 'portal',
    });
  }
  const registration = await getRegistration(tx, viewer, current.id);
  const recipientUserIds = await decisionRecipients(tx, { partnerId: registration.partnerId, registeredById: registration.registeredById });
  return { registration, partnerName: registration.partnerName, granted: input.decision === 'grant', newProtectionEnd, recipientUserIds };
}

/**
 * Public (system actor, jobs/expiry-reminders.ts, M2.4). Accepted registrations whose protection ends in exactly
 * 14 or 3 days from today and that have no registration_reminders row for (id, daysBefore, protectionEnd).
 */
export async function listReminderCandidates(tx: Tx, _actor: SystemActor, clock: Clock): Promise<ReminderCandidateDto[]> {
  const today = clock.today();
  const candidates: ReminderCandidateDto[] = [];
  for (const daysBefore of EXPIRY_REMINDER_DAYS) {
    const end = addDays(today, daysBefore);
    const rows = await tx
      .select({
        id: registrations.id,
        customer: registrations.customerName,
        product: registrations.product,
        partnerId: registrations.partnerId,
        registeredBy: registrations.registeredBy,
      })
      .from(registrations)
      .where(
        and(
          eq(registrations.status, 'accepted'),
          eq(registrations.protectionEnd, end),
          notExists(
            tx
              .select({ one: sql`1` })
              .from(registrationReminders)
              .where(
                and(
                  eq(registrationReminders.registrationId, registrations.id),
                  eq(registrationReminders.daysBefore, daysBefore),
                  eq(registrationReminders.protectionEnd, end),
                ),
              ),
          ),
        ),
      )
      .orderBy(asc(registrations.createdAt), asc(registrations.id));
    for (const row of rows) {
      candidates.push({
        registrationId: row.id,
        customer: row.customer,
        product: row.product,
        partnerId: row.partnerId,
        protectionEnd: end,
        daysBefore,
        recipientUserIds: await threadRecipients(tx, { partnerId: row.partnerId, registeredById: row.registeredBy }),
      });
    }
  }
  return candidates;
}

/** Public. Inserts the registration_reminders row. Idempotent; true only for the call that created the row. */
export async function markReminderSent(
  tx: Tx,
  _actor: SystemActor,
  input: { registrationId: string; daysBefore: number; protectionEnd: string },
  clock: Clock,
): Promise<boolean> {
  const created = await tx
    .insert(registrationReminders)
    .values({ registrationId: input.registrationId, daysBefore: input.daysBefore, protectionEnd: input.protectionEnd, sentAt: clock.now() })
    .onConflictDoNothing()
    .returning({ id: registrationReminders.registrationId });
  return created.length > 0;
}

/** Staff. Accepted registrations with an extension request waiting, oldest request first, in the viewer's scope. */
export async function listExtensionRequests(tx: Tx, viewer: Viewer): Promise<RegistrationDetailDto[]> {
  assertStaff(viewer);
  const rows = await selectRows(tx)
    .where(and(registrationScope(viewer), eq(registrations.status, 'accepted'), eq(registrations.extensionStatus, 'requested')))
    .orderBy(asc(registrations.extensionRequestedAt), asc(registrations.id));
  return loadDetails(tx, rows);
}

const probeClock = fixedClock('2026-11-06T14:02:00Z');

export const isolation = defineIsolation<
  | 'listRegistrations' | 'getRegistration' | 'lockRegistration' | 'createRegistrations' | 'resubmitRegistration'
  | 'customerSuggestions' | 'getRegisterAgainSource' | 'acceptRegistration' | 'rejectRegistration' | 'undoDecision' | 'conflictChecks'
  | 'listApprovalQueue' | 'countWaiting' | 'conflictInputs' | 'requestExtension' | 'decideExtension'
  | 'listReminderCandidates' | 'markReminderSent' | 'listExtensionRequests'
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
  getRegisterAgainSource: { scope: 'tenant', expect: 'empty', probe: (tx, viewer, ctx) => getRegisterAgainSource(tx, viewer, ctx.b.registrationId) },
  customerSuggestions: {
    scope: 'tenant',
    expect: 'empty',
    probe: async (tx, viewer, ctx) =>
      (await customerSuggestions(tx, viewer, { q: '' })).flatMap((s) => s.registrations).filter((r) => r.id === ctx.b.registrationId),
  },
  acceptRegistration: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer, ctx) => acceptRegistration(tx, viewer, { id: ctx.b.registrationId }, probeClock) },
  rejectRegistration: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer, ctx) => rejectRegistration(tx, viewer, { id: ctx.b.registrationId, reason: 'probe' }, probeClock) },
  undoDecision: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer, ctx) => undoDecision(tx, viewer, { id: ctx.b.registrationId }, probeClock) },
  conflictChecks: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer, ctx) => conflictChecks(tx, viewer, { registrationIds: [ctx.b.registrationId] }) },
  listApprovalQueue: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer) => listApprovalQueue(tx, viewer, { scope: 'all' }, probeClock) },
  countWaiting: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer) => countWaiting(tx, viewer) },
  conflictInputs: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer, ctx) => conflictInputs(tx, viewer, { registrationIds: [ctx.b.registrationId] }) },
  requestExtension: {
    scope: 'tenant',
    expect: 'not_found',
    probe: (tx, viewer, ctx) => requestExtension(tx, viewer, { id: ctx.b.registrationId, reason: 'isolation probe' }, probeClock),
  },
  decideExtension: {
    scope: 'staff-only',
    expect: 'forbidden',
    probe: (tx, viewer, ctx) => decideExtension(tx, viewer, { id: ctx.b.registrationId, decision: 'grant', note: null }, probeClock),
  },
  listExtensionRequests: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer) => listExtensionRequests(tx, viewer) },
  listReminderCandidates: { scope: 'public', reason: 'Takes a SystemActor and is called only by jobs/expiry-reminders.ts through withSystem.' },
  markReminderSent: { scope: 'public', reason: 'Takes a SystemActor and is called only by jobs/expiry-reminders.ts through withSystem.' },
});
