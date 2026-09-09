"use client";

import { useEffect, useRef, useState } from "react";

import { LeadConsent } from "@/components/forms/LeadConsent";
import { PhoneField } from "@/components/forms/PhoneField";
import { StatusBanner, useFormStatus } from "@/components/forms/StatusBanner";
import { TextField } from "@/components/forms/TextField";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { trackEvent } from "@/lib/analytics/track";
import {
  emptyPhoneValue,
  toE164,
  validatePhone,
  type PhoneValue,
} from "@/lib/forms/phone-value";
import { useDetectedCountry } from "@/lib/forms/useDetectedCountry";
import { emailError, optionalText, requiredText } from "@/lib/forms/validate";
import { submitDealRegistration } from "@/lib/leads/submitDealRegistration";

import { FormCard, FormSectionTitle, SubmitButton } from "./FormCard";

const STORAGE_CONSENT_TEXT =
  "I agree to allow CleanStart to store and process my personal data.";

type TextKey =
  | "partnerName"
  | "partnerRepFirstName"
  | "partnerRepLastName"
  | "partnerRepEmail"
  | "prospectFirstName"
  | "prospectLastName"
  | "prospectEmail"
  | "dealDetails";

type ErrorKey = TextKey | "partnerRepPhone" | "prospectPhone";

const INITIAL: Record<TextKey, string> = {
  partnerName: "",
  partnerRepFirstName: "",
  partnerRepLastName: "",
  partnerRepEmail: "",
  prospectFirstName: "",
  prospectLastName: "",
  prospectEmail: "",
  dealDetails: "",
};

export function DealRegistrationForm(): React.ReactElement {
  const [values, setValues] = useState<Record<TextKey, string>>(INITIAL);
  const [partnerRepPhone, setPartnerRepPhone] = useState<PhoneValue>(() => emptyPhoneValue());
  const [prospectPhone, setProspectPhone] = useState<PhoneValue>(() => emptyPhoneValue());
  const [errors, setErrors] = useState<Partial<Record<ErrorKey, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const { status, setStatus, statusRef } = useFormStatus();
  const inFlightRef = useRef(false);
  const { country: detectedCountry, detected } = useDetectedCountry();
  const touchedCountryRef = useRef(false);

  // Both phone fields adopt the detected country until either is changed by
  // hand. Partner rep and prospect are usually in the same market, so seeding
  // both saves a step far more often than it guesses wrong.
  useEffect(() => {
    if (!detected || touchedCountryRef.current) return;
    setPartnerRepPhone((prev) => ({ ...prev, country: detectedCountry }));
    setProspectPhone((prev) => ({ ...prev, country: detectedCountry }));
  }, [detected, detectedCountry]);

  const setError = (key: ErrorKey, message: string | null): void =>
    setErrors((prev) => {
      if (message) return { ...prev, [key]: message };
      const { [key]: _removed, ...rest } = prev;
      return rest;
    });

  const onChange = (key: TextKey) => (next: string) => {
    setValues((prev) => ({ ...prev, [key]: next }));
    if (errors[key]) setError(key, null);
  };

  const validateAll = (): Partial<Record<ErrorKey, string>> => {
    const next: Partial<Record<ErrorKey, string>> = {};
    const required: [TextKey, string][] = [
      ["partnerName", "Partner name"],
      ["partnerRepFirstName", "First name"],
      ["partnerRepLastName", "Last name"],
      ["prospectFirstName", "First name"],
      ["prospectLastName", "Last name"],
    ];
    for (const [key, label] of required) {
      const message = requiredText(values[key], label, { min: 2, max: 200 });
      if (message) next[key] = message;
    }

    const repEmail = emailError(values.partnerRepEmail);
    if (repEmail) next.partnerRepEmail = repEmail;
    const prospectEmail = emailError(values.prospectEmail);
    if (prospectEmail) next.prospectEmail = prospectEmail;

    const repPhone = validatePhone(partnerRepPhone, { required: false });
    if (repPhone) next.partnerRepPhone = repPhone;
    const prosPhone = validatePhone(prospectPhone, { required: false });
    if (prosPhone) next.prospectPhone = prosPhone;

    const details = optionalText(values.dealDetails, "Deal details", { max: 5000 });
    if (details) next.dealDetails = details;
    return next;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (inFlightRef.current) return;
    setStatus(null);

    const found = validateAll();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const firstKey = Object.keys(found)[0];
      if (firstKey) document.getElementById(`deal-${firstKey}`)?.focus();
      return;
    }

    inFlightRef.current = true;
    setSubmitting(true);

    const form = event.currentTarget;
    const fd = new FormData(form);
    const categories = [
      "storage",
      ...(fd.get("consent_marketing") != null ? ["marketing"] : []),
    ];
    const turnstileToken = fd.get("cf-turnstile-response");
    const repE164 = toE164(partnerRepPhone);
    const prospectE164 = toE164(prospectPhone);

    const result = await submitDealRegistration({
      partnerName: values.partnerName.trim(),
      partnerRep: {
        firstName: values.partnerRepFirstName.trim(),
        lastName: values.partnerRepLastName.trim(),
        email: values.partnerRepEmail.trim().toLowerCase(),
        ...(repE164 ? { phone: repE164 } : {}),
      },
      prospect: {
        firstName: values.prospectFirstName.trim(),
        lastName: values.prospectLastName.trim(),
        email: values.prospectEmail.trim().toLowerCase(),
        ...(prospectE164 ? { phone: prospectE164 } : {}),
      },
      ...(values.dealDetails.trim() ? { dealDetails: values.dealDetails.trim() } : {}),
      consent: {
        snapshot: STORAGE_CONSENT_TEXT,
        givenAt: new Date().toISOString(),
        categories,
      },
      ...(typeof turnstileToken === "string" ? { turnstileToken } : {}),
      ...(typeof window !== "undefined" ? { source: window.location.href } : {}),
    });

    setSubmitting(false);
    inFlightRef.current = false;

    if (result.ok) {
      trackEvent("deal_registration", { marketing_opt_in: categories.includes("marketing") });
      setValues(INITIAL);
      setPartnerRepPhone((prev) => ({ country: prev.country, national: "" }));
      setProspectPhone((prev) => ({ country: prev.country, national: "" }));
      setErrors({});
      form.reset();
      setStatus({
        tone: "success",
        title: "Deal registration received",
        message:
          "Thanks, your deal registration has been received. We'll be in touch about next steps.",
      });
      window.setTimeout(() => setStatus(null), 6000);
      return;
    }

    setStatus({
      tone: "error",
      title: "Couldn't submit registration",
      message: "We couldn't submit your registration. Please try again.",
    });
  };

  const onPhoneChange =
    (
      current: PhoneValue,
      set: (next: PhoneValue) => void,
      key: "partnerRepPhone" | "prospectPhone",
    ) =>
    (next: PhoneValue): void => {
      if (next.country.code !== current.country.code) touchedCountryRef.current = true;
      set(next);
      if (errors[key]) setError(key, null);
    };

  return (
    <FormCard>
      {status ? <StatusBanner ref={statusRef} {...status} /> : null}
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <FormSectionTitle>Partner Details</FormSectionTitle>
          <TextField
            id="deal-partnerName"
            label="Partner Name"
            required
            size="md"
            maxLength={200}
            value={values.partnerName}
            onChange={onChange("partnerName")}
            onBlur={() =>
              setError(
                "partnerName",
                requiredText(values.partnerName, "Partner name", { min: 2, max: 200 }),
              )
            }
            error={errors.partnerName}
          />
        </div>

        <div className="flex flex-col gap-3">
          <FormSectionTitle>Partner Rep Details</FormSectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField
              id="deal-partnerRepFirstName"
              label="First Name"
              required
              size="md"
              maxLength={120}
              value={values.partnerRepFirstName}
              onChange={onChange("partnerRepFirstName")}
              onBlur={() =>
                setError(
                  "partnerRepFirstName",
                  requiredText(values.partnerRepFirstName, "First name", { min: 2, max: 120 }),
                )
              }
              error={errors.partnerRepFirstName}
            />
            <TextField
              id="deal-partnerRepLastName"
              label="Last Name"
              required
              size="md"
              maxLength={120}
              value={values.partnerRepLastName}
              onChange={onChange("partnerRepLastName")}
              onBlur={() =>
                setError(
                  "partnerRepLastName",
                  requiredText(values.partnerRepLastName, "Last name", { min: 2, max: 120 }),
                )
              }
              error={errors.partnerRepLastName}
            />
            <PhoneField
              id="deal-partnerRepPhone"
              label="Phone Number"
              size="md"
              value={partnerRepPhone}
              onChange={onPhoneChange(partnerRepPhone, setPartnerRepPhone, "partnerRepPhone")}
              onBlur={() =>
                setError(
                  "partnerRepPhone",
                  partnerRepPhone.national
                    ? validatePhone(partnerRepPhone, { required: false })
                    : null,
                )
              }
              error={errors.partnerRepPhone}
            />
            <TextField
              id="deal-partnerRepEmail"
              label="Work Email"
              type="email"
              required
              size="md"
              maxLength={254}
              value={values.partnerRepEmail}
              onChange={onChange("partnerRepEmail")}
              onBlur={() =>
                setError(
                  "partnerRepEmail",
                  values.partnerRepEmail.trim() ? emailError(values.partnerRepEmail) : null,
                )
              }
              error={errors.partnerRepEmail}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <FormSectionTitle>Prospect Details</FormSectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField
              id="deal-prospectFirstName"
              label="First Name"
              required
              size="md"
              maxLength={120}
              value={values.prospectFirstName}
              onChange={onChange("prospectFirstName")}
              onBlur={() =>
                setError(
                  "prospectFirstName",
                  requiredText(values.prospectFirstName, "First name", { min: 2, max: 120 }),
                )
              }
              error={errors.prospectFirstName}
            />
            <TextField
              id="deal-prospectLastName"
              label="Last Name"
              required
              size="md"
              maxLength={120}
              value={values.prospectLastName}
              onChange={onChange("prospectLastName")}
              onBlur={() =>
                setError(
                  "prospectLastName",
                  requiredText(values.prospectLastName, "Last name", { min: 2, max: 120 }),
                )
              }
              error={errors.prospectLastName}
            />
            <PhoneField
              id="deal-prospectPhone"
              label="Phone Number"
              size="md"
              value={prospectPhone}
              onChange={onPhoneChange(prospectPhone, setProspectPhone, "prospectPhone")}
              onBlur={() =>
                setError(
                  "prospectPhone",
                  prospectPhone.national
                    ? validatePhone(prospectPhone, { required: false })
                    : null,
                )
              }
              error={errors.prospectPhone}
            />
            <TextField
              id="deal-prospectEmail"
              label="Work Email"
              type="email"
              required
              size="md"
              maxLength={254}
              value={values.prospectEmail}
              onChange={onChange("prospectEmail")}
              onBlur={() =>
                setError(
                  "prospectEmail",
                  values.prospectEmail.trim() ? emailError(values.prospectEmail) : null,
                )
              }
              error={errors.prospectEmail}
            />
          </div>
          <TextField
            id="deal-dealDetails"
            label="Deal Details"
            placeholder="500-node OpenShift estate, replacing an incumbent image provider, decision expected next quarter."
            multiline
            size="md"
            maxLength={5000}
            value={values.dealDetails}
            onChange={onChange("dealDetails")}
            onBlur={() =>
              setError(
                "dealDetails",
                optionalText(values.dealDetails, "Deal details", { max: 5000 }),
              )
            }
            error={errors.dealDetails}
          />
        </div>

        <LeadConsent />

        <div className="flex justify-start">
          <TurnstileWidget />
        </div>
        <SubmitButton busy={submitting} busyLabel="Submitting…">
          Submit Application
        </SubmitButton>
      </form>
    </FormCard>
  );
}
