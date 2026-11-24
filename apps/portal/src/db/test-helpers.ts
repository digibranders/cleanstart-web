import { createHash, randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { Client, type Pool } from 'pg';
import { db, type Db, pool } from '@/db/client';
import {
  accessRequests,
  applications,
  chatAttachments,
  chatConversations,
  chatMessages,
  auditLog,
  authAccounts,
  documentAudience,
  documentOpens,
  documents,
  invites,
  partners,
  registrationContacts,
  registrationMessages,
  registrations,
  users,
} from '@/db/schema';
import type {
  DealCurrency,
  DealRegion,
  PartnerCategory,
  PartnerRegion,
  PartnerRole,
  Product,
  RegistrationStatus,
  StaffRegion,
  StaffScope,
  StaffRole,
} from '@/lib/domain';
import type { PartnerViewer, StaffViewer, Viewer } from '@/server/auth/types';
import { decodeScope, normalizeScope } from '@/lib/regions';
import { hashPassword } from '@/server/auth/passwords';
import { loadScope, setStaffScope } from '@/server/staff-scope';
import { nextRegistrationReference } from '@/server/registrations/reference';
import type { IsolationContext, TenantFixture } from '@/server/repo/isolation.registry';

/** System scope db for the worker's database (portal_app, app.kind = 'system'). Same object every call. */
export const testDb = (): Db => db;

/** The pool behind testDb(), for advisory lock tests (runLocked). */
export const testPool = (): Pool => pool;

/**
 * TRUNCATE every table in public except the drizzle migration table, RESTART IDENTITY CASCADE, then restarts
 * application_reference_seq and registration_reference_seq. Runs as portal_owner on its own connection (the app role has no TRUNCATE).
 * The argument is accepted and ignored so the HubSpot plan's `resetDb(db)` call sites work unchanged.
 */
export async function resetDb(_db?: Db): Promise<void> {
  const url = process.env.PORTAL_TEST_OWNER_URL;
  if (!url) throw new Error('PORTAL_TEST_OWNER_URL is not set. The Vitest setup file sets it from apps/portal/.env.');
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const { rows } = await client.query<{ tablename: string }>(
      "select tablename from pg_tables where schemaname = 'public' and tablename <> '__drizzle_migrations'",
    );
    const names = rows.map((row) => `"${row.tablename}"`).join(', ');
    await client.query(`truncate ${names} restart identity cascade`);
    // regions is reference data, so a reset puts the migration's rows back (row level security is forced for the owner too).
    await client.query("select set_config('app.kind', 'system', false)");
    await client.query(
      "insert into regions (key, name, sort_order, active) values ('india', 'India', 10, true), ('middle_east', 'Middle East', 20, true), ('eu', 'EU', 30, true), ('us', 'US', 40, true), ('elsewhere', 'Elsewhere', 900, false)",
    );
    await client.query('alter sequence application_reference_seq restart with 1');
    await client.query('alter sequence registration_reference_seq restart with 1');
  } finally {
    await client.end();
  }
}

let counter = 0;
const next = (): number => {
  counter += 1;
  return counter;
};

const sha256Hex = (value: string): string => createHash('sha256').update(value).digest('hex');

const PRODUCT_BY_LABEL: Record<string, Product> = {
  'CleanStart Images': 'images',
  'Clean Libraries': 'libraries',
  CleanSight: 'cleansight',
};
const REGION_BY_LABEL: Record<string, DealRegion> = { India: 'india', 'Middle East': 'middle_east', EU: 'eu', US: 'us' };
const STAFF_ONLY_ROLES: ReadonlySet<string> = new Set(['partner_manager', 'marketing']);

type PartnerRow = typeof partners.$inferSelect;
type UserRow = typeof users.$inferSelect;
type RegistrationRow = typeof registrations.$inferSelect;
type ApplicationRow = typeof applications.$inferSelect;
type InviteRow = typeof invites.$inferSelect;
type AccessRequestRow = typeof accessRequests.$inferSelect;
type DocumentRow = typeof documents.$inferSelect;

const first = <T>(rows: T[], what: string): T => {
  const row = rows[0];
  if (!row) throw new Error(`test helper: insert of ${what} returned no row`);
  return row;
};

export interface MakePartnerInput {
  name?: string;
  domain?: string;
  category?: PartnerCategory;
  region?: PartnerRegion;
  status?: PartnerRow['status'];
  managerId?: string | null;
  hubspotCompanyId?: string | null;
}

/** Defaults: unique "Partner N", "partner-n.example.com", category 'channel', region 'india', status 'active'. */
export async function makePartner(database: Db, input: MakePartnerInput): Promise<PartnerRow> {
  const n = next();
  const rows = await database
    .insert(partners)
    .values({
      name: input.name ?? `Partner ${n}`,
      domain: (input.domain ?? `partner-${n}.example.com`).toLowerCase(),
      category: input.category ?? 'channel',
      region: input.region ?? 'india',
      status: input.status ?? 'active',
      managerId: input.managerId ?? null,
      hubspotCompanyId: input.hubspotCompanyId ?? null,
    })
    .returning();
  return first(rows, 'partner');
}

export interface MakeUserInput {
  partnerId?: string | null;
  kind?: 'partner' | 'staff';
  role?: string;
  email?: string;
  name?: string;
  status?: 'invited' | 'active' | 'disabled';
  /** A staff scope: 'all', one region key, or several keys. Default 'all'. */
  region?: StaffRegion | readonly string[];
  /** Inserts a Better Auth credential account hashed with hashPassword (added by M0.7). */
  password?: string;
  hubspotContactId?: string | null;
}

/**
 * Defaults to a partner user, role 'partner_admin', status 'active', unique email. A partner user with no partnerId
 * gets a fresh partner. kind 'staff' (or a staff only role such as 'partner_manager' or 'marketing') makes a staff
 * user, default role 'partner_manager', with a staff_scopes row for `region` (default 'all').
 */
export async function makeUser(database: Db, input: MakeUserInput): Promise<UserRow> {
  const n = next();
  const kind = input.kind ?? (input.role !== undefined && STAFF_ONLY_ROLES.has(input.role) ? 'staff' : 'partner');
  const partnerId = kind === 'staff' ? null : (input.partnerId ?? (await makePartner(database, {})).id);
  const rows = await database
    .insert(users)
    .values({
      email: (input.email ?? `user-${n}@example.com`).toLowerCase(),
      name: input.name ?? `User ${n}`,
      kind,
      partnerId,
      role: input.role ?? (kind === 'staff' ? 'partner_manager' : 'partner_admin'),
      status: input.status ?? 'active',
      hubspotContactId: input.hubspotContactId ?? null,
    })
    .returning();
  const user = first(rows, 'user');
  if (kind === 'staff') await setStaffScope(database, user.id, scopeOf(input.region ?? 'all'));
  if (input.password !== undefined) {
    await database
      .insert(authAccounts)
      .values({ userId: user.id, providerId: 'credential', accountId: user.id, password: await hashPassword(input.password) });
  }
  return user;
}

export interface MakeRegistrationInput {
  partnerId?: string;
  customerName?: string;
  customerDomain?: string | null;
  /** A code ('libraries') or a display label ('Clean Libraries'); stored as the code. The HubSpot plan passes labels. */
  product?: Product | 'CleanStart Images' | 'Clean Libraries' | 'CleanSight';
  /** A code ('india') or a label ('India', 'Middle East'); stored as the code. */
  region?: DealRegion | 'India' | 'Middle East';
  status?: RegistrationStatus;
  stage?: string;
  registeredOn?: string;
  protectionEnd?: string | null;
  closedOn?: string | null;
  registeredBy?: string | null;
  managerId?: string | null;
  hubspotDealId?: string | null;
  hubspotStageId?: string | null;
  contacts?: Array<{ name: string; role?: string; email?: string; phone?: string }>;
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

/**
 * Defaults: a fresh partner when partnerId is omitted, customer "Customer N", product 'images', region 'india',
 * status 'pending', registeredOn '2026-11-06'. Status 'accepted' without protectionEnd gets '2027-02-02'.
 * Status 'rejected' gets rejection_reason 'Test rejection'. Inserts the contacts into registration_contacts.
 */
export async function makeRegistration(database: Db, input: MakeRegistrationInput): Promise<RegistrationRow> {
  const n = next();
  const partnerId = input.partnerId ?? (await makePartner(database, {})).id;
  const status = input.status ?? 'pending';
  const product = input.product ? (PRODUCT_BY_LABEL[input.product] ?? (input.product as Product)) : 'images';
  const region = input.region ? (REGION_BY_LABEL[input.region] ?? (input.region as DealRegion)) : 'india';
  const registrant = input.registeredBy
    ? first(await database.select({ name: users.name }).from(users).where(eq(users.id, input.registeredBy)), 'registrant')
    : null;
  const rows = await database
    .insert(registrations)
    .values({
      reference: await nextRegistrationReference(database, new Date(`${input.registeredOn ?? '2026-11-06'}T09:00:00Z`)),
      partnerId,
      registeredBy: input.registeredBy ?? null,
      registeredByName: registrant?.name ?? 'Test User',
      customerName: input.customerName ?? `Customer ${n}`,
      customerDomain: input.customerDomain ?? null,
      product,
      region,
      managerId: input.managerId ?? null,
      status,
      ...(input.stage === undefined ? {} : { stage: input.stage }),
      registeredOn: input.registeredOn ?? '2026-11-06',
      protectionEnd: input.protectionEnd !== undefined ? input.protectionEnd : status === 'accepted' ? '2027-02-02' : null,
      closedOn: input.closedOn ?? null,
      rejectionReason: status === 'rejected' ? 'Test rejection' : null,
      hubspotDealId: input.hubspotDealId ?? null,
      hubspotStageId: input.hubspotStageId ?? null,
      dealValue: input.dealValue ?? null,
      ...(input.currency ? { currency: input.currency } : {}),
      customerCountry: input.customerCountry ?? null,
      customerIndustry: input.customerIndustry ?? null,
      useCase: input.useCase ?? null,
      competitor: input.competitor ?? null,
      seats: input.seats ?? null,
      salesStage: input.salesStage ?? null,
      decisionDate: input.decisionDate ?? null,
    })
    .returning();
  const registration = first(rows, 'registration');
  for (const contact of input.contacts ?? []) {
    await database.insert(registrationContacts).values({
      registrationId: registration.id,
      name: contact.name,
      role: contact.role ?? null,
      email: contact.email ?? null,
      phone: contact.phone ?? null,
    });
  }
  return registration;
}

/** The part of FakeHubspot (HubSpot plan 4.2) that makeSyncedDeal uses. FakeHubspot satisfies it structurally. */
export interface SyncedDealHubspot {
  readonly stageIds: Readonly<Record<string, string>>;
  createDeal(properties: Record<string, string>): Promise<{ id: string }>;
}

/**
 * An accepted registration plus the matching deal in `hs` (protection_end '2027-02-02' unless given); stores
 * hubspot_deal_id and hubspot_stage_id (the 'Accepted' stage) on the row. Returns { id, dealId }.
 */
export async function makeSyncedDeal(
  database: Db,
  hs: SyncedDealHubspot,
  input: Pick<MakeRegistrationInput, 'partnerId' | 'customerName' | 'product' | 'region' | 'protectionEnd'>,
): Promise<{ id: string; dealId: string }> {
  const stageId = hs.stageIds.Accepted;
  if (!stageId) throw new Error('test helper: the fake HubSpot has no "Accepted" stage');
  const registration = await makeRegistration(database, { ...input, status: 'accepted', stage: 'Accepted' });
  const deal = await hs.createDeal({
    dealname: registration.customerName,
    dealstage: stageId,
    portal_registration_id: registration.id,
  });
  await database
    .update(registrations)
    .set({ hubspotDealId: deal.id, hubspotStageId: stageId })
    .where(eq(registrations.id, registration.id));
  return { id: registration.id, dealId: deal.id };
}

export async function makeApplication(database: Db, input: Partial<typeof applications.$inferInsert>): Promise<ApplicationRow> {
  const n = next();
  const rows = await database
    .insert(applications)
    .values({
      reference: `APP-2611-${String(n).padStart(4, '0')}`,
      company: `Company ${n}`,
      domain: `company-${n}.example.com`,
      applicantName: `Applicant ${n}`,
      email: `applicant-${n}@company-${n}.example.com`,
      source: 'portal',
      ...input,
    })
    .returning();
  return first(rows, 'application');
}

/** 'all', one key, or a list of keys, as a StaffScope. */
const scopeOf = (value: StaffRegion | readonly string[]): StaffScope => (typeof value === 'string' ? decodeScope(value) : normalizeScope(value));

/** Returns the row and the clear token (the row holds only the SHA-256 hex digest, as hashToken() produces). */
export async function makeInvite(
  database: Db,
  input: Partial<typeof invites.$inferInsert> & { partnerId?: string | null },
): Promise<{ invite: InviteRow; token: string }> {
  const n = next();
  const kind = input.kind ?? 'partner';
  const token = randomBytes(32).toString('base64url');
  const partnerId = kind === 'staff' ? null : (input.partnerId ?? (await makePartner(database, {})).id);
  const rows = await database
    .insert(invites)
    .values({
      email: `invitee-${n}@example.com`,
      role: 'sales',
      expiresAt: new Date('2099-01-01T00:00:00.000Z'),
      ...(kind === 'staff' ? { staffRegion: 'all' as const } : {}),
      ...input,
      kind,
      partnerId,
      tokenHash: sha256Hex(token),
    })
    .returning();
  return { invite: first(rows, 'invite'), token };
}

export async function makeAccessRequest(
  database: Db,
  input: Partial<typeof accessRequests.$inferInsert> & { partnerId: string },
): Promise<AccessRequestRow> {
  const n = next();
  const rows = await database
    .insert(accessRequests)
    .values({ email: `requester-${n}@example.com`, name: `Requester ${n}`, ...input })
    .returning();
  return first(rows, 'access request');
}

/** Inserts the documents row (file_key unique), audience rows for 'named', defaults: type 'datasheet', product 'all', audience 'all'. */
export async function makeDocument(
  database: Db,
  input: Partial<Omit<typeof documents.$inferInsert, 'audienceCategories'>> & {
    audienceCategories?: PartnerCategory[];
    partnerIds?: string[];
  },
): Promise<DocumentRow> {
  const n = next();
  const { partnerIds, ...columns } = input;
  const rows = await database
    .insert(documents)
    .values({
      title: `Document ${n}`,
      type: 'datasheet',
      product: 'all',
      audienceKind: partnerIds && partnerIds.length > 0 ? 'named' : 'all',
      fileKey: `test/doc-${n}.pdf`,
      fileSize: 1024,
      mime: 'application/pdf',
      originalName: `doc-${n}.pdf`,
      ...columns,
    })
    .returning();
  const document = first(rows, 'document');
  for (const partnerId of partnerIds ?? []) {
    await database.insert(documentAudience).values({ documentId: document.id, partnerId });
  }
  return document;
}

/** The Viewer a given user row would get from getViewer(). Loads the partner name; staff region from staff_scopes. */
export async function viewerFor(database: Db, user: UserRow): Promise<Viewer> {
  if (user.kind === 'partner') {
    if (!user.partnerId) throw new Error('test helper: partner user without partner_id');
    const partner = first(await database.select({ name: partners.name }).from(partners).where(eq(partners.id, user.partnerId)), 'partner name');
    return {
      id: user.id,
      kind: 'partner',
      role: user.role as PartnerRole,
      partnerId: user.partnerId,
      partnerName: partner.name,
      email: user.email,
      name: user.name,
    };
  }
  return {
    id: user.id,
    kind: 'staff',
    role: user.role as StaffRole,
    partnerId: null,
    partnerName: null,
    regions: await loadScope(database, user.id),
    email: user.email,
    name: user.name,
  };
}

export async function asStaff(
  database: Db,
  role: 'partner_manager' | 'sales' | 'marketing' = 'partner_manager',
  region: StaffRegion | readonly string[] = 'all',
): Promise<StaffViewer> {
  const viewer = await viewerFor(database, await makeUser(database, { kind: 'staff', role, region }));
  if (viewer.kind !== 'staff') throw new Error('test helper: asStaff produced a partner viewer');
  return viewer;
}

export async function asPartner(
  database: Db,
  input: { partnerId?: string; role?: 'partner_admin' | 'sales' | 'technical' } = {},
): Promise<PartnerViewer> {
  const viewer = await viewerFor(
    database,
    await makeUser(database, { kind: 'partner', ...(input.partnerId === undefined ? {} : { partnerId: input.partnerId }), role: input.role ?? 'partner_admin' }),
  );
  if (viewer.kind !== 'partner') throw new Error('test helper: asPartner produced a staff viewer');
  return viewer;
}

const seedTenant = async (database: Db, name: string): Promise<TenantFixture> => {
  const partner = await makePartner(database, { name });
  const admin = await makeUser(database, { partnerId: partner.id, role: 'partner_admin', name: `${name} Admin` });
  const sales = await makeUser(database, { partnerId: partner.id, role: 'sales', name: `${name} Sales` });
  const adminViewer = await viewerFor(database, admin);
  const salesViewer = await viewerFor(database, sales);
  if (adminViewer.kind !== 'partner' || salesViewer.kind !== 'partner') throw new Error('test helper: tenant users must be partner users');
  const registration = await makeRegistration(database, {
    partnerId: partner.id,
    customerName: `${name} Customer`,
    registeredBy: sales.id,
    contacts: [{ name: `${name} Contact`, email: `contact@${partner.domain}` }],
  });
  const contact = first(await database.select({ id: registrationContacts.id }).from(registrationContacts).where(eq(registrationContacts.registrationId, registration.id)), 'contact');
  const message = first(
    await database
      .insert(registrationMessages)
      .values({ registrationId: registration.id, authorId: sales.id, authorName: sales.name, authorOrg: name, side: 'partner', body: `Note from ${name}` })
      .returning({ id: registrationMessages.id }),
    'message',
  );
  const { invite } = await makeInvite(database, { partnerId: partner.id, role: 'sales' });
  const request = await makeAccessRequest(database, { partnerId: partner.id });
  const document = await makeDocument(database, { title: `${name} only`, partnerIds: [partner.id] });
  const open = first(
    await database
      .insert(documentOpens)
      .values({ documentId: document.id, userId: sales.id, partnerId: partner.id })
      .returning({ id: documentOpens.id }),
    'document open',
  );
  const conversation = first(
    await database
      .insert(chatConversations)
      .values({ kind: 'group', partnerId: partner.id, title: `${name} chat`, createdBy: sales.id, memberIds: [sales.id], lastMsgSeq: 1, rev: 1 })
      .returning({ id: chatConversations.id }),
    'chat',
  );
  const chatMessage = first(
    await database
      .insert(chatMessages)
      .values({ conversationId: conversation.id, seq: 1, rev: 1, senderId: sales.id, senderName: sales.name, senderOrg: name, body: `Chat note from ${name}` })
      .returning({ id: chatMessages.id }),
    'chat message',
  );
  const chatFile = first(
    await database
      .insert(chatAttachments)
      .values({ conversationId: conversation.id, partnerId: partner.id, messageId: chatMessage.id, uploaderId: sales.id, key: `chat/${conversation.id}/seed-${name}.pdf`, name: 'seed.pdf', mime: 'application/pdf', size: 100 })
      .returning({ id: chatAttachments.id }),
    'chat file',
  );
  return {
    partnerId: partner.id,
    viewer: adminViewer,
    adminViewer,
    salesViewer,
    userId: sales.id,
    registrationId: registration.id,
    messageId: message.id,
    contactId: contact.id,
    inviteId: invite.id,
    accessRequestId: request.id,
    documentId: document.id,
    openId: open.id,
    conversationId: conversation.id,
    chatMessageId: chatMessage.id,
    chatAttachmentId: chatFile.id,
  };
};

/**
 * Partners A and B, each with an admin, a sales user (userId is the sales user, the "other user of the same partner"
 * for own-user probes), a registration with a message and a contact, an invite, an access request, a document named
 * to that partner only and an open of it; plus a staff partner manager, an application and an audit row.
 * `documentForBOnly` is B's document.
 */
export async function seedTwoTenants(database: Db): Promise<IsolationContext> {
  const a = await seedTenant(database, 'Alpha');
  const b = await seedTenant(database, 'Beta');
  const staff = await asStaff(database, 'partner_manager', 'all');
  const application = await makeApplication(database, {});
  const audit = first(
    await database
      .insert(auditLog)
      .values({ actorLabel: 'Seed', who: 'staff', kind: 'partners', event: 'partner.created', text: 'Added partner: Alpha', partnerId: a.partnerId })
      .returning({ id: auditLog.id }),
    'audit row',
  );
  return {
    a,
    b,
    staff,
    documentForBOnly: b.documentId,
    applicationId: application.id,
    staffUserId: staff.id,
    auditId: audit.id,
  };
}
