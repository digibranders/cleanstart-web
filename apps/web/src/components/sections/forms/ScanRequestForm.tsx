'use client';

import { useEffect, useRef, useState } from 'react';

import { PhoneField } from '@/components/forms/PhoneField';
import { TextField } from '@/components/forms/TextField';
import { LeadConsent } from '@/components/forms/LeadConsent';
import { StatusBanner, useFormStatus } from '@/components/forms/StatusBanner';
import { TurnstileWidget } from '@/components/TurnstileWidget';
import { useAttribution } from '@/components/attribution/AttributionProvider';
import { useConversionRedirect } from '@/lib/thank-you/useConversionRedirect';
import { trackEvent } from '@/lib/analytics/track';
import { useDetectedCountry } from '@/lib/forms/useDetectedCountry';
import { emptyPhoneValue, toE164, validatePhone, type PhoneValue } from '@/lib/forms/phone-value';
import { emailError, issuesToErrors, requiredText } from '@/lib/forms/validate';
import { submitLead } from '@/lib/leads/submitLead';

import { FormCard, FormSectionTitle, SubmitButton } from './FormCard';

const FORM_SLUG = 'cleansight-demo-request';

/** Form field key → CMS field name (the HubSpot internal property name). */
const FIELD_NAMES = {
  firstName: 'firstname',
  lastName: 'lastname',
  email: 'email',
  company: 'company',
  jobTitle: 'jobtitle',
  phone: 'phone',
  country: 'country',
} as const;

/** Reverse lookup, so a server-side field issue lands on the input that caused it. */
const FIELD_BY_API_NAME: Readonly<Record<string, string>> = {
  firstname: 'firstName',
  lastname: 'lastName',
  email: 'email',
  company: 'company',
  jobtitle: 'jobTitle',
  phone: 'phone',
};

const STORAGE_CONSENT_TEXT = 'I agree to allow CleanStart to store and process my personal data.';

type Values = Record<'firstName' | 'lastName' | 'email' | 'company' | 'jobTitle', string>;
type Errors = Partial<Record<keyof Values | 'phone', string>>;

const EMPTY_VALUES: Values = { firstName: '', lastName: '', email: '', company: '', jobTitle: '' };

const validateField = (key: keyof Values, value: string): string | null => {
  switch (key) {
    case 'firstName':
      return requiredText(value, 'First name', { min: 2, max: 50 });
    case 'lastName':
      return requiredText(value, 'Last name', { min: 2, max: 50 });
    case 'email':
      return emailError(value);
    case 'company':
      return requiredText(value, 'Company', { max: 100 });
    case 'jobTitle':
      return requiredText(value, 'Job title', { max: 100 });
  }
};

export function ScanRequestForm(): React.ReactElement {
  const [values, setValues] = useState<Values>(EMPTY_VALUES);
  const [phone, setPhone] = useState<PhoneValue>(() => emptyPhoneValue());
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const { status, setStatus, statusRef } = useFormStatus();
  const inFlightRef = useRef(false);
  const redirectToThankYou = useConversionRedirect();
  const { getAttribution } = useAttribution();
  const { country: detectedCountry, detected } = useDetectedCountry();
  const touchedCountryRef = useRef(false);

  // Adopt the detected country until the visitor picks one themselves, after
  // which detection must never overwrite their choice.
  useEffect(() => {
    if (!detected || touchedCountryRef.current) return;
    setPhone((prev) => ({ ...prev, country: detectedCountry }));
  }, [detected, detectedCountry]);

  const setError = (field: keyof Errors, message: string | null): void =>
    setErrors((prev) => {
      if (message) return { ...prev, [field]: message };
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });

  const setValue = (key: keyof Values) => (next: string) => {
    setValues((prev) => ({ ...prev, [key]: next }));
    if (errors[key]) setError(key, null);
  };

  const onBlurField = (key: keyof Values) => () =>
    setError(key, values[key].trim() ? validateField(key, values[key]) : null);

  const validateAll = (): Errors => {
    const next: Errors = {};
    for (const key of Object.keys(values) as (keyof Values)[]) {
      const message = validateField(key, values[key]);
      if (message) next[key] = message;
    }
    const tel = validatePhone(phone, { required: false });
    if (tel) next.phone = tel;
    return next;
  };

  const focusFirst = (found: Errors): void => {
    const firstKey = Object.keys(found)[0];
    if (firstKey) document.getElementById(`scan-${firstKey}`)?.focus();
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (inFlightRef.current) return;
    setStatus(null);

    const found = validateAll();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusFirst(found);
      return;
    }

    inFlightRef.current = true;
    setSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const turnstileToken = formData.get('cf-turnstile-response');
    const consentMarketing = formData.get('consent_marketing') != null;
    const e164 = toE164(phone);

    const result = await submitLead({
      formSlug: FORM_SLUG,
      fields: {
        [FIELD_NAMES.firstName]: values.firstName.trim(),
        [FIELD_NAMES.lastName]: values.lastName.trim(),
        [FIELD_NAMES.email]: values.email.trim().toLowerCase(),
        [FIELD_NAMES.company]: values.company.trim(),
        [FIELD_NAMES.jobTitle]: values.jobTitle.trim(),
        // Phone is optional. The country is only sent with a number, because
        // it is the visitor's dial-code choice; without one it is just our
        // geo guess and would be recorded as if they had told us.
        ...(e164 ? { [FIELD_NAMES.phone]: e164, [FIELD_NAMES.country]: phone.country.name } : {}),
      },
      consent: {
        snapshot: STORAGE_CONSENT_TEXT,
        givenAt: new Date().toISOString(),
        categories: ['storage', ...(consentMarketing ? ['marketing'] : [])],
      },
      ...(typeof turnstileToken === 'string' ? { turnstileToken } : {}),
      ...(typeof window !== 'undefined' ? { source: window.location.href } : {}),
      attribution: getAttribution(),
    });

    if (result.ok) {
      // Fired only once the API has confirmed the lead, so the count reflects
      // captured leads rather than submit-button clicks.
      trackEvent('generate_lead', { form_name: FORM_SLUG });
      setValues(EMPTY_VALUES);
      setPhone((prev) => ({ country: prev.country, national: '' }));
      setErrors({});
      form.reset();
      // Left busy and in-flight: the component is about to unmount into the
      // thank-you page, and clearing them would allow a second submit.
      redirectToThankYou(FORM_SLUG);
      return;
    }

    setSubmitting(false);
    inFlightRef.current = false;

    // The API re-validates against the full free-mail corpus, so a rule the
    // browser missed comes back here. Show it on the field.
    const fieldErrors = issuesToErrors(result.issues, FIELD_BY_API_NAME);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      focusFirst(fieldErrors);
      return;
    }

    setStatus({
      tone: 'error',
      title: "Couldn't submit request",
      message: "We couldn't submit your request. Please try again.",
    });
  };

  return (
    <FormCard maxWidth={520}>
      <div className="mb-5 flex flex-col gap-1.5">
        <FormSectionTitle>Get your free container security scan</FormSectionTitle>
        <p
          className="text-[#4B5563]"
          style={{ fontSize: 'var(--fs-body-sm)', lineHeight: 'var(--fs-body-sm-lh)' }}
        >
          See your risks. Get expert insights. Take action with confidence.
        </p>
      </div>

      {status ? <StatusBanner ref={statusRef} {...status} /> : null}
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
          <TextField
            id="scan-firstName"
            label="First Name"
            required
            autoComplete="given-name"
            maxLength={50}
            value={values.firstName}
            onChange={setValue('firstName')}
            onBlur={onBlurField('firstName')}
            error={errors.firstName}
          />
          <TextField
            id="scan-lastName"
            label="Last Name"
            required
            autoComplete="family-name"
            maxLength={50}
            value={values.lastName}
            onChange={setValue('lastName')}
            onBlur={onBlurField('lastName')}
            error={errors.lastName}
          />
        </div>

        <TextField
          id="scan-email"
          type="email"
          label="Email"
          required
          autoComplete="email"
          maxLength={254}
          value={values.email}
          onChange={setValue('email')}
          onBlur={onBlurField('email')}
          error={errors.email}
        />

        <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
          <TextField
            id="scan-company"
            label="Company"
            required
            autoComplete="organization"
            maxLength={100}
            value={values.company}
            onChange={setValue('company')}
            onBlur={onBlurField('company')}
            error={errors.company}
          />
          <TextField
            id="scan-jobTitle"
            label="Job Title"
            required
            autoComplete="organization-title"
            maxLength={100}
            value={values.jobTitle}
            onChange={setValue('jobTitle')}
            onBlur={onBlurField('jobTitle')}
            error={errors.jobTitle}
          />
        </div>

        <PhoneField
          id="scan-phone"
          label="Phone"
          value={phone}
          onChange={(next) => {
            if (next.country.code !== phone.country.code) touchedCountryRef.current = true;
            setPhone(next);
            if (errors.phone) setError('phone', null);
          }}
          onBlur={() =>
            setError('phone', phone.national ? validatePhone(phone, { required: false }) : null)
          }
          error={errors.phone}
        />

        <LeadConsent />

        <TurnstileWidget />
        <SubmitButton busy={submitting} busyLabel="Submitting…">
          Get my free scan
        </SubmitButton>
      </form>
    </FormCard>
  );
}
