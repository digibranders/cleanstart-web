"use client";

import { useEffect, useRef, useState } from "react";

import { FieldShell } from "@/components/forms/FieldShell";
import { PhoneField } from "@/components/forms/PhoneField";
import { StatusBanner, useFormStatus } from "@/components/forms/StatusBanner";
import { TextField } from "@/components/forms/TextField";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import {
  API_FIELD,
  type CabChoice,
  EMPTY_EVENT_FORM,
  type EventFormErrors,
  type EventFormField,
  type EventFormValues,
  FIELD_BY_API_NAME,
  validateEventForm,
} from "@/lib/event-form";
import { issuesToErrors } from "@/lib/forms/validate";
import { type PhoneValue, emptyPhoneValue, toE164 } from "@/lib/forms/phone-value";
import { useDetectedCountry } from "@/lib/forms/useDetectedCountry";
import { submitLead } from "@/lib/leads/submitLead";

const TURNSTILE_ENABLED = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
const CONSENT_TEXT = "I agree to allow CleanStart to store and process my personal data.";
const PRIVACY_URL = "https://www.cleanstart.com/privacy-policy";

const CAB_OPTIONS: readonly { value: Exclude<CabChoice, "">; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

interface Props {
  formSlug: string;
  eventTitle: string;
}

export function EventRegistrationForm({ formSlug, eventTitle }: Props): React.ReactElement {
  const [values, setValues] = useState<EventFormValues>(EMPTY_EVENT_FORM);
  const [phone, setPhone] = useState<PhoneValue>(() => emptyPhoneValue());
  const [errors, setErrors] = useState<EventFormErrors>({});
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { status, setStatus, statusRef } = useFormStatus();
  const inFlightRef = useRef(false);
  const touchedCountryRef = useRef(false);
  const { country: detectedCountry, detected } = useDetectedCountry();

  // Adopt the detected country until the visitor picks one themselves.
  useEffect(() => {
    if (!detected || touchedCountryRef.current) return;
    setPhone((prev) => ({ ...prev, country: detectedCountry }));
  }, [detected, detectedCountry]);

  const clearError = (field: EventFormField): void =>
    setErrors((prev) => {
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });

  const setValue =
    (field: keyof EventFormValues) =>
    (next: string): void => {
      setValues((prev) => ({ ...prev, [field]: next }));
      clearError(field);
    };

  const focusFirst = (found: EventFormErrors): void => {
    const first = Object.keys(found)[0];
    if (first) document.getElementById(`ev-${first}`)?.focus();
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (inFlightRef.current) return;
    setStatus(null);

    const found = validateEventForm(values, phone);
    setErrors(found);
    setConsentError(consent ? undefined : "Please agree to continue.");
    if (Object.keys(found).length > 0 || !consent) {
      focusFirst(found);
      return;
    }

    inFlightRef.current = true;
    setSubmitting(true);

    const fields: Record<string, string> = {
      [API_FIELD.fullName]: values.fullName.trim(),
      [API_FIELD.designation]: values.designation.trim(),
      [API_FIELD.company]: values.company.trim(),
      [API_FIELD.cabRequired]: values.cabRequired,
    };
    const e164 = toE164(phone);
    if (e164) fields[API_FIELD.phone] = e164;
    if (values.cabRequired === "yes") {
      fields[API_FIELD.pickupLocation] = values.pickupLocation.trim();
      fields[API_FIELD.dropLocation] = values.dropLocation.trim();
    }

    const formData = new FormData(event.currentTarget);
    const token = formData.get("cf-turnstile-response");
    const honeypot = formData.get("website");

    const result = await submitLead({
      formSlug,
      fields,
      consent: {
        snapshot: CONSENT_TEXT,
        givenAt: new Date().toISOString(),
        categories: ["storage"],
      },
      source: window.location.href,
      ...(typeof token === "string" ? { turnstileToken: token } : {}),
      ...(typeof honeypot === "string" ? { website: honeypot } : {}),
    });

    if (result.ok) {
      setSubmitted(true);
      return;
    }

    setSubmitting(false);
    inFlightRef.current = false;

    const fieldErrors = issuesToErrors(result.issues, FIELD_BY_API_NAME) as EventFormErrors;
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      focusFirst(fieldErrors);
      return;
    }
    setStatus({
      tone: "error",
      title: "Registration not sent",
      message: "Something went wrong on our side. Please try again in a moment.",
    });
  };

  const nameFields = (
    <>
      <TextField
        id="ev-fullName"
        label="Full Name"
        required
        size="md"
        autoComplete="name"
        value={values.fullName}
        onChange={setValue("fullName")}
        error={errors.fullName}
      />
      <TextField
        id="ev-designation"
        label="Designation"
        required
        size="md"
        autoComplete="organization-title"
        value={values.designation}
        onChange={setValue("designation")}
        error={errors.designation}
      />
      <TextField
        id="ev-company"
        label="Company Name"
        required
        size="md"
        autoComplete="organization"
        value={values.company}
        onChange={setValue("company")}
        error={errors.company}
      />
    </>
  );

  const phoneField = (
    <PhoneField
      id="ev-phone"
      label="Phone Number"
      required
      size="md"
      value={phone}
      onChange={(next) => {
        if (next.country.code !== phone.country.code) touchedCountryRef.current = true;
        setPhone(next);
        clearError("phone");
      }}
      error={errors.phone}
    />
  );

  const cabFields = (
    <>
      <FieldShell htmlFor="ev-cabRequired" label="Cab Required" required error={errors.cabRequired}>
        <div
          id="ev-cabRequired"
          role="radiogroup"
          aria-label="Cab Required"
          aria-invalid={Boolean(errors.cabRequired)}
          className="grid grid-cols-2 gap-3"
        >
          {CAB_OPTIONS.map((option) => {
            const checked = values.cabRequired === option.value;
            return (
              <label
                key={option.value}
                className="flex h-12 cursor-pointer items-center justify-center rounded-lg border-[1.5px] text-[length:var(--fs-input)] font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#3960f9]"
                style={{
                  borderColor: checked ? "#471EC0" : errors.cabRequired ? "#D14343" : "#DDDDDD",
                  background: checked ? "#F1EDFC" : "#FBFBFB",
                  color: checked ? "#2B0F80" : "#111111",
                }}
              >
                <input
                  type="radio"
                  name="cabRequired"
                  value={option.value}
                  checked={checked}
                  onChange={() => setValue("cabRequired")(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </FieldShell>

      {values.cabRequired === "yes" ? (
        <div className="ev-pop relative flex flex-col gap-5 pl-9">
          {/* Route: a start dot, a dotted line, a pin. Placed against the two input centres. */}
          <span
            aria-hidden
            className="absolute left-0 top-[44px] h-3 w-3 rounded-full border-2 border-[#471EC0] bg-white"
          />
          <span aria-hidden className="ev-route-line left-[5px]" style={{ top: 60, bottom: 44 }} />
          <span
            aria-hidden
            className="absolute bottom-[40px] left-0 h-3 w-3 rounded-[3px] bg-[#471EC0]"
          />
          <TextField
            id="ev-pickupLocation"
            label="Pick up location"
            required
            size="md"
            autoComplete="off"
            value={values.pickupLocation}
            onChange={setValue("pickupLocation")}
            error={errors.pickupLocation}
          />
          <TextField
            id="ev-dropLocation"
            label="Drop location"
            required
            size="md"
            autoComplete="off"
            value={values.dropLocation}
            onChange={setValue("dropLocation")}
            error={errors.dropLocation}
          />
        </div>
      ) : null}
    </>
  );

  const consentBlock = (
    <div>
      <label className="flex cursor-pointer items-start gap-2.5 text-[length:var(--fs-caption)] text-[#333333]">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => {
            setConsent(event.target.checked);
            if (event.target.checked) setConsentError(undefined);
          }}
          aria-invalid={Boolean(consentError)}
          aria-describedby={consentError ? "ev-consent-error" : undefined}
          className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-[#471EC0]"
        />
        <span>
          I agree to allow CleanStart to store and process my personal data. See the{" "}
          <a
            href={PRIVACY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: "#2F49E5" }}
          >
            Privacy Policy
          </a>
          .
        </span>
      </label>
      {consentError ? (
        <p
          id="ev-consent-error"
          role="alert"
          className="mt-1.5 text-[length:var(--fs-caption)] text-[#D14343]"
        >
          {consentError}
        </p>
      ) : null}
    </div>
  );

  const honeypot = (
    <input
      type="text"
      name="website"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden
      className="absolute left-[-9999px] h-0 w-0 opacity-0"
    />
  );

  const registerButton = (
    <button type="submit" className="ev-btn w-full sm:w-auto sm:self-start" disabled={submitting}>
      {submitting ? "Registering" : "Register"}
    </button>
  );

  if (submitted) {
    const first = values.fullName.trim();
    return (
      <output aria-live="polite" className="ev-pop block">
        <div className="ev-pass">
          <div className="ev-pass-main px-7 pb-7 pt-8 sm:px-10">
            <p className="text-[length:var(--fs-caption)] font-semibold uppercase tracking-[0.08em] text-[#471EC0]">
              Registered
            </p>
            <p className="mt-2 font-display text-[length:var(--fs-caption)] text-[#555555]">
              {eventTitle}
            </p>
            <p className="mt-5 font-display text-[clamp(1.5rem,1.2rem+1.2vw,2.25rem)] font-semibold leading-tight text-[#111111]">
              {first}
            </p>
            <p className="mt-1 text-[length:var(--fs-body)] text-[#333333]">
              {values.designation.trim()}, {values.company.trim()}
            </p>
          </div>
          <div className="ev-pass-stub flex flex-wrap items-center justify-between gap-3 px-7 py-5 sm:px-10">
            <span className="text-[length:var(--fs-body-sm)] font-medium text-[#111111]">
              Cab: {values.cabRequired === "yes" ? "Yes" : "No"}
            </span>
            <span className="text-[length:var(--fs-caption)] text-[#555555]">
              We will contact you on {toE164(phone)}
            </span>
          </div>
        </div>
      </output>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="ev-pass relative">
      <div className="ev-pass-main flex flex-col gap-5 px-6 pb-8 pt-8 sm:px-10">
        {status ? <StatusBanner ref={statusRef} {...status} /> : null}
        {nameFields}
        {phoneField}
        {cabFields}
      </div>
      <div className="ev-pass-stub flex flex-col gap-5 px-6 pb-8 pt-8 sm:px-10">
        {honeypot}
        {consentBlock}
        {TURNSTILE_ENABLED ? <TurnstileWidget /> : null}
        {registerButton}
      </div>
    </form>
  );
}
