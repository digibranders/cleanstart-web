"use client";

import { Container } from "@/components/layout";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { LeadConsent } from "@/components/forms/LeadConsent";
import { PhoneField } from "@/components/forms/PhoneField";
import { StatusBanner, useFormStatus } from "@/components/forms/StatusBanner";
import { TextField } from "@/components/forms/TextField";
import { useConversionRedirect } from "@/lib/thank-you/useConversionRedirect";
import { submitLead } from "@/lib/leads/submitLead";
import { useAttribution } from "@/components/attribution/AttributionProvider";
import { trackEvent } from "@/lib/analytics/track";
import { useDetectedCountry } from "@/lib/forms/useDetectedCountry";
import {
  emptyPhoneValue,
  toE164,
  validatePhone,
  type PhoneValue,
} from "@/lib/forms/phone-value";
import { emailError, issuesToErrors, optionalText, requiredText } from "@/lib/forms/validate";
import { useEffect, useRef, useState } from "react";

interface FieldState {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  brief: string;
}

const initialState: FieldState = {
  firstName: "",
  lastName: "",
  email: "",
  company: "",
  brief: "",
};

/** Controlled field key → HubSpot internal property name. */
const FIELD_TO_HUBSPOT: Record<keyof FieldState, string> = {
  firstName: "firstname",
  lastName: "lastname",
  email: "email",
  company: "company",
  brief: "enter_message",
};

/** Reverse lookup, so a server-side field issue lands on the input that caused it. */
const FIELD_BY_HUBSPOT_NAME: Readonly<Record<string, string>> = {
  firstname: "firstName",
  lastname: "lastName",
  email: "email",
  company: "company",
  phone: "phone",
  enter_message: "brief",
};

type FieldErrors = Partial<Record<keyof FieldState | "phone", string>>;

const STORAGE_CONSENT_TEXT =
  "I agree to allow CleanStart to store and process my personal data.";

export function ContactForm() {
  const [values, setValues] = useState<FieldState>(initialState);
  const [phone, setPhone] = useState<PhoneValue>(() => emptyPhoneValue());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { status, setStatus, statusRef } = useFormStatus();
  const inFlightRef = useRef(false);
  const redirectToThankYou = useConversionRedirect();
  const { getAttribution } = useAttribution();
  const { country: detectedCountry, detected } = useDetectedCountry();
  const touchedCountryRef = useRef(false);

  // Adopt the detected country until the visitor picks one themselves.
  useEffect(() => {
    if (!detected || touchedCountryRef.current) return;
    setPhone((prev) => ({ ...prev, country: detectedCountry }));
  }, [detected, detectedCountry]);

  const onChange = (key: keyof FieldState) => (next: string) => {
    setValues((prev) => ({ ...prev, [key]: next }));
    if (errors[key]) setError(key, null);
  };

  const setError = (key: keyof FieldErrors, message: string | null): void =>
    setErrors((prev) => {
      if (message) return { ...prev, [key]: message };
      const { [key]: _removed, ...rest } = prev;
      return rest;
    });

  const validateAll = (): FieldErrors => {
    const next: FieldErrors = {};
    const first = requiredText(values.firstName, "First name", { min: 2, max: 50 });
    if (first) next.firstName = first;
    const last = optionalText(values.lastName, "Last name", { max: 50 });
    if (last) next.lastName = last;
    const mail = emailError(values.email);
    if (mail) next.email = mail;
    const company = optionalText(values.company, "Company", { max: 100 });
    if (company) next.company = company;
    const tel = validatePhone(phone, { required: false });
    if (tel) next.phone = tel;
    const brief = requiredText(values.brief, "Message", { min: 10, max: 1000 });
    if (brief) next.brief = brief;
    return next;
  };

  const focusFirst = (found: FieldErrors): void => {
    const firstKey = Object.keys(found)[0];
    if (firstKey) document.getElementById(`contact-${firstKey}`)?.focus();
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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

    const fd = new FormData(e.currentTarget);
    const fields: Record<string, string> = {};
    for (const [key, hsName] of Object.entries(FIELD_TO_HUBSPOT)) {
      const value = values[key as keyof FieldState].trim();
      if (value) fields[hsName] = value;
    }
    const e164 = toE164(phone);
    if (e164) fields.phone = e164;
    const categories = ["storage", ...(fd.get("consent_marketing") != null ? ["marketing"] : [])];
    const turnstileToken = fd.get("cf-turnstile-response");

    const result = await submitLead({
      formSlug: "contact",
      fields,
      consent: {
        snapshot: STORAGE_CONSENT_TEXT,
        givenAt: new Date().toISOString(),
        categories,
      },
      ...(typeof turnstileToken === "string" ? { turnstileToken } : {}),
      ...(typeof window !== "undefined" ? { source: window.location.href } : {}),
      attribution: getAttribution(),
    });

    if (result.ok) {
      trackEvent("generate_lead", { form_name: "contact" });
      setSubmitted(true);
      setValues(initialState);
      setPhone((prev) => ({ country: prev.country, national: "" }));
      setErrors({});
      redirectToThankYou("contact");
      return;
    }

    // Left busy and in-flight on success: the component is about to unmount
    // into the thank-you page, and clearing them would show a ready-looking
    // form for the length of the navigation and allow a second submit.

    setSubmitting(false);
    inFlightRef.current = false;

    // The API checks the full free-mail corpus, so a domain the browser's
    // shorter list missed comes back as a field issue rather than a banner.
    const fieldErrors = issuesToErrors(result.issues, FIELD_BY_HUBSPOT_NAME);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      focusFirst(fieldErrors);
      return;
    }

    setStatus({
      tone: "error",
      title: "Couldn't send message",
      message: "We couldn't send your message. Please try again.",
    });
  };

  return (
    <section className="relative -mt-[140px]">
      <Container>
        <div className="mx-auto w-full max-w-[860px]">
          <div
            className="overflow-hidden rounded-[16px] p-[3px]"
            style={{
              backgroundColor: "#2CC1EB",
              boxShadow:
                "0 0 0 1px rgba(45,212,255,0.35), 0 24px 60px -30px rgba(60,30,150,0.25)",
            }}
          >
            <div className="overflow-hidden rounded-[13px] bg-white px-3 py-[18px] sm:px-3">
              <form
                onSubmit={onSubmit}
                className="px-3 pt-6 pb-3 sm:px-[24px] sm:pt-[30px] sm:pb-[18px]"
                noValidate
              >
                {status ? <StatusBanner ref={statusRef} {...status} /> : null}
                <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
                  <TextField
                    id="contact-firstName"
                    label="First Name"
                    required
                    autoComplete="given-name"
                    maxLength={50}
                    value={values.firstName}
                    onChange={onChange("firstName")}
                    onBlur={() =>
                      setError(
                        "firstName",
                        requiredText(values.firstName, "First name", { min: 2, max: 50 }),
                      )
                    }
                    error={errors.firstName}
                  />
                  <TextField
                    id="contact-lastName"
                    label="Last Name"
                    autoComplete="family-name"
                    maxLength={50}
                    value={values.lastName}
                    onChange={onChange("lastName")}
                    onBlur={() =>
                      setError("lastName", optionalText(values.lastName, "Last name", { max: 50 }))
                    }
                    error={errors.lastName}
                  />
                  <TextField
                    id="contact-email"
                    label="Work Email"
                    type="email"
                    required
                    autoComplete="email"
                    maxLength={254}
                    value={values.email}
                    onChange={onChange("email")}
                    onBlur={() =>
                      setError("email", values.email.trim() ? emailError(values.email) : null)
                    }
                    error={errors.email}
                  />
                  <TextField
                    id="contact-company"
                    label="Company"
                    autoComplete="organization"
                    maxLength={100}
                    value={values.company}
                    onChange={onChange("company")}
                    onBlur={() =>
                      setError("company", optionalText(values.company, "Company", { max: 100 }))
                    }
                    error={errors.company}
                  />
                  <PhoneField
                    id="contact-phone"
                    label="Phone Number"
                    className="sm:col-span-2"
                    value={phone}
                    onChange={(next) => {
                      if (next.country.code !== phone.country.code) {
                        touchedCountryRef.current = true;
                      }
                      setPhone(next);
                      if (errors.phone) setError("phone", null);
                    }}
                    onBlur={() =>
                      setError(
                        "phone",
                        phone.national ? validatePhone(phone, { required: false }) : null,
                      )
                    }
                    error={errors.phone}
                  />
                  <TextField
                    id="contact-brief"
                    label="How can we help?"
                    placeholder="We are evaluating hardened base images for a regulated workload and want to compare options."
                    className="sm:col-span-2"
                    required
                    multiline
                    maxLength={1000}
                    value={values.brief}
                    onChange={onChange("brief")}
                    onBlur={() =>
                      setError(
                        "brief",
                        requiredText(values.brief, "Message", { min: 10, max: 1000 }),
                      )
                    }
                    error={errors.brief}
                  />
                </div>

                <div className="mt-6">
                  <LeadConsent />
                </div>

                <div className="mt-7 flex justify-start">
                  <TurnstileWidget />
                </div>

                <button
                  type="submit"
                  disabled={submitting || submitted}
                  className="relative mt-4 flex h-12 w-full cursor-pointer items-center justify-center overflow-hidden rounded-[8px] text-white transition-colors duration-150 hover:bg-[#2438C2] disabled:cursor-not-allowed disabled:opacity-90"
                  style={{
                    backgroundColor: submitted ? "#12B76A" : "#3960F9",
                    boxShadow: submitted
                      ? "0 1px 2px -1px rgba(9,6,63,0.4), 0 0 0 1px #12B76A, inset 0 1px 0 rgba(255,255,255,0.16)"
                      : "0 1px 2px -1px rgba(9,6,63,0.4), 0 0 0 1px #3960F9, inset 0 1px 0 rgba(255,255,255,0.16)",
                  }}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute"
                    style={{
                      left: "50%",
                      bottom: "-22px",
                      width: "60px",
                      height: "60px",
                      transform: "translateX(-50%)",
                      borderRadius: "50%",
                      background:
                        "radial-gradient(closest-side, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 100%)",
                      filter: "blur(6px)",
                    }}
                  />

                  <span className="relative flex items-center gap-3">
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "var(--fs-h5)",
                        fontWeight: 500,
                        lineHeight: 1.33,
                        letterSpacing: "-0.18px",
                      }}
                    >
                      {submitting ? "Sending…" : submitted ? "Sent" : "Submit"}
                    </span>
                    {!submitting && !submitted && (
                      <svg
                        width="25"
                        height="22"
                        viewBox="0 0 25 22"
                        fill="none"
                        aria-hidden
                      >
                        <path
                          d="M3.71094 11.0508H20.4184"
                          stroke="white"
                          strokeWidth="1.50367"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M15.1954 15.6442L20.4164 11.0496L15.1953 6.45508"
                          stroke="white"
                          strokeWidth="1.50367"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                    {submitted && (
                      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
                        <path
                          d="M5 10.5l3 3 7-7"
                          fill="none"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                </button>

              </form>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
