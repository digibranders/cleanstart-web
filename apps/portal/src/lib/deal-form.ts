import { normalizeDomain } from './customer';
import { DEAL_CURRENCIES, type DealCurrency, type DealRegion, type Product } from './domain';

export const SALES_STAGES = ['Lead', 'Qualified', 'Proposal sent', 'Negotiation', 'Verbal commit'] as const;

export const INDUSTRIES = [
  'Banking and financial services',
  'Insurance',
  'Government and public sector',
  'Healthcare and life sciences',
  'Telecom',
  'Technology and software',
  'Manufacturing',
  'Retail and e-commerce',
  'Energy and utilities',
  'Education',
  'Media and entertainment',
  'Other',
] as const;

/** ISO 3166-1 alpha-2 codes; names come from Intl so the list stays short. */
const COUNTRY_CODES =
  'AF AL DZ AD AO AR AM AU AT AZ BH BD BY BE BJ BT BO BA BW BR BN BG KH CM CA CL CN CO CR HR CY CZ DK DO EC EG SV EE ET FI FR GE DE GH GR GT HN HK HU IS IN ID IQ IE IL IT JM JP JO KZ KE KW LV LB LT LU MY MV MT MU MX MD MN ME MA MZ MM NP NL NZ NI NG MK NO OM PK PA PY PE PH PL PT QA RO RU RW SA SN RS SG SK SI ZA KR ES LK SE CH TW TZ TH TN TR UG UA AE GB US UY UZ VN YE ZM ZW'.split(
    ' ',
  );

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

export interface CountryOption {
  code: string;
  name: string;
}

export const COUNTRIES: readonly CountryOption[] = COUNTRY_CODES.map((code) => ({ code, name: regionNames.of(code) ?? code })).sort((a, b) =>
  a.name.localeCompare(b.name),
);

const byLower = new Map(COUNTRIES.flatMap((c) => [[c.name.toLowerCase(), c] as const, [c.code.toLowerCase(), c] as const]));

/** The country a typed or stored value stands for (name or code), or null. */
export const findCountry = (value: string): CountryOption | null => byLower.get(value.trim().toLowerCase()) ?? null;

export interface ContactRow {
  /** Stable React key; never sent to the server. */
  key: string;
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface DealFormState {
  customer: string;
  site: string;
  country: string;
  industry: string;
  contacts: ContactRow[];
  picked: Product[];
  region: DealRegion;
  managerId: string;
  dealValue: string;
  currency: DealCurrency;
  salesStage: string;
  close: string;
  decisionDate: string;
  seats: string;
  competitor: string;
  useCase: string;
  details: string;
  consent: boolean;
}

export const MAX_CONTACTS = 10;

let keySeed = 0;
export const newContact = (over: Partial<Omit<ContactRow, 'key'>> = {}): ContactRow => {
  keySeed += 1;
  return { key: `c${keySeed}`, name: '', role: '', email: '', phone: '', ...over };
};

export const blankForm = (region: DealRegion, managerId: string): DealFormState => ({
  customer: '',
  site: '',
  country: '',
  industry: '',
  contacts: [newContact()],
  picked: [],
  region,
  managerId,
  dealValue: '',
  currency: DEAL_CURRENCIES[0],
  salesStage: '',
  close: '',
  decisionDate: '',
  seats: '',
  competitor: '',
  useCase: '',
  details: '',
  consent: false,
});

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_CHARS = /^[+\d][\d\s().-]*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const isBlankContact = (c: ContactRow): boolean => !c.name.trim() && !c.role.trim() && !c.email.trim() && !c.phone.trim();

const isRealDate = (value: string): boolean => ISO_DATE.test(value) && new Date(value).toISOString().slice(0, 10) === value;

/** One contact on its own (the edit drawers); validateDealForm applies the same rules row by row. */
export function contactErrors(c: Pick<ContactRow, 'name' | 'email' | 'phone'>): Partial<Record<'name' | 'email' | 'phone', string>> {
  const errors: Partial<Record<'name' | 'email' | 'phone', string>> = {};
  const email = c.email.trim();
  const phone = c.phone.trim();
  if (!c.name.trim()) errors.name = 'Enter the contact name.';
  if (email && !EMAIL.test(email)) errors.email = 'Enter a valid email.';
  if (phone && (!PHONE_CHARS.test(phone) || phone.replace(/\D/g, '').length < 6)) errors.phone = 'Enter a valid phone number.';
  return errors;
}

/** "1,25,000.50" and "125000" both read as numbers; anything else is NaN. */
export const parseAmount = (text: string): number => {
  const clean = text.trim().replace(/[,\s]/g, '');
  return clean !== '' && /^\d+(\.\d{1,2})?$/.test(clean) ? Number(clean) : Number.NaN;
};

/**
 * Field level messages, keyed like the server's issue paths (contacts.0.email) so both land under the same input.
 * An empty object means the form can be sent. A fully blank contact row is ignored, not an error.
 */
export function validateDealForm(form: DealFormState, today: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.customer.trim()) errors.customer = "Enter the customer's company name.";
  if (form.site.trim() && normalizeDomain(form.site) === null) errors.website = 'Enter a website such as vardhancapital.in.';
  if (form.country.trim() && !findCountry(form.country)) errors.customerCountry = 'Pick a country from the list.';
  if (form.picked.length === 0) errors.products = 'Pick at least one product.';

  let reachable = false;
  form.contacts.forEach((c, i) => {
    if (isBlankContact(c)) return;
    const email = c.email.trim();
    const phone = c.phone.trim();
    if (!c.name.trim()) errors[`contacts.${i}.name`] = 'Enter the contact name.';
    if (email && !EMAIL.test(email)) errors[`contacts.${i}.email`] = 'Enter a valid email.';
    if (phone && (!PHONE_CHARS.test(phone) || phone.replace(/\D/g, '').length < 6)) errors[`contacts.${i}.phone`] = 'Enter a valid phone number.';
    if ((email && !errors[`contacts.${i}.email`]) || (phone && !errors[`contacts.${i}.phone`])) reachable = true;
  });
  if (!reachable && !Object.keys(errors).some((k) => k.startsWith('contacts.'))) errors.contacts = 'Add a contact with an email or a phone number.';

  if (form.dealValue.trim()) {
    const value = parseAmount(form.dealValue);
    if (Number.isNaN(value)) errors.dealValue = 'Enter an amount such as 125000.';
    else if (value > 1e12) errors.dealValue = 'That deal value is too large.';
  }
  if (form.seats.trim() && !/^\d{1,8}$/.test(form.seats.trim())) errors.seats = 'Enter a whole number.';
  if (form.close && (!isRealDate(form.close) || form.close < today)) errors.expectedClose = 'Pick a date from today on.';
  if (form.decisionDate && !isRealDate(form.decisionDate)) errors.decisionDate = 'Enter a valid date.';
  if (!form.consent) errors.consent = 'Confirm that the information is accurate and the customer is aware.';
  return errors;
}

const orNull = (text: string): string | null => text.trim() || null;

/** The body of registerDealsAction. Call only after validateDealForm returned no errors. */
export function toRegisterInput(form: DealFormState): Record<string, unknown> {
  const country = findCountry(form.country);
  return {
    customer: form.customer.trim(),
    website: form.site,
    products: form.picked,
    region: form.region,
    managerId: form.managerId || null,
    contacts: form.contacts
      .filter((c) => !isBlankContact(c))
      .map((c) => ({ name: c.name, role: orNull(c.role), email: orNull(c.email), phone: orNull(c.phone) })),
    expectedClose: form.close,
    notes: form.details,
    dealValue: form.dealValue.trim() ? parseAmount(form.dealValue) : null,
    currency: form.currency,
    customerCountry: country ? country.code : null,
    customerIndustry: orNull(form.industry),
    useCase: form.useCase,
    competitor: form.competitor,
    seats: form.seats.trim() ? Number(form.seats) : null,
    salesStage: orNull(form.salesStage),
    decisionDate: form.decisionDate,
  };
}

/* ---------------------------------------------------------------- drafts */

export const draftKey = (userId: string): string => `cleanstart-portal:deal-draft:${userId}`;

export interface DealDraft {
  savedAt: string;
  form: DealFormState;
}

/** The consent box is never restored: the partner confirms again on the day they send. */
export const serializeDraft = (form: DealFormState, savedAt: Date): string =>
  JSON.stringify({ v: 1, savedAt: savedAt.toISOString(), form: { ...form, consent: false } });

/** A draft that is missing, corrupt or from another shape reads as no draft. */
export function parseDraft(raw: string | null): DealDraft | null {
  if (!raw) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return null;
    const { v, savedAt, form } = data as { v?: unknown; savedAt?: unknown; form?: Partial<DealFormState> };
    if (v !== 1 || typeof savedAt !== 'string' || typeof form !== 'object' || form === null) return null;
    if (!Array.isArray(form.contacts) || !Array.isArray(form.picked) || typeof form.customer !== 'string') return null;
    const base = blankForm(form.region ?? 'india', '');
    const contacts = form.contacts.map((c) => newContact({ name: c?.name ?? '', role: c?.role ?? '', email: c?.email ?? '', phone: c?.phone ?? '' }));
    return { savedAt, form: { ...base, ...form, contacts: contacts.length > 0 ? contacts : [newContact()], consent: false } };
  } catch {
    return null;
  }
}

/** Contact keys are random per session, so compare content only. */
export const formSignature = (form: DealFormState): string =>
  JSON.stringify({ ...form, contacts: form.contacts.map(({ key: _key, ...rest }) => rest) });

export const hasContent = (form: DealFormState, blank: DealFormState): boolean => formSignature(form) !== formSignature(blank);
