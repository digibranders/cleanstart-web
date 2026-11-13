import { createHash } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Db } from '@/db/client';
import {
  accessRequests,
  applications,
  auditLog,
  documentAudience,
  documentOpens,
  documents,
  invites,
  notificationPrefs,
  partners,
  registrationContacts,
  registrationEvents,
  registrationMessages,
  registrations,
  staffScopes,
  users,
} from '@/db/schema';
import { addDays } from '@/lib/dates';
import type { Clock } from '@/lib/clock';
import {
  type DocumentType,
  type PartnerCategory,
  type PartnerRegion,
  type PartnerRole,
  type StaffRegion,
  type StaffRole,
  type UserStatus,
  NOTIFICATION_CATEGORIES,
} from '@/lib/domain';
import { AUDIT_EVENTS, type AuditEvent } from '@/server/audit/events';
import mockAccount from './mock-data/mock-account.json';
import mockApplications from './mock-data/mock-applications.json';
import mockAudit from './mock-data/mock-audit.json';
import mockDeals from './mock-data/mock-deals.json';
import mockDocuments from './mock-data/mock-documents.json';
import mockPartners from './mock-data/mock-partners.json';
import mockStaff from './mock-data/mock-staff.json';
import mockTeam from './mock-data/mock-team.json';

/** Development only. Meets the password rule (8 or more characters, a letter, a number, a special character). */
export const DEV_SEED_PASSWORD = 'Portal-dev-2026!';

export interface SeedSummary {
  partners: number;
  users: number;
  registrations: number;
  applications: number;
  documents: number;
  documentOpens: number;
  auditEntries: number;
}

export interface SeedOptions {
  clock: Clock;
}

/* ---------------------------------------------------------------- the shapes of the extracted mock data */

const mockPersonSchema = z.object({ name: z.string(), role: z.string(), last: z.string() });
const mockPartnerSchema = z.object({
  id: z.string(), name: z.string(), domain: z.string(), category: z.string(), region: z.string(), status: z.string(), last: z.string(),
  since: z.string(), agreement: z.string(), admin: z.string(), manager: z.string(), hs: z.string(), people: z.array(mockPersonSchema),
});
const mockContactSchema = z.object({ name: z.string(), role: z.string().optional(), email: z.string().optional(), phone: z.string().optional() });
const mockMessageSchema = z.object({
  id: z.string(), who: z.string(), org: z.string(), self: z.boolean(), when: z.string(), text: z.string(), auto: z.boolean().optional(),
});
const mockEventSchema = z.object({ when: z.string(), text: z.string(), by: z.string(), source: z.string(), auto: z.boolean().optional() });
const mockDealSchema = z.object({
  id: z.string(), customer: z.string(), website: z.string().optional(), partner: z.string(), product: z.string(), region: z.string(),
  manager: z.string(), registeredBy: z.string().optional(), registered: z.string(), registeredTime: z.string().optional(),
  resubmittedOn: z.string().optional(), status: z.string(), stage: z.string(), protectionEnd: z.string().optional(),
  closedOn: z.string().optional(), decidedOn: z.string().optional(), decidedBy: z.string().optional(), rejectionReason: z.string().optional(),
  crmRef: z.string().optional(), crmSynced: z.string().optional(), extensionRequested: z.boolean().optional(), notes: z.string().optional(),
  contacts: z.array(mockContactSchema), thread: z.array(mockMessageSchema), history: z.array(mockEventSchema),
});
const mockApplicationSchema = z.object({
  reference: z.string(), company: z.string(), domain: z.string(), applicant: z.string(), email: z.string().optional(), role: z.string(),
  phone: z.string().optional(), category: z.string(), region: z.string(), submitted: z.string(), reason: z.string(), status: z.string(),
});
const mockDocumentSchema = z.object({
  title: z.string(), id: z.string(), type: z.string(), format: z.string(), product: z.string(), summary: z.string().optional(), updated: z.string(),
  audience: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('all') }),
    z.object({ kind: z.literal('categories'), categories: z.array(z.string()) }),
    z.object({ kind: z.literal('partners'), partners: z.array(z.string()) }),
  ]),
  opens: z.number(), partnerCount: z.number(), ownOpens: z.number(),
});
const mockAuditEntrySchema = z.object({
  id: z.string(), ageDays: z.number(), when: z.string(), who: z.string(), whoRole: z.string(), whoKind: z.enum(['staff', 'partner', 'sync']),
  kind: z.string(), action: z.string(), target: z.string(), source: z.string(), before: z.string(), after: z.string(), note: z.string(),
});
const mockTeamSchema = z.object({
  members: z.array(z.object({ name: z.string(), email: z.string(), role: z.string(), status: z.string(), last: z.string() })),
  requests: z.array(z.object({ name: z.string(), email: z.string(), note: z.string(), role: z.string() })),
});
const mockStaffSchema = z.object({ name: z.string(), email: z.string(), role: z.string(), region: z.string(), last: z.string(), status: z.string() });
const mockAccountSchema = z.object({ name: z.string(), title: z.string(), phone: z.string(), notify: z.record(z.boolean()), twoStepOn: z.boolean() });

const partnersData = z.array(mockPartnerSchema).parse(mockPartners);
const dealsData = z.array(mockDealSchema).parse(mockDeals);
const applicationsData = z.array(mockApplicationSchema).parse(mockApplications);
const documentsData = z.array(mockDocumentSchema).parse(mockDocuments);
const auditData = z.array(mockAuditEntrySchema).parse(mockAudit);
const teamData = mockTeamSchema.parse(mockTeam);
const staffData = z.array(mockStaffSchema).parse(mockStaff);
const accountData = mockAccountSchema.parse(mockAccount);

/* ---------------------------------------------------------------- small parsers for the mock's display strings */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/** "6 Nov 2026" or "6 Nov" (year from `year`) to YYYY-MM-DD. Throws on anything else, so a bad fixture fails loudly. */
export const parseMockDate = (text: string, year: number): string => {
  const match = /(\d{1,2}) ([A-Z][a-z]{2})(?: (\d{4}))?/.exec(text);
  const month = match ? MONTHS.indexOf(match[2] as (typeof MONTHS)[number]) : -1;
  if (!match || month < 0) throw new Error(`fixture: cannot read a date from "${text}"`);
  return `${match[3] ?? year}-${String(month + 1).padStart(2, '0')}-${String(Number(match[1])).padStart(2, '0')}`;
};

const at = (isoDate: string, time = '09:00'): Date => new Date(`${isoDate}T${time}:00.000Z`);

/** "Now", "Today", "Yesterday", "2 hours ago", "5 Nov", "2 Nov 2026" and "Invited 5 Nov". */
export const parseLastSeen = (text: string, clock: Clock): { lastLoginAt: Date | null; invitedAt: Date | null } => {
  const now = clock.now().getTime();
  const year = Number(clock.today().slice(0, 4));
  const offset = (ms: number): Date => new Date(now - ms);
  if (text === 'Now') return { lastLoginAt: offset(0), invitedAt: null };
  if (text === 'Today') return { lastLoginAt: offset(3 * 3_600_000), invitedAt: null };
  if (text === 'Yesterday') return { lastLoginAt: offset(26 * 3_600_000), invitedAt: null };
  const hours = /^(\d+) hours? ago$/.exec(text);
  if (hours) return { lastLoginAt: offset(Number(hours[1]) * 3_600_000), invitedAt: null };
  if (text.startsWith('Invited ')) return { lastLoginAt: null, invitedAt: at(parseMockDate(text.slice(8), year)) };
  return { lastLoginAt: at(parseMockDate(text, year)), invitedAt: null };
};

const slug = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, '');
const emailFor = (name: string, domain: string): string => {
  const [first = '', ...rest] = name.split(/\s+/);
  return `${slug(first)}.${slug(rest.join(''))}@${domain}`;
};
const sha256Hex = (value: string): string => createHash('sha256').update(value).digest('hex');

const PARTNER_CATEGORY: Record<string, PartnerCategory> = { Distributor: 'distributor', 'Channel partner': 'channel', 'System integrator': 'integrator' };
const AUDIENCE_CATEGORY: Record<string, PartnerCategory> = { Distributors: 'distributor', 'Channel partners': 'channel', 'System integrators': 'integrator' };
const REGION: Record<string, PartnerRegion> = { India: 'india', 'Middle East': 'middle_east', Elsewhere: 'elsewhere' };
const STAFF_REGION: Record<string, StaffRegion> = { India: 'india', 'Middle East': 'middle_east', 'All regions': 'all' };
const PARTNER_ROLE: Record<string, PartnerRole> = { 'Partner admin': 'partner_admin', Sales: 'sales', Technical: 'technical' };
const STAFF_ROLE: Record<string, StaffRole> = { 'Partner manager': 'partner_manager', Sales: 'sales', Marketing: 'marketing' };
const PRODUCT = { 'CleanStart Images': 'images', 'Clean Libraries': 'libraries', CleanSight: 'cleansight' } as const;
const DOC_PRODUCT = { ...PRODUCT, 'All products': 'all' } as const;
const DOC_TYPE: Record<string, DocumentType> = {
  Datasheet: 'datasheet', 'Solution sheet': 'solution_sheet', Battlecard: 'battlecard', 'Price list': 'price_list', Video: 'video', 'Enablement guide': 'enablement_guide',
};
const AUDIT_KIND = { 'Deal decisions': 'deal_decisions', Partners: 'partners', Documents: 'documents', 'People and access': 'people_access' } as const;
const MIME: Record<string, { mime: string; ext: string }> = {
  PDF: { mime: 'application/pdf', ext: 'pdf' },
  MP4: { mime: 'video/mp4', ext: 'mp4' },
  ZIP: { mime: 'application/zip', ext: 'zip' },
};
const lookup = <T>(table: Record<string, T>, key: string, what: string): T => {
  const value = table[key];
  if (value === undefined) throw new Error(`fixture: unknown ${what} "${key}"`);
  return value;
};

/** "1.1 MB" and "640 KB" to bytes. */
const parseSize = (format: string): number => {
  const match = /([\d.]+) (KB|MB)/.exec(format);
  if (!match) return 1_048_576;
  return Math.round(Number(match[1]) * (match[2] === 'MB' ? 1_048_576 : 1024));
};

const first = <T>(rows: T[], what: string): T => {
  const row = rows[0];
  if (!row) throw new Error(`fixture: insert of ${what} returned no row`);
  return row;
};

const AGREEMENT = /^(v[\d.]+), accepted (\d{1,2} [A-Z][a-z]{2} \d{4})$/;
const FILLER_PARTNERS = 11;

/**
 * Loads the mock's data into the real tables so every screen shows the mock's rows (BUILD-HANDOFF, "Converting a mock
 * screen"). Run on an empty, migrated database as the system role. Dates in the mock that are absolute stay absolute;
 * last-seen strings and audit ages are resolved against `opts.clock`.
 */
export async function seedMockData(db: Db, opts: SeedOptions): Promise<SeedSummary> {
  const { clock } = opts;
  const year = Number(clock.today().slice(0, 4));

  /* staff first, so partners can point at their managers */
  const staffIdByName = new Map<string, string>();
  for (const member of staffData) {
    const role = lookup(STAFF_ROLE, member.role, 'staff role');
    const { lastLoginAt, invitedAt } = parseLastSeen(member.last, clock);
    const status: UserStatus = member.status === 'Invited' ? 'invited' : 'active';
    const row = first(
      await db.insert(users).values({ email: member.email, name: member.name, kind: 'staff', partnerId: null, role, status, lastLoginAt, invitedAt, emailVerified: status === 'active' }).returning({ id: users.id }),
      'staff user',
    );
    staffIdByName.set(member.name, row.id);
    await db.insert(staffScopes).values({ userId: row.id, region: lookup(STAFF_REGION, member.region, 'staff region') });
    if (status === 'invited') {
      await db.insert(invites).values({
        email: member.email, kind: 'staff', partnerId: null, role, staffRegion: lookup(STAFF_REGION, member.region, 'staff region'),
        tokenHash: sha256Hex(`seed-staff-invite:${member.email}`), expiresAt: new Date((invitedAt ?? clock.now()).getTime() + 7 * 86_400_000),
        invitedBy: staffIdByName.get('Farhan Qureshi') ?? null,
      });
    }
  }

  /* the ten detailed partners and their people */
  const partnerIdByName = new Map<string, string>();
  const partnerCategoryById = new Map<string, PartnerCategory>();
  const userIdByName = new Map<string, string>();
  /** Every login of every partner, in insertion order. The first one of a partner stands in for it when opens are generated. */
  const usersByPartner = new Map<string, string[]>();
  const addPartnerUser = (partnerId: string, userId: string): void => void usersByPartner.set(partnerId, [...(usersByPartner.get(partnerId) ?? []), userId]);
  let userCount = staffData.length;
  for (const partner of partnersData) {
    const agreement = AGREEMENT.exec(partner.agreement);
    const category = lookup(PARTNER_CATEGORY, partner.category, 'partner category');
    const row = first(
      await db.insert(partners).values({
        name: partner.name, domain: partner.domain, category, region: lookup(REGION, partner.region, 'partner region'),
        status: partner.status.toLowerCase() as 'active' | 'onboarding' | 'inactive' | 'suspended',
        managerId: staffIdByName.get(partner.manager) ?? null,
        agreementVersion: agreement?.[1] ?? null,
        agreementAcceptedAt: agreement?.[2] ? at(parseMockDate(agreement[2], year)) : null,
        hubspotCompanyId: partner.hs,
        createdAt: at(parseMockDate(partner.since, year)),
      }).returning({ id: partners.id }),
      'partner',
    );
    partnerIdByName.set(partner.name, row.id);
    partnerCategoryById.set(row.id, category);
    for (const person of partner.people) {
      const team = teamData.members.find((m) => m.name === person.name);
      const { lastLoginAt, invitedAt } = parseLastSeen(person.last, clock);
      const status: UserStatus = person.last.startsWith('Invited') ? 'invited' : 'active';
      const email = team?.email ?? emailFor(person.name, partner.domain);
      const isAditi = person.name === accountData.name;
      const created = first(
        await db.insert(users).values({
          email, name: person.name, kind: 'partner', partnerId: row.id, role: lookup(PARTNER_ROLE, person.role, 'partner role'), status,
          lastLoginAt, invitedAt, emailVerified: status === 'active',
          title: isAditi ? accountData.title : null, phone: isAditi ? accountData.phone : null, twoFactorEnabled: isAditi ? accountData.twoStepOn : false,
        }).returning({ id: users.id }),
        'partner user',
      );
      userIdByName.set(person.name, created.id);
      addPartnerUser(row.id, created.id);
      userCount += 1;
      if (status === 'invited') {
        await db.insert(invites).values({
          email, kind: 'partner', partnerId: row.id, role: lookup(PARTNER_ROLE, person.role, 'partner role'),
          tokenHash: sha256Hex(`seed-invite:${email}`), expiresAt: new Date((invitedAt ?? clock.now()).getTime() + 7 * 86_400_000),
          invitedBy: userIdByName.get(partner.admin) ?? null,
        });
      }
    }
  }

  /* the eleven active partners the board counts but does not detail: one admin each, so document opens can name them */
  for (let i = 1; i <= FILLER_PARTNERS; i += 1) {
    const label = String(i).padStart(2, '0');
    const category: PartnerCategory = i % 2 === 1 ? 'distributor' : 'channel';
    const row = first(
      await db.insert(partners).values({
        name: `Seed partner ${label}`, domain: `seed-partner-${label}.example.com`, category, region: (['india', 'middle_east', 'elsewhere'] as const)[i % 3] ?? 'india',
        status: 'active', managerId: staffIdByName.get(i % 2 === 1 ? 'Farhan Qureshi' : 'Omar Nasser') ?? null,
        agreementVersion: 'v1.2', agreementAcceptedAt: at('2026-06-01'), createdAt: at('2026-06-01'),
      }).returning({ id: partners.id }),
      'filler partner',
    );
    partnerIdByName.set(`Seed partner ${label}`, row.id);
    partnerCategoryById.set(row.id, category);
    const admin = first(
      await db.insert(users).values({
        email: `admin@seed-partner-${label}.example.com`, name: `Seed Admin ${label}`, kind: 'partner', partnerId: row.id, role: 'partner_admin',
        status: 'active', emailVerified: true, lastLoginAt: new Date(clock.now().getTime() - i * 86_400_000),
      }).returning({ id: users.id }),
      'filler user',
    );
    addPartnerUser(row.id, admin.id);
    userCount += 1;
  }

  /* Kestrel's access request and Aditi's notification switches */
  const kestrelId = partnerIdByName.get('Kestrel Systems');
  if (!kestrelId) throw new Error('fixture: Kestrel Systems missing');
  for (const request of teamData.requests) {
    await db.insert(accessRequests).values({
      partnerId: kestrelId, email: request.email, name: request.name, note: request.note, requestedRole: lookup({ Sales: 'sales', Technical: 'technical' } as const, request.role, 'requested role'),
      createdAt: clock.now(),
    });
  }
  const aditiId = userIdByName.get(accountData.name);
  if (aditiId) {
    for (const category of NOTIFICATION_CATEGORIES) {
      await db.insert(notificationPrefs).values({ userId: aditiId, category, email: accountData.notify[category] ?? false });
    }
  }

  /* registrations with contacts, thread and history */
  for (const deal of dealsData) {
    const partnerId = partnerIdByName.get(deal.partner);
    if (!partnerId) throw new Error(`fixture: deal ${deal.id} names unknown partner ${deal.partner}`);
    const registrant = deal.history.find((event) => event.text === 'Registered')?.by ?? deal.partner;
    const registeredByName = deal.registeredBy ?? registrant;
    const status = deal.status.toLowerCase() as 'pending' | 'accepted' | 'rejected' | 'expired' | 'won' | 'lost';
    const row = first(
      await db.insert(registrations).values({
        partnerId,
        registeredBy: userIdByName.get(registeredByName) ?? null,
        registeredByName,
        customerName: deal.customer,
        customerDomain: deal.website ?? null,
        product: lookup(PRODUCT, deal.product, 'product'),
        region: lookup({ India: 'india', 'Middle East': 'middle_east' } as const, deal.region, 'deal region'),
        managerId: staffIdByName.get(deal.manager) ?? null,
        notes: deal.notes ?? null,
        status,
        stage: deal.stage,
        registeredOn: deal.registered,
        resubmittedOn: deal.resubmittedOn ?? null,
        decidedBy: deal.decidedBy ? (staffIdByName.get(deal.decidedBy) ?? null) : null,
        decidedByLabel: deal.decidedBy ?? null,
        decidedAt: deal.decidedOn ? at(deal.decidedOn, '12:00') : null,
        rejectionReason: deal.rejectionReason ?? null,
        protectionEnd: deal.protectionEnd ?? null,
        closedOn: deal.closedOn ?? null,
        extensionStatus: deal.extensionRequested ? 'requested' : 'none',
        extensionRequestedAt: deal.extensionRequested ? clock.now() : null,
        hubspotDealId: deal.crmRef ? deal.crmRef.replace(/^HS-/, '') : null,
        hubspotStageId: deal.crmRef ? `seed:${deal.stage}` : null,
        hubspotSyncedAt: deal.crmSynced ? at(parseMockDate(deal.crmSynced, year), /(\d{2}:\d{2})$/.exec(deal.crmSynced)?.[1] ?? '09:00') : null,
        createdAt: at(deal.registered, deal.registeredTime ?? '09:00'),
      }).returning({ id: registrations.id }),
      'registration',
    );
    for (const contact of deal.contacts) {
      await db.insert(registrationContacts).values({
        registrationId: row.id, name: contact.name, role: contact.role ?? null, email: contact.email ?? null, phone: contact.phone ?? null,
      });
    }
    for (const message of deal.thread) {
      await db.insert(registrationMessages).values({
        registrationId: row.id,
        authorId: userIdByName.get(message.who) ?? staffIdByName.get(message.who) ?? null,
        authorName: message.who,
        authorOrg: message.org,
        side: message.self ? 'partner' : 'staff',
        body: message.text,
        auto: message.auto ?? false,
        createdAt: at(parseMockDate(message.when, year), /(\d{2}:\d{2})$/.exec(message.when)?.[1] ?? '09:00'),
      });
    }
    // history is newest first; a minute per position keeps events of the same day in order
    for (const [index, event] of deal.history.entries()) {
      await db.insert(registrationEvents).values({
        registrationId: row.id,
        at: new Date(at(parseMockDate(event.when, year), '12:00').getTime() + (deal.history.length - 1 - index) * 60_000),
        text: event.text,
        byLabel: event.by,
        source: event.source.toLowerCase() as 'portal' | 'crm' | 'system',
        auto: event.auto ?? false,
      });
    }
  }

  /* applications */
  for (const application of applicationsData) {
    await db.insert(applications).values({
      reference: application.reference,
      company: application.company,
      domain: application.domain,
      applicantName: application.applicant,
      email: application.email ?? emailFor(application.applicant, application.domain),
      role: application.role,
      phone: application.phone ?? null,
      category: lookup(PARTNER_CATEGORY, application.category, 'application category'),
      region: lookup(REGION, application.region, 'application region'),
      reason: application.reason,
      source: 'portal',
      status: 'new',
      createdAt: at(parseMockDate(application.submitted, year)),
    });
  }
  // setval needs UPDATE on the sequence, which the runtime role does not have; 44 calls to nextval need only USAGE.
  await db.execute(sql`select count(nextval('application_reference_seq')) from generate_series(1, 44)`);

  /* documents, their audiences and opens */
  const marketingId = staffIdByName.get('Ishita Bose') ?? null;
  const openPool = [...usersByPartner].map(([partnerId, userIds]) => ({ partnerId, userId: userIds[0] ?? '' }));
  let openCount = 0;
  for (const doc of documentsData) {
    const [formatLabel = 'PDF'] = doc.format.split(',');
    const file = lookup(MIME, formatLabel.trim(), 'file format');
    const duration = /(\d+) min/.exec(doc.format);
    const audience = doc.audience;
    const audienceKind = audience.kind === 'partners' ? 'named' : audience.kind;
    const updated = at(parseMockDate(doc.updated, year));
    const row = first(
      await db.insert(documents).values({
        title: doc.title,
        type: lookup(DOC_TYPE, doc.type, 'document type'),
        product: lookup(DOC_PRODUCT, doc.product, 'document product'),
        summary: doc.summary ?? null,
        audienceKind,
        audienceCategories: audience.kind === 'categories' ? audience.categories.map((c) => lookup(AUDIENCE_CATEGORY, c, 'audience category')) : [],
        fileKey: `seed/${doc.id}.${file.ext}`,
        fileSize: parseSize(doc.format),
        mime: file.mime,
        originalName: `${doc.id}.${file.ext}`,
        durationMinutes: duration ? Number(duration[1]) : null,
        uploadedBy: marketingId,
        createdAt: updated,
        updatedAt: updated,
      }).returning({ id: documents.id }),
      'document',
    );
    const namedPartnerIds = audience.kind === 'partners' ? audience.partners.map((name) => partnerIdByName.get(name) ?? '') : [];
    for (const partnerId of namedPartnerIds) {
      if (!partnerId) throw new Error(`fixture: document ${doc.id} names an unknown partner`);
      await db.insert(documentAudience).values({ documentId: row.id, partnerId });
    }

    // Opens: Kestrel gets exactly ownOpens, the other partners that can see the document share the rest, one each at least.
    const eligible = openPool.filter(({ partnerId }) =>
      audience.kind === 'all' ||
      (audience.kind === 'partners' && namedPartnerIds.includes(partnerId)) ||
      (audience.kind === 'categories' && audience.categories.some((c) => lookup(AUDIENCE_CATEGORY, c, 'audience category') === partnerCategoryById.get(partnerId))),
    );
    const own = doc.ownOpens > 0 ? eligible.filter((p) => p.partnerId === kestrelId) : [];
    const others = eligible.filter((p) => p.partnerId !== kestrelId).slice(0, doc.partnerCount - (own.length > 0 ? 1 : 0));
    if (others.length !== doc.partnerCount - (own.length > 0 ? 1 : 0)) throw new Error(`fixture: not enough partners can open ${doc.id}`);
    const share = doc.opens - doc.ownOpens;
    const perPartner = others.map((_, i) => Math.floor(share / others.length) + (i < share % others.length ? 1 : 0));
    const rows: Array<{ userId: string; partnerId: string }> = [];
    const kestrelUsers = (usersByPartner.get(kestrelId) ?? []).map((userId) => ({ partnerId: kestrelId, userId }));
    for (let i = 0; i < doc.ownOpens; i += 1) {
      const user = kestrelUsers[i % kestrelUsers.length];
      if (user) rows.push(user);
    }
    others.forEach((p, i) => {
      for (let n = 0; n < (perPartner[i] ?? 0); n += 1) rows.push(p);
    });
    if (rows.length > 0) {
      await db.insert(documentOpens).values(rows.map((r) => ({ documentId: row.id, userId: r.userId, partnerId: r.partnerId, openedAt: updated })));
    }
    openCount += rows.length;
  }

  /* audit log: ages resolved against the clock, the time of day kept */
  const eventByAction = new Map<string, AuditEvent>(
    (Object.entries(AUDIT_EVENTS) as Array<[AuditEvent, { action: string }]>).map(([event, def]) => [def.action, event]),
  );
  for (const entry of auditData) {
    const event = eventByAction.get(entry.action);
    if (!event) throw new Error(`fixture: no audit event named "${entry.action}"`);
    const time = /(\d{2}:\d{2})$/.exec(entry.when)?.[1] ?? '09:00';
    await db.insert(auditLog).values({
      at: at(addDays(clock.today(), -entry.ageDays), time),
      actorId: userIdByName.get(entry.who) ?? staffIdByName.get(entry.who) ?? null,
      actorLabel: entry.who,
      actorRole: entry.whoRole,
      who: entry.whoKind,
      kind: lookup(AUDIT_KIND, entry.kind, 'audit kind'),
      event,
      action: entry.action,
      target: entry.target,
      text: `${entry.action}: ${entry.target}`,
      source: entry.source === 'HubSpot' ? 'crm' : 'portal',
      before: entry.before || null,
      after: entry.after || null,
      note: entry.note || null,
    });
  }

  const count = async (table: string): Promise<number> => Number((await db.execute(sql.raw(`select count(*)::int as n from ${table}`))).rows[0]?.n ?? 0);
  return {
    partners: await count('partners'),
    users: userCount,
    registrations: await count('registrations'),
    applications: await count('applications'),
    documents: await count('documents'),
    documentOpens: openCount,
    auditEntries: await count('audit_log'),
  };
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

/** The dev seed writes fake partners and a known password, so it only runs against a local, non-production database. */
export function assertDevSeedAllowed(env: Record<string, string | undefined>): void {
  if (env.NODE_ENV === 'production') throw new Error('Refusing to seed the dev data: NODE_ENV is "production".');
  const url = env.DATABASE_URL;
  if (!url) throw new Error('Refusing to seed the dev data: DATABASE_URL is not set.');
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    throw new Error('Refusing to seed the dev data: DATABASE_URL is not a valid URL.');
  }
  if (!LOCAL_HOSTS.has(host)) throw new Error(`Refusing to seed the dev data: DATABASE_URL host "${host}" is not localhost, 127.0.0.1 or ::1.`);
}

/** What `pnpm db:seed` runs. Refuses a database that already has partners: it never deletes data (CLAUDE.md). */
export async function seedDevDatabase(db: Db, clock: Clock): Promise<SeedSummary> {
  assertDevSeedAllowed(process.env);
  const existing = Number((await db.execute(sql`select count(*)::int as n from partners`)).rows[0]?.n ?? 0);
  if (existing > 0) {
    throw new Error('The database already has partners. Seed a fresh database: scripts/db-create.sh <name>, then pnpm db:migrate, then pnpm db:seed.');
  }
  return seedMockData(db, { clock });
}
