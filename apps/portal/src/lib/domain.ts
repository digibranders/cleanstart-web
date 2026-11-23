export const PARTNER_CATEGORIES = ['distributor', 'channel'] as const;
export type PartnerCategory = (typeof PARTNER_CATEGORIES)[number];
export const PARTNER_CATEGORY_LABEL: Record<PartnerCategory, string> = {
  distributor: 'Distributor',
  channel: 'Channel partner',
};
export const PARTNER_CATEGORY_PLURAL: Record<PartnerCategory, string> = {
  distributor: 'Distributors',
  channel: 'Channel partners',
};

export const PARTNER_REGIONS = ['india', 'middle_east', 'elsewhere'] as const;
export type PartnerRegion = (typeof PARTNER_REGIONS)[number];
export const PARTNER_REGION_LABEL: Record<PartnerRegion, string> = {
  india: 'India',
  middle_east: 'Middle East',
  elsewhere: 'Elsewhere',
};

/** Regions a deal can be registered in. A partner in 'elsewhere' still registers in one of these two. */
export const DEAL_REGIONS = ['india', 'middle_east'] as const;
export type DealRegion = (typeof DEAL_REGIONS)[number];

export const PARTNER_STATUSES = ['onboarding', 'active', 'inactive', 'suspended'] as const;
export type PartnerStatus = (typeof PARTNER_STATUSES)[number];
export const PARTNER_STATUS_LABEL: Record<PartnerStatus, string> = {
  onboarding: 'Onboarding',
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspended',
};

export const USER_KINDS = ['partner', 'staff'] as const;
export type UserKind = (typeof USER_KINDS)[number];
export const USER_STATUSES = ['invited', 'active', 'disabled'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const PARTNER_ROLES = ['partner_admin', 'sales', 'technical'] as const;
export type PartnerRole = (typeof PARTNER_ROLES)[number];
export const PARTNER_ROLE_LABEL: Record<PartnerRole, string> = {
  partner_admin: 'Partner admin',
  sales: 'Sales',
  technical: 'Technical',
};

export const STAFF_ROLES = ['partner_manager', 'sales', 'marketing'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];
export const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  partner_manager: 'Partner manager',
  sales: 'Sales',
  marketing: 'Marketing',
};

export const STAFF_REGIONS = ['india', 'middle_east', 'all'] as const;
export type StaffRegion = (typeof STAFF_REGIONS)[number];
export const STAFF_REGION_LABEL: Record<StaffRegion, string> = {
  india: 'India',
  middle_east: 'Middle East',
  all: 'All regions',
};

/** Currencies a deal value can be entered in. USD is the default. */
export const DEAL_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AED', 'SAR'] as const;
export type DealCurrency = (typeof DEAL_CURRENCIES)[number];
export const DEFAULT_DEAL_CURRENCY: DealCurrency = 'USD';

export const PRODUCTS = ['images', 'libraries', 'cleansight'] as const;
export type Product = (typeof PRODUCTS)[number];
export const PRODUCT_LABEL: Record<Product, string> = {
  images: 'CleanStart Images',
  libraries: 'Clean Libraries',
  cleansight: 'CleanSight',
};
export const PRODUCT_SHORT_LABEL: Record<Product, string> = {
  images: 'Images',
  libraries: 'Libraries',
  cleansight: 'CleanSight',
};
/** Documents can be about one product or about all of them. */
export const DOC_PRODUCTS = ['images', 'libraries', 'cleansight', 'all'] as const;
export type DocProduct = (typeof DOC_PRODUCTS)[number];
export const DOC_PRODUCT_LABEL: Record<DocProduct, string> = { ...PRODUCT_LABEL, all: 'All products' };

export const REGISTRATION_STATUSES = ['pending', 'accepted', 'rejected', 'expired', 'won', 'lost'] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];
export const REGISTRATION_STATUS_LABEL: Record<RegistrationStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
  won: 'Won',
  lost: 'Lost',
};
/** Stage text written by the portal itself. HubSpot stage labels are in src/server/hubspot/types.ts. */
export const STAGE_AWAITING_REVIEW = 'Awaiting review';
export const STAGE_NOT_ACCEPTED = 'Not accepted';

export const EXTENSION_STATUSES = ['none', 'requested', 'granted', 'declined'] as const;
export type ExtensionStatus = (typeof EXTENSION_STATUSES)[number];

export const EVENT_SOURCES = ['portal', 'crm', 'system'] as const;
export type EventSource = (typeof EVENT_SOURCES)[number];
export const EVENT_SOURCE_LABEL: Record<EventSource, string> = { portal: 'Portal', crm: 'CRM', system: 'System' };

export const MESSAGE_SIDES = ['partner', 'staff'] as const;
export type MessageSide = (typeof MESSAGE_SIDES)[number];

export const APPLICATION_STATUSES = ['new', 'approved', 'declined'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export const APPLICATION_SOURCES = ['portal', 'website'] as const;
export type ApplicationSource = (typeof APPLICATION_SOURCES)[number];

export const ACCESS_REQUEST_STATUSES = ['open', 'approved', 'declined'] as const;
export type AccessRequestStatus = (typeof ACCESS_REQUEST_STATUSES)[number];
/** A partner admin can grant a requester one of these; never partner_admin. */
export const ACCESS_REQUEST_ROLES = ['sales', 'technical'] as const;
export type AccessRequestRole = (typeof ACCESS_REQUEST_ROLES)[number];

export const DOCUMENT_TYPES = [
  'datasheet',
  'solution_sheet',
  'battlecard',
  'price_list',
  'video',
  'enablement_guide',
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];
export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  datasheet: 'Datasheet',
  solution_sheet: 'Solution sheet',
  battlecard: 'Battlecard',
  price_list: 'Price list',
  video: 'Video',
  enablement_guide: 'Enablement guide',
};
export const AUDIENCE_KINDS = ['all', 'categories', 'named'] as const;
export type AudienceKind = (typeof AUDIENCE_KINDS)[number];

export const AUDIT_KINDS = ['deal_decisions', 'partners', 'documents', 'people_access'] as const;
export type AuditKind = (typeof AUDIT_KINDS)[number];
export const AUDIT_KIND_LABEL: Record<AuditKind, string> = {
  deal_decisions: 'Deal decisions',
  partners: 'Partners',
  documents: 'Documents',
  people_access: 'People and access',
};
export const AUDIT_WHO = ['staff', 'partner', 'sync'] as const;
export type AuditWho = (typeof AUDIT_WHO)[number];

export const OUTBOX_STATUSES = ['pending', 'done', 'failed'] as const;
export type OutboxStatus = (typeof OUTBOX_STATUSES)[number];
export const OUTBOX_OPS = [
  'partner.upsert',
  'user.upsert',
  'registration.create',
  'registration.update_end',
  'registration.expire',
] as const;
export type OutboxOp = (typeof OUTBOX_OPS)[number];

/** The five switches on the Account screen. */
export const NOTIFICATION_CATEGORIES = ['decision', 'stage', 'expiry', 'docs', 'team'] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const NOTIFICATION_KINDS = [
  'registration_submitted',
  'registration_accepted',
  'registration_rejected',
  'registration_resubmitted',
  'registration_stage',
  'registration_message',
  'registration_expiring',
  'registration_expired',
  'extension_requested',
  'extension_decided',
  'document_new',
  'access_requested',
  'application_new',
  'team_joined',
  'team_removed',
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

/**
 * Which Account switch controls the email for a notification. In-app notifications are always created.
 * null means the email is always sent to a staff recipient and never gated by a switch.
 */
export const NOTIFICATION_CATEGORY_OF: Record<NotificationKind, NotificationCategory | null> = {
  registration_submitted: null,
  registration_accepted: 'decision',
  registration_rejected: 'decision',
  registration_resubmitted: null,
  registration_stage: 'stage',
  registration_message: 'decision',
  registration_expiring: 'expiry',
  registration_expired: 'expiry',
  extension_requested: null,
  extension_decided: 'decision',
  document_new: 'docs',
  access_requested: 'team',
  application_new: null,
  team_joined: 'team',
  team_removed: 'team',
};

export const CHECKLIST_STEPS = ['agreement', 'company', 'team', 'kickoff', 'playbook', 'deal'] as const;
export type ChecklistStep = (typeof CHECKLIST_STEPS)[number];
/** Steps the repo derives from data. The other two (kickoff, playbook) are ticked by the partner and stored. */
export const DERIVED_CHECKLIST_STEPS: readonly ChecklistStep[] = ['agreement', 'company', 'team', 'deal'];

export const isOneOf = <T extends string>(values: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (values as readonly string[]).includes(value);
