import type { DealCurrency } from './domain';
import type { RegistrationDetailDto } from './dto';

/** The fields a partner may change while a registration is pending. `undefined` is "leave alone", `null` is "clear". */
export interface RegistrationPatch {
  customer?: string | undefined;
  website?: string | null | undefined;
  customerCountry?: string | null | undefined;
  customerIndustry?: string | null | undefined;
  useCase?: string | null | undefined;
  competitor?: string | null | undefined;
  seats?: number | null | undefined;
  dealValue?: number | null | undefined;
  currency?: DealCurrency | undefined;
  salesStage?: string | null | undefined;
  expectedClose?: string | null | undefined;
  decisionDate?: string | null | undefined;
  notes?: string | null | undefined;
}

export const PATCH_LABEL: Record<keyof RegistrationPatch, string> = {
  customer: 'Customer',
  website: 'Website',
  customerCountry: 'Country',
  customerIndustry: 'Industry',
  useCase: 'Use case',
  competitor: 'Competitor',
  seats: 'Seats',
  dealValue: 'Deal value',
  currency: 'Currency',
  salesStage: 'Sales stage',
  expectedClose: 'Expected close',
  decisionDate: 'Decision date',
  notes: 'Notes',
};

export interface FieldChange {
  field: keyof RegistrationPatch;
  label: string;
  before: string;
  after: string;
}

const show = (value: string | number | null | undefined): string => (value === null || value === undefined || value === '' ? 'empty' : String(value));

/** Only the fields whose value really changes, so an untouched drawer writes nothing. */
export function changedFields(current: RegistrationDetailDto, patch: RegistrationPatch): FieldChange[] {
  const before: Record<keyof RegistrationPatch, string | number | null> = {
    customer: current.customer,
    website: current.website,
    customerCountry: current.customerCountry,
    customerIndustry: current.customerIndustry,
    useCase: current.useCase,
    competitor: current.competitor,
    seats: current.seats,
    dealValue: current.dealValue,
    currency: current.currency,
    salesStage: current.salesStage,
    expectedClose: current.expectedClose,
    decisionDate: current.decisionDate,
    notes: current.notes,
  };
  const changes: FieldChange[] = [];
  for (const field of Object.keys(PATCH_LABEL) as Array<keyof RegistrationPatch>) {
    const next = patch[field];
    if (next === undefined || show(next) === show(before[field])) continue;
    changes.push({ field, label: PATCH_LABEL[field], before: show(before[field]), after: show(next) });
  }
  return changes;
}

/** A registration must always leave at least one way to reach the customer. */
export const hasReachableContact = (contacts: Array<{ email: string | null; phone: string | null }>): boolean =>
  contacts.some((c) => Boolean(c.email?.trim()) || Boolean(c.phone?.trim()));
