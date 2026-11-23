import { sql, type SQL } from 'drizzle-orm';
import {
  type AnyPgColumn,
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgSequence,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import {
  ACCESS_REQUEST_ROLES,
  ACCESS_REQUEST_STATUSES,
  APPLICATION_NOTE_KINDS,
  APPLICATION_SOURCES,
  APPLICATION_STATUSES,
  APPLICATION_TOKEN_KINDS,
  AUDIENCE_KINDS,
  AUDIT_KINDS,
  AUDIT_WHO,
  CHECKLIST_STEPS,
  DEAL_CURRENCIES,
  DOC_PRODUCTS,
  DOCUMENT_STATUSES,
  DOCUMENT_TYPES,
  EVENT_SOURCES,
  EXTENSION_STATUSES,
  HEADCOUNT_BANDS,
  MATERIAL_REQUEST_STATUSES,
  MESSAGE_SIDES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_KINDS,
  OUTBOX_OPS,
  OUTBOX_STATUSES,
  PARTNER_CATEGORIES,
  PARTNER_ROLES,
  PARTNER_STATUSES,
  PRODUCTS,
  REGISTRATION_STATUSES,
  STAFF_ROLES,
  STAGE_AWAITING_REVIEW,
  USER_KINDS,
  USER_STATUSES,
} from '@/lib/domain';

/** SQL fragment `col in ('a', 'b')`. Values are our own constants, never user input. */
const inList = (column: AnyPgColumn, values: readonly string[]): SQL =>
  sql`${column} in (${sql.raw(values.map((v) => `'${v}'`).join(', '))})`;

const id = () => uuid('id').primaryKey().defaultRandom();
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();
const ts = (name: string) => timestamp(name, { withTimezone: true });
/** Overwritten by the portal_child_partner_id trigger from the parent registration. See rls.sql. */
const NIL_UUID = sql`'00000000-0000-0000-0000-000000000000'`;

/* ---------------------------------------------------------------- partners and people */

/** Sales regions. Keys are immutable slugs; staff add, rename, reorder and deactivate rows on /admin/settings/regions. Never deleted. */
export const regions = pgTable(
  'regions',
  {
    id: id(),
    key: text('key').notNull(),
    name: text('name').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    active: boolean('active').notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [unique('regions_key_key').on(t.key), check('regions_key_chk', sql`${t.key} ~ '^[a-z][a-z0-9_]{1,31}$' and ${t.key} <> 'all'`)],
);

export const partners = pgTable(
  'partners',
  {
    id: id(),
    name: text('name').notNull(),
    domain: text('domain').notNull(),
    category: text('category', { enum: PARTNER_CATEGORIES }).notNull(),
    region: text('region').notNull().references(() => regions.key),
    status: text('status', { enum: PARTNER_STATUSES }).notNull().default('onboarding'),
    statusBeforeSuspend: text('status_before_suspend', { enum: PARTNER_STATUSES }),
    managerId: uuid('manager_id').references((): AnyPgColumn => users.id),
    agreementVersion: text('agreement_version'),
    agreementAcceptedAt: ts('agreement_accepted_at'),
    website: text('website'),
    phone: text('phone'),
    address: text('address'),
    about: text('about'),
    legalName: text('legal_name'),
    taxId: text('tax_id'),
    hqCountry: text('hq_country'),
    headcountBand: text('headcount_band', { enum: HEADCOUNT_BANDS }),
    billingContactName: text('billing_contact_name'),
    billingContactEmail: text('billing_contact_email'),
    supportContactName: text('support_contact_name'),
    supportContactEmail: text('support_contact_email'),
    /** R2 key of the company logo (partner-logos/<partner id>/...). Null until a partner admin or staff uploads one. */
    logoKey: text('logo_key'),
    hubspotCompanyId: text('hubspot_company_id'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('partners_domain_key').on(t.domain),
    index('partners_manager_idx').on(t.managerId),
    index('partners_name_trgm').using('gin', t.name.op('gin_trgm_ops')),
    check('partners_domain_lower', sql`${t.domain} = lower(${t.domain})`),
    check('partners_category_chk', inList(t.category, PARTNER_CATEGORIES)),
    check('partners_status_chk', inList(t.status, PARTNER_STATUSES)),
    check('partners_headcount_chk', sql`${t.headcountBand} is null or ${inList(t.headcountBand, HEADCOUNT_BANDS)}`),
    check('partners_prior_status_chk', sql`${t.statusBeforeSuspend} is null or ${inList(t.statusBeforeSuspend, PARTNER_STATUSES)}`),
  ],
);

/** Also the Better Auth user model (section M item 2). Staff and partner people share this table. */
export const users = pgTable(
  'users',
  {
    id: id(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'),
    kind: text('kind', { enum: USER_KINDS }).notNull(),
    partnerId: uuid('partner_id').references(() => partners.id),
    role: text('role').notNull(),
    status: text('status', { enum: USER_STATUSES }).notNull().default('invited'),
    title: text('title'),
    phone: text('phone'),
    twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
    passwordChangedAt: ts('password_changed_at'),
    lastLoginAt: ts('last_login_at'),
    invitedAt: ts('invited_at'),
    removedAt: ts('removed_at'),
    hubspotContactId: text('hubspot_contact_id'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('users_email_key').on(t.email),
    index('users_partner_idx').on(t.partnerId),
    index('users_name_trgm').using('gin', t.name.op('gin_trgm_ops')),
    index('users_email_trgm').using('gin', t.email.op('gin_trgm_ops')),
    check('users_email_lower', sql`${t.email} = lower(${t.email})`),
    check('users_kind_chk', inList(t.kind, USER_KINDS)),
    check('users_status_chk', inList(t.status, USER_STATUSES)),
    check(
      'users_kind_partner_role_chk',
      sql`(${t.kind} = 'partner' and ${t.partnerId} is not null and ${inList(t.role, PARTNER_ROLES)})
        or (${t.kind} = 'staff' and ${t.partnerId} is null and ${inList(t.role, STAFF_ROLES)})`,
    ),
  ],
);

/** One row per staff user. Sales staff see only their regions, partner managers see their regions in Reports and Overview and are routed work by them. See staff_regions. */
export const staffScopes = pgTable(
  'staff_scopes',
  {
    id: id(),
    userId: uuid('user_id').notNull().references(() => users.id),
    /**
     * 'all' (every region, no staff_regions rows), or for a limited person one of the keys they cover as a fallback.
     * The staff_regions rows are the truth for a limited person. Not a foreign key, because 'all' is not a region.
     */
    region: text('region').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [unique('staff_scopes_user_key').on(t.userId)],
);

/** The regions a limited staff member covers, one row each. A person who covers every region has none (staff_scopes.region = 'all'). */
export const staffRegions = pgTable(
  'staff_regions',
  {
    id: id(),
    userId: uuid('user_id').notNull().references(() => users.id),
    regionKey: text('region_key').notNull().references(() => regions.key),
    createdAt: createdAt(),
  },
  (t) => [unique('staff_regions_user_region_key').on(t.userId, t.regionKey), index('staff_regions_region_idx').on(t.regionKey)],
);

/** Ticks the welcome checklist keeps. Derived steps are never stored (DERIVED_CHECKLIST_STEPS). */
export const partnerChecklist = pgTable(
  'partner_checklist',
  {
    partnerId: uuid('partner_id').notNull().references(() => partners.id),
    step: text('step', { enum: CHECKLIST_STEPS }).notNull(),
    doneAt: ts('done_at').notNull().defaultNow(),
    doneBy: uuid('done_by').references(() => users.id),
  },
  (t) => [primaryKey({ columns: [t.partnerId, t.step] }), check('partner_checklist_step_chk', inList(t.step, CHECKLIST_STEPS))],
);

/* ---------------------------------------------------------------- onboarding */

/** APP-YYMM-NNNN. The repo formats nextval; the yymm part is the month of submission. */
export const applicationReferenceSeq = pgSequence('application_reference_seq', { startWith: 1, increment: 1 });

export const applications = pgTable(
  'applications',
  {
    id: id(),
    reference: text('reference').notNull(),
    company: text('company').notNull(),
    domain: text('domain').notNull(),
    applicantName: text('applicant_name').notNull(),
    email: text('email').notNull(),
    role: text('role'),
    phone: text('phone'),
    category: text('category', { enum: PARTNER_CATEGORIES }),
    region: text('region').references(() => regions.key),
    reason: text('reason'),
    source: text('source', { enum: APPLICATION_SOURCES }).notNull(),
    sourceRef: text('source_ref'),
    personalEmail: boolean('personal_email').notNull().default(false),
    existingDomain: boolean('existing_domain').notNull().default(false),
    status: text('status', { enum: APPLICATION_STATUSES }).notNull().default('new'),
    decidedBy: uuid('decided_by').references(() => users.id),
    decidedAt: ts('decided_at'),
    declineReason: text('decline_reason'),
    partnerId: uuid('partner_id').references(() => partners.id),
    vendors: text('vendors').array(),
    products: text('products').array(),
    companySize: text('company_size'),
    yearsInBusiness: text('years_in_business'),
    verticals: text('verticals').array(),
    country: text('country'),
    referralSource: text('referral_source'),
    consentAt: ts('consent_at'),
    /** Set once, before the "invite not used" reminder email goes out. */
    inviteReminderSentAt: ts('invite_reminder_sent_at'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('applications_reference_key').on(t.reference),
    uniqueIndex('applications_source_ref_key').on(t.source, t.sourceRef),
    uniqueIndex('applications_open_portal_email_key')
      .on(sql`lower(${t.email})`)
      .where(sql`${t.status} in ('new', 'info_requested') and ${t.source} = 'portal'`),
    index('applications_status_idx').on(t.status, t.createdAt),
    index('applications_domain_idx').on(t.domain),
    check('applications_email_lower', sql`${t.email} = lower(${t.email})`),
    check('applications_domain_lower', sql`${t.domain} = lower(${t.domain})`),
    check('applications_source_chk', inList(t.source, APPLICATION_SOURCES)),
    check('applications_status_chk', inList(t.status, APPLICATION_STATUSES)),
    check('applications_web_ref_chk', sql`${t.source} = 'portal' or ${t.sourceRef} is not null`),
  ],
);

/** Internal reviewer notes, the question sent to an applicant and their reply. author_id is null for the applicant. Staff only. */
export const applicationNotes = pgTable(
  'application_notes',
  {
    id: id(),
    applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id').references(() => users.id),
    kind: text('kind', { enum: APPLICATION_NOTE_KINDS }).notNull().default('internal'),
    note: text('note').notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index('application_notes_application_idx').on(t.applicationId, t.createdAt),
    check('application_notes_kind_chk', inList(t.kind, APPLICATION_NOTE_KINDS)),
  ],
);

/** Private links for an applicant: kind status (the status page) and kind reply (answer a request for information, single use). Only the hash is stored. */
export const applicationTokens = pgTable(
  'application_tokens',
  {
    id: id(),
    applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: APPLICATION_TOKEN_KINDS }).notNull(),
    tokenHash: text('token_hash').notNull(),
    expiresAt: ts('expires_at').notNull(),
    usedAt: ts('used_at'),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('application_tokens_token_hash_key').on(t.tokenHash),
    index('application_tokens_application_idx').on(t.applicationId, t.kind),
    check('application_tokens_kind_chk', inList(t.kind, APPLICATION_TOKEN_KINDS)),
  ],
);

/** Partner invites (kind partner, partner_id set) and staff invites (partner_id null, staff_region set). */
export const invites = pgTable(
  'invites',
  {
    id: id(),
    email: text('email').notNull(),
    kind: text('kind', { enum: USER_KINDS }).notNull(),
    partnerId: uuid('partner_id').references(() => partners.id),
    role: text('role').notNull(),
    staffRegion: text('staff_region'),
    tokenHash: text('token_hash').notNull(),
    expiresAt: ts('expires_at').notNull(),
    acceptedAt: ts('accepted_at'),
    revokedAt: ts('revoked_at'),
    resentCount: integer('resent_count').notNull().default(0),
    invitedBy: uuid('invited_by').references(() => users.id),
    userId: uuid('user_id').references(() => users.id),
    /** The name the inviter gave; null when they gave none. */
    name: text('name'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('invites_token_hash_key').on(t.tokenHash),
    index('invites_partner_idx').on(t.partnerId),
    index('invites_email_idx').on(t.email),
    check('invites_email_lower', sql`${t.email} = lower(${t.email})`),
    check('invites_kind_chk', inList(t.kind, USER_KINDS)),
    check(
      'invites_kind_partner_chk',
      sql`(${t.kind} = 'partner' and ${t.partnerId} is not null and ${inList(t.role, PARTNER_ROLES)} and ${t.staffRegion} is null)
        or (${t.kind} = 'staff' and ${t.partnerId} is null and ${inList(t.role, STAFF_ROLES)} and ${t.staffRegion} is not null)`,
    ),
  ],
);

/** "Request access" from the sign-in page. Routed by email domain to that partner's admin. */
export const accessRequests = pgTable(
  'access_requests',
  {
    id: id(),
    partnerId: uuid('partner_id').notNull().references(() => partners.id),
    email: text('email').notNull(),
    name: text('name').notNull(),
    note: text('note'),
    requestedRole: text('requested_role', { enum: ACCESS_REQUEST_ROLES }).notNull().default('sales'),
    status: text('status', { enum: ACCESS_REQUEST_STATUSES }).notNull().default('open'),
    decidedBy: uuid('decided_by').references(() => users.id),
    decidedAt: ts('decided_at'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('access_requests_open_key').on(t.partnerId, t.email).where(sql`${t.status} = 'open'`),
    check('access_requests_email_lower', sql`${t.email} = lower(${t.email})`),
    check('access_requests_status_chk', inList(t.status, ACCESS_REQUEST_STATUSES)),
  ],
);

/** A partner admin's request to move a colleague's sign-in to a new address. The link goes to the new address and works once. */
export const emailChangeRequests = pgTable(
  'email_change_requests',
  {
    id: id(),
    partnerId: uuid('partner_id').notNull().references(() => partners.id),
    userId: uuid('user_id').notNull().references(() => users.id),
    newEmail: text('new_email').notNull(),
    tokenHash: text('token_hash').notNull(),
    requestedBy: uuid('requested_by').references(() => users.id),
    expiresAt: ts('expires_at').notNull(),
    usedAt: ts('used_at'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('email_change_requests_token_hash_key').on(t.tokenHash),
    index('email_change_requests_user_idx').on(t.userId),
    check('email_change_requests_email_lower', sql`${t.newEmail} = lower(${t.newEmail})`),
  ],
);

/* ---------------------------------------------------------------- registrations */

/** REG-YYMM-NNNN. The repo formats nextval; the yymm part is the month of registration. */
export const registrationReferenceSeq = pgSequence('registration_reference_seq', { startWith: 1, increment: 1 });

export const registrations = pgTable(
  'registrations',
  {
    id: id(),
    reference: text('reference').notNull(),
    partnerId: uuid('partner_id').notNull().references(() => partners.id),
    registeredBy: uuid('registered_by').references(() => users.id),
    registeredByName: text('registered_by_name').notNull(),
    customerName: text('customer_name').notNull(),
    customerDomain: text('customer_domain'),
    product: text('product', { enum: PRODUCTS }).notNull(),
    region: text('region').notNull().references(() => regions.key),
    managerId: uuid('manager_id').references(() => users.id),
    expectedClose: text('expected_close'),
    notes: text('notes'),
    dealValue: numeric('deal_value', { precision: 14, scale: 2, mode: 'number' }),
    currency: text('currency', { enum: DEAL_CURRENCIES }).notNull().default('USD'),
    customerCountry: text('customer_country'),
    customerIndustry: text('customer_industry'),
    useCase: text('use_case'),
    competitor: text('competitor'),
    seats: integer('seats'),
    salesStage: text('sales_stage'),
    decisionDate: date('decision_date', { mode: 'string' }),
    status: text('status', { enum: REGISTRATION_STATUSES }).notNull().default('pending'),
    stage: text('stage').notNull().default(STAGE_AWAITING_REVIEW),
    registeredOn: date('registered_on', { mode: 'string' }).notNull(),
    resubmittedOn: date('resubmitted_on', { mode: 'string' }),
    decidedBy: uuid('decided_by').references(() => users.id),
    decidedByLabel: text('decided_by_label'),
    decidedAt: ts('decided_at'),
    rejectionReason: text('rejection_reason'),
    protectionEnd: date('protection_end', { mode: 'string' }),
    extensionStatus: text('extension_status', { enum: EXTENSION_STATUSES }).notNull().default('none'),
    extensionRequestedAt: ts('extension_requested_at'),
    extensionReason: text('extension_reason'),
    extensionGrantedAt: ts('extension_granted_at'),
    extensionDays: integer('extension_days'),
    closedOn: date('closed_on', { mode: 'string' }),
    hubspotDealId: text('hubspot_deal_id'),
    hubspotStageId: text('hubspot_stage_id'),
    hubspotSyncedAt: ts('hubspot_synced_at'),
    hubspotMissing: boolean('hubspot_missing').notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('registrations_reference_key').on(t.reference),
    uniqueIndex('registrations_open_unique')
      .on(t.partnerId, sql`lower(${t.customerName})`, t.product)
      .where(sql`${t.status} in ('pending', 'accepted')`),
    uniqueIndex('registrations_hubspot_deal_key').on(t.hubspotDealId).where(sql`${t.hubspotDealId} is not null`),
    index('registrations_partner_status_idx').on(t.partnerId, t.status),
    index('registrations_queue_idx').on(t.status, t.region, t.registeredOn),
    index('registrations_protection_end_idx').on(t.protectionEnd).where(sql`${t.status} = 'accepted'`),
    index('registrations_customer_trgm').using('gin', t.customerName.op('gin_trgm_ops')),
    check('registrations_status_chk', inList(t.status, REGISTRATION_STATUSES)),
    check('registrations_product_chk', inList(t.product, PRODUCTS)),
    check('registrations_extension_chk', inList(t.extensionStatus, EXTENSION_STATUSES)),
    check('registrations_currency_chk', inList(t.currency, DEAL_CURRENCIES)),
    check('registrations_deal_value_chk', sql`${t.dealValue} is null or ${t.dealValue} >= 0`),
    check('registrations_seats_chk', sql`${t.seats} is null or ${t.seats} >= 0`),
  ],
);

export const registrationContacts = pgTable(
  'registration_contacts',
  {
    id: id(),
    registrationId: uuid('registration_id').notNull().references(() => registrations.id),
    partnerId: uuid('partner_id').notNull().default(NIL_UUID).references(() => partners.id),
    name: text('name').notNull(),
    role: text('role'),
    email: text('email'),
    phone: text('phone'),
    hubspotContactId: text('hubspot_contact_id'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('registration_contacts_reg_idx').on(t.registrationId), index('registration_contacts_partner_idx').on(t.partnerId)],
);

/** The conversation thread on a deal. author_name and author_org are copied at write time so a removed user still reads correctly. */
export const registrationMessages = pgTable(
  'registration_messages',
  {
    id: id(),
    registrationId: uuid('registration_id').notNull().references(() => registrations.id),
    partnerId: uuid('partner_id').notNull().default(NIL_UUID).references(() => partners.id),
    authorId: uuid('author_id').references(() => users.id),
    authorName: text('author_name').notNull(),
    authorOrg: text('author_org').notNull(),
    side: text('side', { enum: MESSAGE_SIDES }).notNull(),
    body: text('body').notNull(),
    /** True for the line an accept or reject decision writes, so undoing the decision removes it. */
    auto: boolean('auto').notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index('registration_messages_reg_idx').on(t.registrationId, t.createdAt), check('registration_messages_side_chk', inList(t.side, MESSAGE_SIDES))],
);

/** Timeline on the deal page. */
export const registrationEvents = pgTable(
  'registration_events',
  {
    id: id(),
    registrationId: uuid('registration_id').notNull().references(() => registrations.id),
    partnerId: uuid('partner_id').notNull().default(NIL_UUID).references(() => partners.id),
    at: ts('at').notNull().defaultNow(),
    text: text('text').notNull(),
    byLabel: text('by_label').notNull(),
    source: text('source', { enum: EVENT_SOURCES }).notNull(),
    auto: boolean('auto').notNull().default(false),
  },
  (t) => [index('registration_events_reg_idx').on(t.registrationId, t.at), check('registration_events_source_chk', inList(t.source, EVENT_SOURCES))],
);

/** Dedupe for the 14 and 3 day expiry reminders. System only (no partner policy). */
export const registrationReminders = pgTable(
  'registration_reminders',
  {
    registrationId: uuid('registration_id').notNull().references(() => registrations.id),
    daysBefore: integer('days_before').notNull(),
    protectionEnd: date('protection_end', { mode: 'string' }).notNull(),
    sentAt: ts('sent_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.registrationId, t.daysBefore, t.protectionEnd] })],
);

/* ---------------------------------------------------------------- documents */

export const documents = pgTable(
  'documents',
  {
    id: id(),
    title: text('title').notNull(),
    type: text('type', { enum: DOCUMENT_TYPES }).notNull(),
    product: text('product', { enum: DOC_PRODUCTS }).notNull(),
    summary: text('summary'),
    audienceKind: text('audience_kind', { enum: AUDIENCE_KINDS }).notNull().default('all'),
    audienceCategories: text('audience_categories').array().notNull().default(sql`'{}'::text[]`),
    fileKey: text('file_key').notNull(),
    fileSize: bigint('file_size', { mode: 'number' }).notNull(),
    mime: text('mime').notNull(),
    originalName: text('original_name').notNull(),
    /** Video only: storage key of the poster image (png or jpg). Null for none. Never sent to the browser; the poster route reads it. */
    posterKey: text('poster_key'),
    /** Video only: storage key of the captions file (.vtt). Null for none. */
    captionsKey: text('captions_key'),
    durationMinutes: integer('duration_minutes'),
    version: integer('version').notNull().default(1),
    /** What changed in the current file, written on Replace file. Copied to the version row when the file is replaced. */
    changeNote: text('change_note'),
    /** Drafts are staff only and not announced. */
    status: text('status', { enum: DOCUMENT_STATUSES }).notNull().default('published'),
    /** From this moment partners no longer see the document; staff see it marked Expired. */
    expiresAt: ts('expires_at'),
    uploadedBy: uuid('uploaded_by').references(() => users.id),
    deletedAt: ts('deleted_at'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('documents_title_trgm').using('gin', t.title.op('gin_trgm_ops')),
    index('documents_listing_idx').on(t.updatedAt).where(sql`${t.deletedAt} is null`),
    uniqueIndex('documents_file_key_key').on(t.fileKey),
    check('documents_type_chk', inList(t.type, DOCUMENT_TYPES)),
    check('documents_product_chk', inList(t.product, DOC_PRODUCTS)),
    check('documents_audience_chk', inList(t.audienceKind, AUDIENCE_KINDS)),
    check('documents_categories_chk', sql`${t.audienceCategories} <@ array[${sql.raw(PARTNER_CATEGORIES.map((c) => `'${c}'`).join(', '))}]::text[]`),
    check('documents_categories_required_chk', sql`${t.audienceKind} <> 'categories' or cardinality(${t.audienceCategories}) > 0`),
    check('documents_version_chk', sql`${t.version} >= 1`),
    check('documents_status_chk', inList(t.status, DOCUMENT_STATUSES)),
  ],
);

/** Used when audience_kind is 'named'. partner_id is the partner allowed to open the document. */
export const documentAudience = pgTable(
  'document_audience',
  {
    documentId: uuid('document_id').notNull().references(() => documents.id),
    partnerId: uuid('partner_id').notNull().references(() => partners.id),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.documentId, t.partnerId] }), index('document_audience_partner_idx').on(t.partnerId)],
);

/** The previous file of a document after a replace. Kept 30 days, then purged with its R2 object. */
export const documentVersions = pgTable(
  'document_versions',
  {
    id: id(),
    documentId: uuid('document_id').notNull().references(() => documents.id),
    version: integer('version').notNull(),
    fileKey: text('file_key').notNull(),
    fileSize: bigint('file_size', { mode: 'number' }).notNull(),
    mime: text('mime').notNull(),
    originalName: text('original_name').notNull(),
    changeNote: text('change_note'),
    replacedAt: ts('replaced_at').notNull().defaultNow(),
    purgeAfter: ts('purge_after').notNull(),
    replacedBy: uuid('replaced_by').references(() => users.id),
  },
  (t) => [unique('document_versions_doc_version_key').on(t.documentId, t.version), index('document_versions_purge_idx').on(t.purgeAfter)],
);

/** One row per open by a partner user. Staff opens are not recorded. */
export const documentOpens = pgTable(
  'document_opens',
  {
    id: id(),
    documentId: uuid('document_id').notNull().references(() => documents.id),
    userId: uuid('user_id').notNull().references(() => users.id),
    partnerId: uuid('partner_id').notNull().references(() => partners.id),
    openedAt: ts('opened_at').notNull().defaultNow(),
  },
  (t) => [index('document_opens_doc_idx').on(t.documentId, t.partnerId), index('document_opens_partner_idx').on(t.partnerId, t.openedAt)],
);

/** A partner's request for sales material. Partners see their company's rows; staff work them from /admin/documents. */
export const materialRequests = pgTable(
  'material_requests',
  {
    id: id(),
    partnerId: uuid('partner_id').notNull().references(() => partners.id),
    requestedBy: uuid('requested_by').notNull().references(() => users.id),
    subject: text('subject').notNull(),
    details: text('details').notNull(),
    product: text('product', { enum: DOC_PRODUCTS }).notNull(),
    status: text('status', { enum: MATERIAL_REQUEST_STATUSES }).notNull().default('open'),
    responseNote: text('response_note'),
    /** The document that answers the request, set by staff. */
    documentId: uuid('document_id').references(() => documents.id),
    assignedTo: uuid('assigned_to').references(() => users.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    closedAt: ts('closed_at'),
  },
  (t) => [
    index('material_requests_partner_idx').on(t.partnerId, t.createdAt),
    index('material_requests_status_idx').on(t.status, t.createdAt),
    check('material_requests_status_chk', inList(t.status, MATERIAL_REQUEST_STATUSES)),
    check('material_requests_product_chk', inList(t.product, DOC_PRODUCTS)),
  ],
);

/* ---------------------------------------------------------------- notifications and audit */

export const notifications = pgTable(
  'notifications',
  {
    id: id(),
    userId: uuid('user_id').notNull().references(() => users.id),
    kind: text('kind', { enum: NOTIFICATION_KINDS }).notNull(),
    title: text('title').notNull(),
    body: text('body'),
    link: text('link'),
    readAt: ts('read_at'),
    createdAt: createdAt(),
  },
  (t) => [
    index('notifications_user_idx').on(t.userId, t.createdAt),
    check('notifications_kind_chk', inList(t.kind, NOTIFICATION_KINDS)),
  ],
);

export const notificationPrefs = pgTable(
  'notification_prefs',
  {
    userId: uuid('user_id').notNull().references(() => users.id),
    category: text('category', { enum: NOTIFICATION_CATEGORIES }).notNull(),
    email: boolean('email').notNull(),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.category] }), check('notification_prefs_category_chk', inList(t.category, NOTIFICATION_CATEGORIES))],
);

/**
 * Append only. The app role has INSERT and SELECT, no UPDATE or DELETE, and a trigger rejects both for everyone.
 * event is the closed name from src/server/audit/events.ts. action, kind and who are derived from it by recordAudit.
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: id(),
    at: ts('at').notNull().defaultNow(),
    actorId: uuid('actor_id').references(() => users.id),
    actorLabel: text('actor_label').notNull(),
    actorRole: text('actor_role'),
    who: text('who', { enum: AUDIT_WHO }).notNull(),
    kind: text('kind', { enum: AUDIT_KINDS }).notNull(),
    event: text('event').notNull(),
    action: text('action'),
    target: text('target'),
    text: text('text').notNull(),
    source: text('source', { enum: EVENT_SOURCES }).notNull().default('portal'),
    before: text('before'),
    after: text('after'),
    note: text('note'),
    partnerId: uuid('partner_id').references(() => partners.id),
    subjectType: text('subject_type'),
    subjectId: text('subject_id'),
  },
  (t) => [
    index('audit_log_at_idx').on(t.at),
    index('audit_log_kind_idx').on(t.kind, t.at),
    index('audit_log_partner_idx').on(t.partnerId, t.at),
    check('audit_log_who_chk', inList(t.who, AUDIT_WHO)),
    check('audit_log_kind_chk', inList(t.kind, AUDIT_KINDS)),
  ],
);

/* ---------------------------------------------------------------- HubSpot */

export const hubspotOutbox = pgTable(
  'hubspot_outbox',
  {
    id: id(),
    op: text('op', { enum: OUTBOX_OPS }).notNull(),
    subjectId: text('subject_id').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    idempotencyKey: text('idempotency_key').notNull(),
    status: text('status', { enum: OUTBOX_STATUSES }).notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    nextAttemptAt: ts('next_attempt_at').notNull().defaultNow(),
    lastError: text('last_error'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('hubspot_outbox_idempotency_key').on(t.idempotencyKey),
    index('hubspot_outbox_due_idx').on(t.nextAttemptAt).where(sql`${t.status} = 'pending'`),
    check('hubspot_outbox_op_chk', inList(t.op, OUTBOX_OPS)),
    check('hubspot_outbox_status_chk', inList(t.status, OUTBOX_STATUSES)),
  ],
);

/** Poll cursor ('deals_cursor') and the website intake cursor ('website_applications_cursor'). */
export const hubspotSyncState = pgTable('hubspot_sync_state', {
  key: text('key').primaryKey(),
  value: jsonb('value').$type<Record<string, unknown>>().notNull(),
  updatedAt: updatedAt(),
});

/* ---------------------------------------------------------------- Better Auth tables (section M item 2) */

export const authSessions = pgTable(
  'auth_session',
  {
    id: id(),
    token: text('token').notNull(),
    expiresAt: ts('expires_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('auth_session_token_key').on(t.token), index('auth_session_user_idx').on(t.userId)],
);

export const authAccounts = pgTable(
  'auth_account',
  {
    id: id(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: ts('access_token_expires_at'),
    refreshTokenExpiresAt: ts('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [unique('auth_account_provider_key').on(t.providerId, t.accountId), index('auth_account_user_idx').on(t.userId)],
);

export const authVerifications = pgTable(
  'auth_verification',
  {
    id: id(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: ts('expires_at').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('auth_verification_identifier_idx').on(t.identifier)],
);

export const authTwoFactors = pgTable(
  'auth_two_factor',
  {
    id: id(),
    secret: text('secret').notNull(),
    backupCodes: text('backup_codes').notNull(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    // Better Auth 1.7 refuses to start without these three (plan 02, M0.7). They are part of 0000_init, not a later migration.
    verified: boolean('verified').notNull().default(true),
    failedVerificationCount: integer('failed_verification_count').notNull().default(0),
    lockedUntil: ts('locked_until'),
  },
  (t) => [index('auth_two_factor_user_idx').on(t.userId)],
);

/* ---------------------------------------------------------------- inferred row types (server only) */

export type PartnerRow = typeof partners.$inferSelect;
export type UserRow = typeof users.$inferSelect;
export type ApplicationRow = typeof applications.$inferSelect;
export type InviteRow = typeof invites.$inferSelect;
export type RegistrationRow = typeof registrations.$inferSelect;
export type DocumentRow = typeof documents.$inferSelect;
export type OutboxRow = typeof hubspotOutbox.$inferSelect;
