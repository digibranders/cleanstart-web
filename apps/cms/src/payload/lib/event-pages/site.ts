/**
 * Shapes shared by the Event Pages collection, its endpoints and the events
 * site (events.cleanstart.com).
 *
 * A registration is a normal lead on a normal form. What ties it to an event is
 * `leads.source`, which the events site sets to `event:<slug>`. That lets many
 * events share one default form and still be counted and listed separately.
 */

/** The form every event uses unless it picks another one. */
export const DEFAULT_EVENT_FORM_SLUG = 'event-registration';

export const eventLeadSource = (slug: string): string => `event:${slug}`;

type RawRule = { fieldName?: string | null; operator?: string | null; value?: string | null };

type RawFormField = {
  name?: string | null;
  type?: string | null;
  label?: string | null;
  required?: boolean | null;
  placeholder?: string | null;
  helpText?: string | null;
  options?: { label?: string | null; value?: string | null }[] | null;
  validation?: { minLength?: number | null; maxLength?: number | null } | null;
  requireBusinessEmail?: boolean | null;
  conditions?: { mode?: string | null; rules?: RawRule[] | null } | null;
};

type RawForm = {
  slug?: string | null;
  submitLabel?: string | null;
  fields?: RawFormField[] | null;
};

type RawMedia = { url?: string | null; alt?: string | null } | number | null | undefined;

type RawEvent = {
  title?: string | null;
  slug?: string | null;
  description?: string | null;
  dateLabel?: string | null;
  venue?: string | null;
  registrationOpen?: boolean | null;
  partners?: { name?: string | null; url?: string | null; logo?: RawMedia }[] | null;
};

export type SiteFormField = {
  name: string;
  type: string;
  label: string;
  required: boolean;
  placeholder: string | null;
  helpText: string | null;
  options: { label: string; value: string }[];
  minLength: number | null;
  maxLength: number | null;
  requireBusinessEmail: boolean;
  conditions: { mode: 'all' | 'any'; rules: { fieldName: string; operator: string; value: string }[] };
};

export type SiteEvent = {
  slug: string;
  title: string;
  description: string | null;
  dateLabel: string | null;
  venue: string | null;
  registrationOpen: boolean;
  partners: { name: string; url: string; logoUrl: string | null }[];
  form: { slug: string; submitLabel: string; fields: SiteFormField[] };
};

/** Only what a visitor's browser needs to draw and pre-validate the form. */
export const toSiteFormFields = (fields: RawFormField[] | null | undefined): SiteFormField[] =>
  (fields ?? []).flatMap((field) => {
    if (!field.name || !field.type) return [];
    const rules = (field.conditions?.rules ?? []).flatMap((rule) =>
      rule.fieldName ? [{ fieldName: rule.fieldName, operator: rule.operator ?? 'equals', value: rule.value ?? '' }] : [],
    );
    return [
      {
        name: field.name,
        type: field.type,
        label: field.label?.trim() || field.name,
        required: field.required === true,
        placeholder: field.placeholder ?? null,
        helpText: field.helpText ?? null,
        options: (field.options ?? []).flatMap((o) => (o.value ? [{ label: o.label?.trim() || o.value, value: o.value }] : [])),
        minLength: field.validation?.minLength ?? null,
        maxLength: field.validation?.maxLength ?? null,
        requireBusinessEmail: field.requireBusinessEmail === true,
        conditions: { mode: field.conditions?.mode === 'any' ? ('any' as const) : ('all' as const), rules },
      },
    ];
  });

/** `cmsBase` turns a relative media url into one the events site can load. */
export const toSiteEvent = (event: RawEvent, form: RawForm, cmsBase: string): SiteEvent | null => {
  if (!event.slug || !event.title || !form.slug) return null;
  return {
    slug: event.slug,
    title: event.title,
    description: event.description ?? null,
    dateLabel: event.dateLabel ?? null,
    venue: event.venue ?? null,
    registrationOpen: event.registrationOpen !== false,
    partners: (event.partners ?? []).flatMap((partner) => {
      if (!partner.name || !partner.url) return [];
      const logo = typeof partner.logo === 'object' && partner.logo ? partner.logo.url : null;
      const logoUrl = logo ? (/^https?:\/\//u.test(logo) ? logo : `${cmsBase}${logo}`) : null;
      return [{ name: partner.name, url: partner.url, logoUrl }];
    }),
    form: {
      slug: form.slug,
      submitLabel: form.submitLabel?.trim() || 'Register',
      fields: toSiteFormFields(form.fields),
    },
  };
};
