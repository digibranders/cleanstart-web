// mappers.ts
import { fmtLong } from '@/lib/dates';
import type { HsDeal, RegistrationStatus, StageIds, StageLabel } from './types';

export const STAGE_TO_STATUS: Record<StageLabel, RegistrationStatus> = {
  Accepted: 'accepted',
  Discovery: 'accepted',
  'Technical evaluation': 'accepted',
  'Proposal sent': 'accepted',
  'Closed won': 'won',
  'Closed lost': 'lost',
  'Registration expired': 'expired',
};

const slug = (v: string): string => v.toLowerCase().replace(/\s+/g, '_');

/** HubSpot returns a date property as YYYY-MM-DD or as epoch milliseconds at midnight UTC. */
export const isoDate = (value: string | null | undefined): string | null => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const ms = Number(value);
  return Number.isFinite(ms) ? new Date(ms).toISOString().slice(0, 10) : null;
};

/** `product` and `region` are display labels (PRODUCT_LABEL, PARTNER_REGION_LABEL), not the stored codes. */
export interface RegistrationForSync {
  id: string; customerName: string; product: string; region: string; protectionEnd: string;
  /** REG-YYMM-NNNN. */
  reference?: string;
  dealValue?: number | null;
  currency?: string;
  customerCountry?: string | null;
  customerIndustry?: string | null;
  useCase?: string | null;
  competitor?: string | null;
  seats?: number | null;
  salesStage?: string | null;
  decisionDate?: string | null;
}
export interface PartnerForSync { name: string; hubspotCompanyId: string }

/** Optional registration details, written only when the partner gave them. `amount` and `deal_currency_code` are HubSpot's own deal properties. */
const optionalDealProperties = (reg: RegistrationForSync): Record<string, string> => {
  const out: Record<string, string> = {};
  const put = (name: string, value: string | number | null | undefined): void => {
    if (value !== null && value !== undefined && value !== '') out[name] = String(value);
  };
  put('portal_reference', reg.reference);
  put('amount', reg.dealValue);
  if (reg.dealValue !== null && reg.dealValue !== undefined) put('deal_currency_code', reg.currency);
  put('customer_country', reg.customerCountry);
  put('customer_industry', reg.customerIndustry);
  put('use_case', reg.useCase);
  put('competitor', reg.competitor);
  put('seats', reg.seats);
  put('sales_stage', reg.salesStage);
  put('decision_date', reg.decisionDate);
  return out;
};

export const dealProperties = (
  reg: RegistrationForSync, partner: PartnerForSync, stageIds: StageIds, pipelineId: string,
): Record<string, string> => ({
  ...optionalDealProperties(reg),
  dealname: `${reg.customerName} | ${reg.product} | ${partner.name}`,
  pipeline: pipelineId,
  dealstage: stageIds.Accepted,
  portal_registration_id: reg.id,
  protection_end_date: reg.protectionEnd,
  partner_product: slug(reg.product),
  partner_region: slug(reg.region),
  partner_name: partner.name,
  partner_company_id: partner.hubspotCompanyId,
});

export interface InboundChange {
  status: RegistrationStatus;
  stage: StageLabel;
  stageId: string;
  closedOn: string | null;
  protectionEnd: string | null;
  /** What moved, so the poll can pick the audit event. A stage move wins when both moved. */
  changed: 'stage' | 'protection_end';
  eventText: string;
}

export const decideInbound = (
  reg: { status: RegistrationStatus; hubspotStageId: string | null; protectionEnd: string | null },
  deal: HsDeal,
  stageLabelById: Record<string, string>,
  today: string,
): InboundChange | null => {
  const label = stageLabelById[deal.stageId] as StageLabel | undefined;
  if (!label) return null;
  const incomingEnd = isoDate(deal.properties.protection_end_date);
  const stageChanged = deal.stageId !== reg.hubspotStageId;
  const endChanged = incomingEnd !== null && incomingEnd !== reg.protectionEnd;
  if (!stageChanged && !endChanged) return null;

  const status = STAGE_TO_STATUS[label];
  const closed = status === 'won' || status === 'lost' || status === 'expired';
  return {
    status,
    stage: label,
    stageId: deal.stageId,
    closedOn: closed ? (isoDate(deal.properties.closedate) ?? today) : null,
    protectionEnd: endChanged ? incomingEnd : null,
    changed: stageChanged ? 'stage' : 'protection_end',
    eventText: stageChanged ? `Stage moved to ${label}` : `Protection end changed to ${fmtLong(incomingEnd ?? '')}`,
  };
};

const DELAYS_MS = [60_000, 300_000, 1_800_000, 7_200_000, 43_200_000];
/** Delay before attempt number `attempts + 1`, or null once the operation should be marked failed. */
export const nextDelayMs = (attempts: number): number | null => DELAYS_MS[attempts - 1] ?? null;
