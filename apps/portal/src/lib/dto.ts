import type {
  AccessRequestRole,
  AccessRequestStatus,
  ApplicationSource,
  ApplicationNoteKind,
  ApplicationStatus,
  AudienceKind,
  AuditKind,
  AuditWho,
  ChecklistStep,
  DealCurrency,
  DealRegion,
  DocProduct,
  DocumentStatus,
  DocumentType,
  EventSource,
  ExtensionStatus,
  MaterialRequestStatus,
  MessageSide,
  NotificationCategory,
  NotificationKind,
  PartnerCategory,
  PartnerRegion,
  PartnerRole,
  PartnerStatus,
  Product,
  RegistrationStatus,
  StaffRegion,
  StaffRole,
  UserKind,
} from './domain';

export type IsoDate = string; // YYYY-MM-DD
export type IsoTimestamp = string; // 2026-11-06T14:02:00.000Z

export interface PageDto<T> {
  rows: T[];
  total: number;
  /** Opaque cursor for the next page, or null. */
  nextCursor: string | null;
}

/* ---------------------------------------------------------------- shell, account, people */

export interface ShellDto {
  viewerId: string;
  viewerName: string;
  viewerEmail: string;
  kind: UserKind;
  /** The role label shown under the name, e.g. "Partner admin" or "Partner manager, India". */
  roleLabel: string;
  /** Company line in the sidebar. Partners: the partner. Staff: "CleanStart", sub "Partnerships". */
  orgName: string;
  orgSub: string;
  /** The viewer's partner manager (partner viewers only). */
  manager: { id: string; name: string; email: string; team: string } | null;
  /** Partner viewers only: the partner's own region, the default on the deal form. */
  partnerRegion?: PartnerRegion;
  /** Staff only: pending registrations in the viewer's scope. Drives the nav count. */
  waitingApprovals: number;
  unreadNotifications: number;
}

export interface ProfileDto {
  id: string;
  name: string;
  email: string;
  title: string | null;
  phone: string | null;
  kind: UserKind;
  role: PartnerRole | StaffRole;
  partnerName: string | null;
  twoFactorEnabled: boolean;
  passwordChangedAt: IsoTimestamp | null;
  notifications: Record<NotificationCategory, boolean>;
}

export interface SessionDto {
  id: string;
  createdAt: IsoTimestamp;
  userAgent: string | null;
  ipAddress: string | null;
  current: boolean;
}

export interface TeamMemberDto {
  id: string;
  name: string;
  email: string;
  role: PartnerRole;
  status: 'active' | 'invited';
  lastActiveAt: IsoTimestamp | null;
  invitedAt: IsoTimestamp | null;
  /** Registrations this person registered. */
  deals: number;
  isYou: boolean;
  title: string | null;
  phone: string | null;
  /** The open invite for an invited member, for resend and withdraw. */
  inviteId: string | null;
}

/** Someone removed from the company: kept so their deals still show a name, and so an admin can reactivate them. */
export interface RemovedMemberDto {
  id: string;
  name: string;
  email: string;
  role: PartnerRole;
  removedAt: IsoTimestamp | null;
  deals: number;
}

export interface AccessRequestDto {
  id: string;
  name: string;
  email: string;
  requestedAt: IsoTimestamp;
  note: string | null;
  role: AccessRequestRole;
  status: AccessRequestStatus;
}

export interface TeamDto {
  partnerId: string;
  partnerName: string;
  members: TeamMemberDto[];
  requests: AccessRequestDto[];
  /** People removed from the company, newest removal first. They can be reactivated. */
  removed: RemovedMemberDto[];
}

export interface StaffMemberDto {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  region: StaffRegion;
  /** Names of the partners this person manages (partner managers only). */
  partners: string[];
  status: 'active' | 'invited';
  lastActiveAt: IsoTimestamp | null;
  inviteId: string | null;
  isYou: boolean;
}

export interface ManagerOptionDto {
  id: string;
  name: string;
  region: StaffRegion;
  /** "CleanStart India", "CleanStart Middle East". */
  team: string;
}

export type InviteState = 'ok' | 'expired' | 'used' | 'revoked' | 'unknown';

export interface InviteDto {
  id: string;
  email: string;
  kind: UserKind;
  role: PartnerRole | StaffRole;
  partnerId: string | null;
  staffRegion: StaffRegion | null;
  createdAt: IsoTimestamp;
  expiresAt: IsoTimestamp;
  resentCount: number;
  state: InviteState;
}

/** The token is returned once, to the caller that emails it. It is never stored in clear. */
export interface CreatedInviteDto {
  invite: InviteDto;
  token: string;
}

export interface InvitePreviewDto {
  state: InviteState;
  /** The fields below are present only when state is 'ok'. */
  email?: string;
  kind?: UserKind;
  role?: PartnerRole | StaffRole;
  partnerName?: string | null;
  /** Suggested display name (the applicant's name for a partner admin invite). */
  name?: string | null;
  /** True when accepting this invite also accepts the partner agreement (a new partner's first admin). */
  needsAgreement?: boolean;
  agreementVersion?: string;
}

/* ---------------------------------------------------------------- applications and partners */

export interface ApplicationDto {
  id: string;
  reference: string;
  company: string;
  domain: string;
  applicantName: string;
  email: string;
  role: string | null;
  phone: string | null;
  category: PartnerCategory | null;
  region: PartnerRegion | null;
  reason: string | null;
  submittedAt: IsoTimestamp;
  status: ApplicationStatus;
  source: ApplicationSource;
  personalEmail: boolean;
  existingDomain: boolean;
  declineReason: string | null;
  decidedAt: IsoTimestamp | null;
  partnerId: string | null;
  vendors: string[];
  products: string[];
  companySize: string | null;
  yearsInBusiness: string | null;
  verticals: string[];
  /** ISO 3166-1 alpha-2 code. */
  country: string | null;
  referralSource: string | null;
  consentAt: IsoTimestamp | null;
}

export interface ApplicationNoteDto {
  id: string;
  kind: ApplicationNoteKind;
  note: string;
  /** Null for the applicant's own reply. */
  authorName: string | null;
  createdAt: IsoTimestamp;
}

export interface PartnerListRow {
  id: string;
  name: string;
  domain: string;
  category: PartnerCategory;
  region: PartnerRegion;
  status: PartnerStatus;
  statusBeforeSuspend: PartnerStatus | null;
  /** People with a login (active or invited). */
  users: number;
  pending: number;
  protectedCount: number;
  won: number;
  lastActiveAt: IsoTimestamp | null;
  since: IsoDate;
  agreementVersion: string | null;
  agreementAcceptedAt: IsoTimestamp | null;
  adminName: string | null;
  managerId: string | null;
  managerName: string | null;
  hubspotCompanyId: string | null;
}

export interface PartnerPersonDto {
  id: string;
  name: string;
  email: string;
  role: PartnerRole;
  status: 'active' | 'invited';
  lastActiveAt: IsoTimestamp | null;
  invitedAt: IsoTimestamp | null;
  title: string | null;
  phone: string | null;
  /** Registrations this person registered. */
  deals: number;
  /** The open invite, for resend and withdraw. For an invite-only person it equals `id`. */
  inviteId: string | null;
  twoFactorEnabled: boolean;
}

export interface PartnerDealRow {
  registrationId: string;
  customer: string;
  product: Product;
  registeredOn: IsoDate;
  status: RegistrationStatus;
}

export interface PartnerDetailDto extends PartnerListRow {
  website: string | null;
  phone: string | null;
  address: string | null;
  about: string | null;
  people: PartnerPersonDto[];
  /** Why staff suspended the partner, from the audit entry. Null unless suspended. */
  suspendReason: string | null;
  openInvites: number;
  recentDeals: PartnerDealRow[];
}

export interface CompanyDto {
  partnerId: string;
  name: string;
  domain: string;
  category: PartnerCategory;
  region: PartnerRegion;
  status: PartnerStatus;
  website: string | null;
  phone: string | null;
  address: string | null;
  about: string | null;
  /** Tiers are out of scope for v1; always null and the screen shows "Not assigned". */
  tier: null;
  since: IsoDate;
  manager: { id: string; name: string; email: string; team: string } | null;
  agreementVersion: string | null;
  agreementAcceptedAt: IsoTimestamp | null;
}

export interface ChecklistDto {
  steps: Array<{ step: ChecklistStep; done: boolean; doneAt: IsoTimestamp | null }>;
  /** Whole percent of steps done. */
  percent: number;
}

/* ---------------------------------------------------------------- registrations */

export interface RegistrationContactDto {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
}

/** The customer details a partner carries over when registering the same customer again. */
export interface RegisterAgainDto {
  customer: string;
  website: string | null;
  country: string | null;
  industry: string | null;
  contacts: Array<Omit<RegistrationContactDto, 'id'>>;
}

export interface RegistrationMessageDto {
  id: string;
  authorId: string | null;
  authorName: string;
  authorOrg: string;
  side: MessageSide;
  body: string;
  createdAt: IsoTimestamp;
  auto: boolean;
}

export interface RegistrationEventDto {
  id: string;
  at: IsoTimestamp;
  text: string;
  byLabel: string;
  source: EventSource;
  auto: boolean;
}

export interface RegistrationListItem {
  id: string;
  /** REG-YYMM-NNNN. */
  reference: string;
  customer: string;
  website: string | null;
  partnerId: string;
  partnerName: string;
  partnerCategory: PartnerCategory;
  product: Product;
  region: DealRegion;
  managerId: string | null;
  managerName: string | null;
  registeredById: string | null;
  registeredByName: string;
  registeredOn: IsoDate;
  registeredAt: IsoTimestamp;
  resubmittedOn: IsoDate | null;
  status: RegistrationStatus;
  stage: string;
  protectionEnd: IsoDate | null;
  closedOn: IsoDate | null;
  decidedOn: IsoDate | null;
  decidedByLabel: string | null;
  rejectionReason: string | null;
  /** "HS-<hubspot deal id>", or null before the deal exists. */
  crmRef: string | null;
  crmSyncedAt: IsoTimestamp | null;
  extensionStatus: ExtensionStatus;
  /** Free text the partner typed; new registrations store YYYY-MM-DD. */
  expectedClose: string | null;
  /** Optional on registration; null when the partner did not give one. */
  dealValue: number | null;
  currency: DealCurrency;
  customerCountry: string | null;
}

export interface RegistrationDetailDto extends RegistrationListItem {
  notes: string | null;
  customerIndustry: string | null;
  useCase: string | null;
  competitor: string | null;
  seats: number | null;
  salesStage: string | null;
  decisionDate: IsoDate | null;
  extensionRequestedAt: IsoTimestamp | null;
  extensionReason: string | null;
  extensionGrantedAt: IsoTimestamp | null;
  extensionDays: number | null;
  hubspotMissing: boolean;
  decidedAt: IsoTimestamp | null;
  contacts: RegistrationContactDto[];
  /** Oldest first. */
  thread: RegistrationMessageDto[];
  /** Newest first. */
  history: RegistrationEventDto[];
}

export interface RegistrationCheckDto {
  kind: 'conflict' | 'info' | 'none';
  /** Present for 'conflict' and 'info': the other registration. */
  other?: {
    id: string;
    partnerName: string;
    product: Product;
    status: RegistrationStatus;
    registeredOn: IsoDate;
    protectionEnd: IsoDate | null;
    /** True when the other partner registered first (earlier registeredOn). */
    registeredFirst: boolean;
  };
}

export interface ApprovalRowDto {
  registration: RegistrationDetailDto;
  check: RegistrationCheckDto;
  /** Business days waiting since registeredOn or resubmittedOn. 0 for the same day. */
  waitingBusinessDays: number;
  overSla: boolean;
  /** True for a decision this viewer took within the undo window; the row stays with an Undo button. */
  canUndo: boolean;
}

export interface ApprovalQueueDto {
  rows: ApprovalRowDto[];
  counts: {
    waiting: number;
    overSla: number;
    conflicts: number;
    acceptedLast7Days: number;
    rejectedLast7Days: number;
    /** Protected deals ending within 14 days across every partner in the viewer's scope. */
    expiringIn14Days: number;
  };
  recentDecisions: RegistrationListItem[];
}

export interface CustomerSuggestionDto {
  name: string;
  website: string | null;
  /** The partner's own registrations for this customer, oldest first. */
  registrations: Array<{ id: string; product: Product; status: RegistrationStatus; protectionEnd: IsoDate | null }>;
}

export interface DecisionResult {
  registration: RegistrationDetailDto;
  partnerName: string;
  decidedAt: IsoTimestamp;
  /** Partner users to notify: the person who registered it, or the partner admins when that person is gone. */
  recipientUserIds: string[];
}

export interface ExtensionResult {
  registration: RegistrationDetailDto;
  partnerName: string;
  /** The deal's partner manager (staff user id) to notify, or null when none. */
  managerUserId: string | null;
}

export interface ExtensionDecisionResult {
  registration: RegistrationDetailDto;
  partnerName: string;
  granted: boolean;
  /** The new protection end when granted, otherwise null. Used as the outbox `version`. */
  newProtectionEnd: IsoDate | null;
  recipientUserIds: string[];
}

export interface ReminderCandidateDto {
  registrationId: string;
  customer: string;
  product: Product;
  partnerId: string;
  protectionEnd: IsoDate;
  daysBefore: number;
  /** Partner users who should be told: the registrant plus partner admins, deduplicated. */
  recipientUserIds: string[];
}

/* ---------------------------------------------------------------- overview and reports */

export interface AttentionItemDto {
  key: string;
  kind: 'access_request' | 'expiring' | 'late' | 'declined' | 'invite_pending';
  title: string;
  meta: string;
  href: string;
}

export interface PartnerOverviewDto {
  /** Salespeople see only their own deals; true tells the screen to say so. */
  ownDealsOnly: boolean;
  waiting: { count: number; oldestDays: number };
  protectedNow: { count: number; byProduct: Array<{ product: Product; count: number }> };
  expiring14: { count: number; customers: string[] };
  wonThisYear: { count: number; customers: string[] };
  attention: AttentionItemDto[];
  recent: RegistrationListItem[];
  newDocuments: DocumentListItemDto[];
}

export interface PartnerReportRow {
  partnerId: string;
  name: string;
  category: PartnerCategory;
  region: PartnerRegion;
  registered: number;
  waiting: number;
  /** Ever accepted: status accepted, won, lost or expired. */
  accepted: number;
  rejected: number;
  won: number;
  protectedNow: number;
}

export interface ProductReportRow {
  product: Product;
  registered: number;
  accepted: number;
  won: number;
}

export interface FollowUpDto {
  partnerId: string;
  name: string;
  /** "Invited 27 Oct, has not accepted the agreement". Built by the repo from real dates. */
  why: string;
  status: 'onboarding' | 'inactive';
}

export interface AdminReportsDto {
  totalPartners: number;
  totalRegistered: number;
  partners: PartnerReportRow[];
  products: ProductReportRow[];
  followUps: FollowUpDto[];
  expiringIn14Days: number;
}

/* ---------------------------------------------------------------- documents */

export interface DocumentAudienceDto {
  kind: AudienceKind;
  categories: PartnerCategory[];
  /** Named partners. Empty for partner viewers. */
  partners: Array<{ id: string; name: string }>;
}

export interface DocumentListItemDto {
  id: string;
  title: string;
  type: DocumentType;
  product: DocProduct;
  summary: string | null;
  durationMinutes: number | null;
  fileSize: number;
  mime: string;
  originalName: string;
  version: number;
  updatedAt: IsoTimestamp;
}

export interface DocumentDto extends DocumentListItemDto {
  audience: DocumentAudienceDto;
  uploadedByName: string | null;
  createdAt: IsoTimestamp;
  /** Staff only: total opens and distinct partners. Null for partner viewers. */
  opens: number | null;
  partnerCount: number | null;
  /** Partner only: opens by the viewer's own company. Null for staff. */
  ownOpens: number | null;
  /** Staff only: the latest open by any partner. Null for partner viewers and for a document nobody opened. */
  lastOpenedAt: IsoTimestamp | null;
  status: DocumentStatus;
  /** When partners stop seeing it. Null for no expiry. */
  expiresAt: IsoTimestamp | null;
  /** True once expiresAt has passed. Staff only; partners never receive an expired document. */
  expired: boolean;
}

/** Staff, the edit drawer. One row per partner that opened the document. */
export interface DocumentOpenerDto {
  partnerId: string;
  partnerName: string;
  opens: number;
  lastOpenedAt: IsoTimestamp;
}

export interface DocumentEngagementDto {
  openedBy: DocumentOpenerDto[];
  /** Partners the audience reaches that have not opened it. */
  notOpened: Array<{ partnerId: string; partnerName: string }>;
}

/** The current file and every earlier file still kept, newest first. */
export interface DocumentVersionDto {
  version: number;
  current: boolean;
  originalName: string;
  fileSize: number;
  mime: string;
  changeNote: string | null;
  /** Current: when the document last changed. Kept: when it was replaced. */
  at: IsoTimestamp;
  /** Kept versions only: the last day the old file can still be restored. */
  keptUntil: IsoTimestamp | null;
}

export interface MaterialRequestDto {
  id: string;
  partnerId: string;
  partnerName: string;
  requestedByName: string;
  subject: string;
  details: string;
  product: DocProduct;
  status: MaterialRequestStatus;
  responseNote: string | null;
  documentId: string | null;
  documentTitle: string | null;
  assignedToId: string | null;
  assignedToName: string | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  closedAt: IsoTimestamp | null;
}

export interface DocumentOpenTarget {
  fileKey: string;
  originalName: string;
  mime: string;
}

/* ---------------------------------------------------------------- audit, search, notifications, health */

export interface AuditEntryDto {
  id: string;
  at: IsoTimestamp;
  actorId: string | null;
  actorLabel: string;
  actorRole: string | null;
  whoKind: AuditWho;
  kind: AuditKind;
  event: string;
  action: string;
  target: string;
  source: EventSource;
  before: string | null;
  after: string | null;
  note: string | null;
  partnerId: string | null;
  subjectType: string | null;
  subjectId: string | null;
}

export type AuditPeriod = '7d' | '30d' | '90d';

export interface SearchHitDto {
  group: 'registrations' | 'partners' | 'documents' | 'people';
  label: string;
  hint: string;
  href: string;
  icon: 'deals' | 'bld' | 'file' | 'play' | 'team' | 'approve';
}

export interface NotificationDto {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  link: string | null;
  readAt: IsoTimestamp | null;
  createdAt: IsoTimestamp;
}

export interface NotificationsDto {
  items: NotificationDto[];
  unread: number;
}

export interface NotificationsPageDto extends NotificationsDto {
  /** Rows matching the filter, for the pager. */
  total: number;
  page: number;
  pageSize: number;
}

/** Exception to the string-dates rule: the HubSpot plan returns a Date, and a Date crosses the server to client boundary. */
export interface IntegrationHealthDto {
  pending: number;
  failed: number;
  lastPollAt: Date | null;
  lastError: string | null;
}
