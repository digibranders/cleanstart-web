import { AUDIT_KIND_LABEL, AUDIT_KINDS, AUDIT_WHO, type AuditKind, type AuditWho, isOneOf } from '@/lib/domain';
import type { AuditPeriod } from '@/lib/dto';

/** The Audit log filters as they live in the URL. Pure and client safe; the page parses, the screen writes. */
export interface AuditView {
  period: AuditPeriod;
  kind: AuditKind | null;
  who: AuditWho | null;
  partnerId: string | null;
  q: string;
  cursor: string | null;
}

export const AUDIT_PERIODS = ['7d', '30d', '90d'] as const satisfies readonly AuditPeriod[];
export const DEFAULT_AUDIT_PERIOD: AuditPeriod = '30d';
export const AUDIT_Q_MAX = 100;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const AUDIT_PERIOD_LABEL: Record<AuditPeriod, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
};

export const AUDIT_WHO_LABEL: Record<AuditWho, string> = {
  staff: 'CleanStart team',
  partner: 'Partner users',
  sync: 'HubSpot sync',
};

export const ALL_ACTIONS_LABEL = 'All actions';
export const ANYONE_LABEL = 'Anyone';

export interface Choice<T extends string> {
  value: T | '';
  label: string;
}

export const KIND_CHOICES: Choice<AuditKind>[] = [
  { value: '', label: ALL_ACTIONS_LABEL },
  ...AUDIT_KINDS.map((value) => ({ value, label: AUDIT_KIND_LABEL[value] })),
];
export const WHO_CHOICES: Choice<AuditWho>[] = [
  { value: '', label: ANYONE_LABEL },
  ...AUDIT_WHO.map((value) => ({ value, label: AUDIT_WHO_LABEL[value] })),
];
export const PERIOD_CHOICES: Choice<AuditPeriod>[] = AUDIT_PERIODS.map((value) => ({
  value,
  label: AUDIT_PERIOD_LABEL[value],
}));

type Params = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);

/** Anything unknown falls back to the default, so a hand edited URL never throws. */
export function parseAuditView(params: Params): AuditView {
  const period = first(params.period);
  const kind = first(params.kind);
  const who = first(params.who);
  const cursor = first(params.cursor);
  const partnerId = first(params.partner);
  return {
    period: isOneOf(AUDIT_PERIODS, period) ? period : DEFAULT_AUDIT_PERIOD,
    kind: isOneOf(AUDIT_KINDS, kind) ? kind : null,
    who: isOneOf(AUDIT_WHO, who) ? who : null,
    partnerId: partnerId && UUID.test(partnerId) ? partnerId : null,
    q: (first(params.q) ?? '').trim().slice(0, AUDIT_Q_MAX),
    cursor: cursor && cursor.length <= 300 ? cursor : null,
  };
}

/** "" for the default view, otherwise "?period=7d&kind=partners". Defaults are omitted to keep URLs short. */
export function auditViewToQuery(view: AuditView): string {
  const search = new URLSearchParams();
  if (view.period !== DEFAULT_AUDIT_PERIOD) search.set('period', view.period);
  if (view.kind) search.set('kind', view.kind);
  if (view.who) search.set('who', view.who);
  if (view.partnerId) search.set('partner', view.partnerId);
  if (view.q) search.set('q', view.q);
  if (view.cursor) search.set('cursor', view.cursor);
  const text = search.toString();
  return text ? `?${text}` : '';
}

/** The filter the export action takes: everything except the cursor. */
export function auditViewToExportFilter(view: AuditView): {
  period: AuditPeriod;
  kind?: AuditKind;
  who?: AuditWho;
  partnerId?: string;
  q?: string;
} {
  return {
    period: view.period,
    ...(view.kind ? { kind: view.kind } : {}),
    ...(view.who ? { who: view.who } : {}),
    ...(view.partnerId ? { partnerId: view.partnerId } : {}),
    ...(view.q ? { q: view.q } : {}),
  };
}
