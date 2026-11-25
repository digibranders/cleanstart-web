"use client";

import { useEffect, useRef, useState } from "react";

import { FIELD_SURFACE_CLASS, fieldSurfaceStyle } from "@/components/forms/field-surface";
import { FieldShell } from "@/components/forms/FieldShell";
import { PhoneField } from "@/components/forms/PhoneField";
import { StatusBanner, useFormStatus } from "@/components/forms/StatusBanner";
import { TextField } from "@/components/forms/TextField";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import type { FormField, SiteEvent } from "@/lib/cms";
import { type Errors, type Phones, type Values, isToggle, isVisible, validateForm } from "@/lib/form-engine";
import { issuesToErrors } from "@/lib/forms/validate";
import { emptyPhoneValue, toE164 } from "@/lib/forms/phone-value";
import { useDetectedCountry } from "@/lib/forms/useDetectedCountry";
import { submitLead } from "@/lib/leads/submitLead";

const TURNSTILE_ENABLED = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
const CONSENT_TEXT = "I agree to allow CleanStart to store and process my personal data.";
const PRIVACY_URL = "https://www.cleanstart.com/privacy-policy";
/** A select with this many options or fewer is drawn as buttons, which is quicker than a menu. */
const BUTTON_CHOICE_MAX = 3;

const initialValues = (fields: readonly FormField[]): Values =>
  Object.fromEntries(fields.map((f) => [f.name, isToggle(f) ? false : ""]));

const initialPhones = (fields: readonly FormField[]): Phones =>
  Object.fromEntries(fields.filter((f) => f.type === "tel").map((f) => [f.name, emptyPhoneValue()]));

export function EventRegistrationForm({ event }: { event: SiteEvent }): React.ReactElement {
  const { form } = event;
  const [values, setValues] = useState<Values>(() => initialValues(form.fields));
  const [phones, setPhones] = useState<Phones>(() => initialPhones(form.fields));
  const [errors, setErrors] = useState<Errors>({});
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { status, setStatus, statusRef } = useFormStatus();
  const inFlightRef = useRef(false);
  const touchedPhones = useRef(new Set<string>());
  const { country: detectedCountry, detected } = useDetectedCountry();

  // Adopt the detected country on every phone field the visitor has not touched.
  useEffect(() => {
    if (!detected) return;
    setPhones((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([name, value]) => [
          name,
          touchedPhones.current.has(name) ? value : { ...value, country: detectedCountry },
        ]),
      ),
    );
  }, [detected, detectedCountry]);

  const clearError = (name: string): void =>
    setErrors((prev) => {
      const { [name]: _removed, ...rest } = prev;
      return rest;
    });

  const setValue = (name: string, next: string | boolean): void => {
    setValues((prev) => ({ ...prev, [name]: next }));
    clearError(name);
  };

  const focusFirst = (found: Errors): void => {
    const first = Object.keys(found)[0];
    if (first) document.getElementById(`ev-${first}`)?.focus();
  };

  const onSubmit = async (submitEvent: React.FormEvent<HTMLFormElement>): Promise<void> => {
    submitEvent.preventDefault();
    if (inFlightRef.current) return;
    setStatus(null);

    const found = validateForm(form.fields, values, phones);
    setErrors(found);
    setConsentError(consent ? undefined : "Please agree to continue.");
    if (Object.keys(found).length > 0 || !consent) {
      focusFirst(found);
      return;
    }

    inFlightRef.current = true;
    setSubmitting(true);

    const fields: Record<string, string | boolean> = {};
    for (const field of form.fields) {
      if (!isVisible(field, values)) continue;
      if (field.type === "tel") {
        const e164 = toE164(phones[field.name] ?? emptyPhoneValue());
        if (e164) fields[field.name] = e164;
      } else if (isToggle(field)) {
        fields[field.name] = values[field.name] === true;
      } else {
        const text = String(values[field.name] ?? "").trim();
        if (text !== "") fields[field.name] = text;
      }
    }

    const formData = new FormData(submitEvent.currentTarget);
    const token = formData.get("cf-turnstile-response");
    const honeypot = formData.get("website");

    const result = await submitLead({
      formSlug: form.slug,
      fields,
      consent: { snapshot: CONSENT_TEXT, givenAt: new Date().toISOString(), categories: ["storage"] },
      // Ties the lead to this event; the CMS counts and lists registrations by it.
      source: `event:${event.slug}`,
      ...(typeof token === "string" ? { turnstileToken: token } : {}),
      ...(typeof honeypot === "string" ? { website: honeypot } : {}),
    });

    if (result.ok) {
      setSubmitted(true);
      return;
    }

    setSubmitting(false);
    inFlightRef.current = false;

    const fieldErrors = issuesToErrors(
      result.issues,
      Object.fromEntries(form.fields.map((f) => [f.name, f.name])),
    );
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

  const renderField = (field: FormField): React.ReactElement => {
    const id = `ev-${field.name}`;
    const error = errors[field.name];
    const hint = field.helpText ?? undefined;

    if (field.type === "tel") {
      return (
        <PhoneField
          key={field.name}
          id={id}
          label={field.label}
          required={field.required}
          size="md"
          value={phones[field.name] ?? emptyPhoneValue()}
          hint={hint}
          error={error}
          onChange={(next) => {
            const current = phones[field.name];
            if (current && next.country.code !== current.country.code) touchedPhones.current.add(field.name);
            setPhones((prev) => ({ ...prev, [field.name]: next }));
            clearError(field.name);
          }}
        />
      );
    }

    if (field.type === "select") {
      const value = String(values[field.name] ?? "");
      if (field.options.length <= BUTTON_CHOICE_MAX) {
        return (
          <FieldShell key={field.name} htmlFor={id} label={field.label} required={field.required} error={error} hint={hint}>
            <div
              id={id}
              role="radiogroup"
              aria-label={field.label}
              aria-invalid={Boolean(error)}
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${Math.max(field.options.length, 1)}, minmax(0, 1fr))` }}
            >
              {field.options.map((option) => {
                const checked = value === option.value;
                return (
                  <label
                    key={option.value}
                    className="flex h-12 cursor-pointer items-center justify-center rounded-lg border-[1.5px] text-[length:var(--fs-input)] font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#3960f9]"
                    style={{
                      borderColor: checked ? "#471EC0" : error ? "#D14343" : "#DDDDDD",
                      background: checked ? "#F1EDFC" : "#FBFBFB",
                      color: checked ? "#2B0F80" : "#111111",
                    }}
                  >
                    <input
                      type="radio"
                      name={field.name}
                      value={option.value}
                      checked={checked}
                      onChange={() => setValue(field.name, option.value)}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
          </FieldShell>
        );
      }
      return (
        <FieldShell key={field.name} htmlFor={id} label={field.label} required={field.required} error={error} hint={hint}>
          <select
            id={id}
            name={field.name}
            value={value}
            onChange={(e) => setValue(field.name, e.target.value)}
            aria-invalid={Boolean(error)}
            className={FIELD_SURFACE_CLASS}
            style={fieldSurfaceStyle({ size: "md", invalid: Boolean(error) })}
          >
            <option value="">Select</option>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FieldShell>
      );
    }

    if (isToggle(field)) {
      return (
        <div key={field.name}>
          <label className="flex cursor-pointer items-start gap-2.5 text-[length:var(--fs-caption)] text-[#333333]">
            <input
              id={id}
              type="checkbox"
              checked={values[field.name] === true}
              onChange={(e) => setValue(field.name, e.target.checked)}
              aria-invalid={Boolean(error)}
              className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-[#471EC0]"
            />
            <span>{field.label}</span>
          </label>
          {error ? (
            <p role="alert" className="mt-1.5 text-[length:var(--fs-caption)] text-[#D14343]">
              {error}
            </p>
          ) : null}
        </div>
      );
    }

    return (
      <TextField
        key={field.name}
        id={id}
        label={field.label}
        required={field.required}
        size="md"
        type={field.type === "email" ? "email" : "text"}
        multiline={field.type === "textarea"}
        placeholder={field.placeholder ?? undefined}
        hint={hint}
        maxLength={field.maxLength ?? undefined}
        autoComplete={field.type === "email" ? "email" : "off"}
        value={String(values[field.name] ?? "")}
        onChange={(next) => setValue(field.name, next)}
        error={error}
      />
    );
  };

  const visible = form.fields.filter((f) => isVisible(f, values));
  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < visible.length; i += 1) {
    const field = visible[i];
    if (!field) continue;
    const next = visible[i + 1];
    // A pick up and a drop location read as one route: a start, a line, an end.
    if (field.name === "pickup_location" && next?.name === "drop_location") {
      nodes.push(
        <div key="route" className="ev-pop relative flex flex-col gap-5 pl-9">
          <span aria-hidden className="absolute left-0 top-[44px] h-3 w-3 rounded-full border-2 border-[#471EC0] bg-white" />
          <span aria-hidden className="ev-route-line left-[5px]" style={{ top: 60, bottom: 44 }} />
          <span aria-hidden className="absolute bottom-[40px] left-0 h-3 w-3 rounded-[3px] bg-[#471EC0]" />
          {renderField(field)}
          {renderField(next)}
        </div>,
      );
      i += 1;
    } else {
      nodes.push(renderField(field));
    }
  }

  if (submitted) {
    const name =
      String(values.full_name ?? "").trim() ||
      String(Object.entries(values).find(([k, v]) => typeof v === "string" && v.trim() !== "" && form.fields.find((f) => f.name === k)?.type === "text")?.[1] ?? "");
    const answers = visible
      .filter((f) => f.type === "select" && values[f.name])
      .map((f) => `${f.label}: ${f.options.find((o) => o.value === values[f.name])?.label ?? values[f.name]}`);
    const phoneField = visible.find((f) => f.type === "tel");
    const phone = phoneField ? toE164(phones[phoneField.name] ?? emptyPhoneValue()) : null;
    const role = [values.designation, values.company].map((v) => String(v ?? "").trim()).filter(Boolean).join(", ");
    return (
      <output aria-live="polite" className="ev-pop block">
        <div className="ev-pass">
          <div className="ev-pass-main px-7 pb-7 pt-8 sm:px-10">
            <p className="text-[length:var(--fs-caption)] font-semibold uppercase tracking-[0.08em] text-[#471EC0]">Registered</p>
            <p className="mt-2 font-display text-[length:var(--fs-caption)] text-[#555555]">{event.title}</p>
            {name ? (
              <p className="mt-5 font-display text-[clamp(1.5rem,1.2rem+1.2vw,2.25rem)] font-semibold leading-tight text-[#111111]">{name}</p>
            ) : null}
            {role ? <p className="mt-1 text-[length:var(--fs-body)] text-[#333333]">{role}</p> : null}
          </div>
          <div className="ev-pass-stub flex flex-wrap items-center justify-between gap-3 px-7 py-5 sm:px-10">
            <span className="text-[length:var(--fs-body-sm)] font-medium text-[#111111]">{answers.join("  ")}</span>
            {phone ? <span className="text-[length:var(--fs-caption)] text-[#555555]">We will contact you on {phone}</span> : null}
          </div>
        </div>
      </output>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="ev-pass relative">
      <div className="ev-pass-main flex flex-col gap-5 px-6 pb-8 pt-8 sm:px-10">
        {status ? <StatusBanner ref={statusRef} {...status} /> : null}
        {nodes}
      </div>
      <div className="ev-pass-stub flex flex-col gap-5 px-6 pb-8 pt-8 sm:px-10">
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
        />
        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-[length:var(--fs-caption)] text-[#333333]">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (e.target.checked) setConsentError(undefined);
              }}
              aria-invalid={Boolean(consentError)}
              aria-describedby={consentError ? "ev-consent-error" : undefined}
              className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-[#471EC0]"
            />
            <span>
              I agree to allow CleanStart to store and process my personal data. See the{" "}
              <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "#2F49E5" }}>
                Privacy Policy
              </a>
              .
            </span>
          </label>
          {consentError ? (
            <p id="ev-consent-error" role="alert" className="mt-1.5 text-[length:var(--fs-caption)] text-[#D14343]">
              {consentError}
            </p>
          ) : null}
        </div>
        {TURNSTILE_ENABLED ? <TurnstileWidget /> : null}
        <button type="submit" className="ev-btn w-full sm:w-auto sm:self-start" disabled={submitting}>
          {submitting ? "Registering" : form.submitLabel}
        </button>
      </div>
    </form>
  );
}
