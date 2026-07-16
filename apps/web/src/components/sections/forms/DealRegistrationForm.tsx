"use client";

import { useRef, useState } from "react";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { LeadConsent } from "@/components/forms/LeadConsent";
import { StatusBanner, useFormStatus } from "@/components/forms/StatusBanner";
import { trackEvent } from "@/lib/analytics/track";
import { submitDealRegistration } from "@/lib/leads/submitDealRegistration";
import {
  FormCard,
  FormSectionTitle,
  SubmitButton,
  TextArea,
  TextInput,
} from "./FormCard";

const STORAGE_CONSENT_TEXT =
  "I agree to allow CleanStart to store and process my personal data.";

const str = (fd: FormData, name: string): string => {
  const v = fd.get(name);
  return typeof v === "string" ? v.trim() : "";
};

export function DealRegistrationForm(): React.ReactElement {
  const [submitting, setSubmitting] = useState(false);
  const { status, setStatus, statusRef } = useFormStatus();
  const inFlightRef = useRef(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setStatus(null);
    setSubmitting(true);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const categories = [
      "storage",
      ...(fd.get("consent_marketing") != null ? ["marketing"] : []),
    ];
    const turnstileToken = fd.get("cf-turnstile-response");

    const partnerRepPhone = str(fd, "partnerRepPhone");
    const prospectPhone = str(fd, "prospectPhone");
    const dealDetails = str(fd, "dealDetails");

    const result = await submitDealRegistration({
      partnerName: str(fd, "partnerName"),
      partnerRep: {
        firstName: str(fd, "partnerRepFirstName"),
        lastName: str(fd, "partnerRepLastName"),
        email: str(fd, "partnerRepEmail"),
        ...(partnerRepPhone ? { phone: partnerRepPhone } : {}),
      },
      prospect: {
        firstName: str(fd, "prospectFirstName"),
        lastName: str(fd, "prospectLastName"),
        email: str(fd, "prospectEmail"),
        ...(prospectPhone ? { phone: prospectPhone } : {}),
      },
      ...(dealDetails ? { dealDetails } : {}),
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
      form.reset();
      setStatus({
        tone: "success",
        title: "Deal registration received",
        message:
          "Thanks, your deal registration has been received. We'll be in touch within one business day.",
      });
      window.setTimeout(() => setStatus(null), 6000);
    } else {
      setStatus({
        tone: "error",
        title: "Couldn't submit registration",
        message: "We couldn't submit your registration. Please try again.",
      });
    }
  };

  return (
    <FormCard>
      {status ? <StatusBanner ref={statusRef} {...status} /> : null}
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <FormSectionTitle>Partner Details</FormSectionTitle>
          <TextInput name="partnerName" placeholder="Partner Name" label="Partner Name" required />
        </div>

        <div className="flex flex-col gap-3">
          <FormSectionTitle>Partner Rep Details</FormSectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextInput name="partnerRepFirstName" placeholder="First Name" label="First Name" required />
            <TextInput name="partnerRepLastName" placeholder="Last Name" label="Last Name" required />
            <TextInput name="partnerRepPhone" type="tel" placeholder="+1 (555) 000-0000" label="Phone" />
            <TextInput name="partnerRepEmail" type="email" placeholder="jane@company.com" label="Email" required />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <FormSectionTitle>Prospect Details</FormSectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextInput name="prospectFirstName" placeholder="First Name" label="First Name" required />
            <TextInput name="prospectLastName" placeholder="Last Name" label="Last Name" required />
            <TextInput name="prospectPhone" type="tel" placeholder="+1 (555) 000-0000" label="Phone" />
            <TextInput name="prospectEmail" type="email" placeholder="jane@company.com" label="Email" required />
          </div>
          <TextArea name="dealDetails" placeholder="Deal Details" label="Deal Details" />
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
