"use client";

import { useEffect, useRef, useState } from "react";

import { PhoneField } from "@/components/forms/PhoneField";
import { TextField } from "@/components/forms/TextField";
import { LeadConsent } from "@/components/forms/LeadConsent";
import { StatusBanner, useFormStatus } from "@/components/forms/StatusBanner";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { useAttribution } from "@/components/attribution/AttributionProvider";
import { trackEvent } from "@/lib/analytics/track";
import { useDetectedCountry } from "@/lib/forms/useDetectedCountry";
import { emptyPhoneValue, toE164, validatePhone, type PhoneValue } from "@/lib/forms/phone-value";
import { emailError, issuesToErrors, optionalText, requiredText } from "@/lib/forms/validate";
import { submitLead } from "@/lib/leads/submitLead";

import { SubmitButton } from "./FormCard";

/** Form field key → HubSpot internal property name (the `forms` field names). */
const HUBSPOT_NAMES = {
  firstName: "firstname",
  lastName: "lastname",
  email: "email",
  phone: "phone",
  message: "enter_message",
  country: "country",
} as const;

/** Reverse lookup, so a server-side field issue lands on the input that caused it. */
const FIELD_BY_HUBSPOT_NAME: Readonly<Record<string, string>> = {
  firstname: "firstName",
  lastname: "lastName",
  email: "email",
  phone: "phone",
  enter_message: "message",
};

const STORAGE_CONSENT_TEXT =
  "I agree to allow CleanStart to store and process my personal data.";

type Errors = Partial<Record<"firstName" | "lastName" | "email" | "phone" | "message", string>>;

export function BookDemoForm(): React.ReactElement {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState<PhoneValue>(() => emptyPhoneValue());
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const { status, setStatus, statusRef } = useFormStatus();
  const inFlightRef = useRef(false);
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

  const validateAll = (): Errors => {
    const next: Errors = {};
    const first = requiredText(firstName, "First name", { min: 2, max: 50 });
    if (first) next.firstName = first;
    const last = optionalText(lastName, "Last name", { max: 50 });
    if (last) next.lastName = last;
    const mail = emailError(email);
    if (mail) next.email = mail;
    const tel = validatePhone(phone, { required: true });
    if (tel) next.phone = tel;
    const note = optionalText(message, "Message", { max: 1000 });
    if (note) next.message = note;
    return next;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (inFlightRef.current) return;
    setStatus(null);

    const found = validateAll();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Put the caret on the first thing that needs fixing rather than making
      // the visitor hunt for the red text.
      const firstKey = Object.keys(found)[0];
      if (firstKey) document.getElementById(`demo-${firstKey}`)?.focus();
      return;
    }

    inFlightRef.current = true;
    setSubmitting(true);

    const form = event.currentTarget;
    const turnstileToken = new FormData(form).get("cf-turnstile-response");
    const consentMarketing = new FormData(form).get("consent_marketing") != null;

    const result = await submitLead({
      formSlug: "book-a-demo",
      fields: {
        [HUBSPOT_NAMES.firstName]: firstName.trim(),
        ...(lastName.trim() ? { [HUBSPOT_NAMES.lastName]: lastName.trim() } : {}),
        [HUBSPOT_NAMES.email]: email.trim().toLowerCase(),
        // E.164 is guaranteed non-null here: validateAll rejected anything else.
        [HUBSPOT_NAMES.phone]: toE164(phone) ?? "",
        // The form no longer asks for a country: the dial code the visitor
        // picked already answers it. Sent as the country name, which is what
        // HubSpot's free-text `country` property holds. Resolved here rather
        // than server-side because a dial code alone is ambiguous (+1 covers
        // the US, Canada and twenty-odd Caribbean nations) while the visitor's
        // explicit choice is not.
        [HUBSPOT_NAMES.country]: phone.country.name,
        ...(message.trim() ? { [HUBSPOT_NAMES.message]: message.trim() } : {}),
      },
      consent: {
        snapshot: STORAGE_CONSENT_TEXT,
        givenAt: new Date().toISOString(),
        categories: ["storage", ...(consentMarketing ? ["marketing"] : [])],
      },
      ...(typeof turnstileToken === "string" ? { turnstileToken } : {}),
      ...(typeof window !== "undefined" ? { source: window.location.href } : {}),
      attribution: getAttribution(),
    });

    setSubmitting(false);
    inFlightRef.current = false;

    if (result.ok) {
      // Fired only once the API has confirmed the lead, so the count reflects
      // captured leads rather than submit-button clicks.
      trackEvent("generate_lead", { form_name: "book-a-demo" });
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone((prev) => ({ country: prev.country, national: "" }));
      setMessage("");
      setErrors({});
      form.reset();
      setStatus({
        tone: "success",
        title: "Demo request received",
        message:
          "Thanks, your demo request has been received. Our team will reach out within 24 hours.",
      });
      window.setTimeout(() => setStatus(null), 5000);
      return;
    }

    // The API re-validates against the full free-mail corpus, so a domain the
    // browser's shorter list missed comes back here. Show it on the field.
    const fieldErrors = issuesToErrors(result.issues, FIELD_BY_HUBSPOT_NAME);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      const firstKey = Object.keys(fieldErrors)[0];
      if (firstKey) document.getElementById(`demo-${firstKey}`)?.focus();
      return;
    }

    setStatus({
      tone: "error",
      title: "Couldn't submit request",
      message: "We couldn't submit your request. Please try again.",
    });
  };

  return (
    <div className="mx-auto w-full" style={{ maxWidth: "760px" }}>
      <div
        className="rounded-[24px]"
        style={{
          padding: "12px",
          background:
            "linear-gradient(181deg, rgba(21, 16, 33, 1) 0%, rgba(16, 18, 62, 1) 0%, rgba(19, 30, 143, 1) 2%, rgba(71, 30, 192, 1) 32%, rgba(71, 31, 195, 1) 61%, rgba(70, 30, 191, 0.85) 75%, rgba(66, 30, 188, 0.4) 97%, rgba(66, 30, 188, 0) 100%)",
        }}
      >
        <div
          className="rounded-[14px] bg-white"
          style={{
            padding: "clamp(20px, 2.5vw, 32px)",
            border: "1px solid rgba(255, 255, 255, 0.07)",
          }}
        >
          {status ? <StatusBanner ref={statusRef} {...status} /> : null}
          <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
            <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
              <TextField
                id="demo-firstName"
                label="First Name"
                required
                autoComplete="given-name"
                maxLength={50}
                value={firstName}
                onChange={setFirstName}
                onBlur={() =>
                  setError("firstName", requiredText(firstName, "First name", { min: 2, max: 50 }))
                }
                error={errors.firstName}
              />
              <TextField
                id="demo-lastName"
                label="Last Name"
                autoComplete="family-name"
                maxLength={50}
                value={lastName}
                onChange={setLastName}
                onBlur={() => setError("lastName", optionalText(lastName, "Last name", { max: 50 }))}
                error={errors.lastName}
              />
            </div>

            <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
              <TextField
                id="demo-email"
                type="email"
                label="Work Email"
                required
                autoComplete="email"
                maxLength={254}
                value={email}
                onChange={setEmail}
                onBlur={() => setError("email", email.trim() ? emailError(email) : null)}
                error={errors.email}
              />

              <PhoneField
                id="demo-phone"
                label="Phone Number"
                required
                value={phone}
                onChange={(next) => {
                  if (next.country.code !== phone.country.code) touchedCountryRef.current = true;
                  setPhone(next);
                  if (errors.phone) setError("phone", null);
                }}
                onBlur={() =>
                  setError("phone", phone.national ? validatePhone(phone, { required: true }) : null)
                }
                error={errors.phone}
              />
            </div>

            <TextField
              id="demo-message"
              label="How can we help?"
              placeholder="We run around 300 containers on EKS and want to cut CVE remediation time before our next audit."
              multiline
              maxLength={1000}
              value={message}
              onChange={setMessage}
              onBlur={() => setError("message", optionalText(message, "Message", { max: 1000 }))}
              error={errors.message}
            />

            <LeadConsent />

            <TurnstileWidget />
            <SubmitButton busy={submitting} busyLabel="Submitting…">
              Let&apos;s Connect
            </SubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
