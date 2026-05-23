"use client";

import { useState } from "react";
import {
  FormCard,
  FormSectionTitle,
  RecaptchaPlaceholder,
  SubmitButton,
  TextArea,
  TextInput,
} from "./FormCard";

export function DealRegistrationForm(): React.ReactElement {
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Lead intake adapter is not yet exposed at the web edge; this form
    // provides client-side UX only and will be wired through LeadHandler.
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <FormCard>
        <p
          className="text-center text-[#0F123E]"
          style={{ fontSize: "var(--text-body-md)", lineHeight: 1.5 }}
        >
          Thanks — your deal registration has been received. We&apos;ll be in touch within one
          business day.
        </p>
      </FormCard>
    );
  }

  return (
    <FormCard>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <FormSectionTitle>Partner Details</FormSectionTitle>
          <TextInput name="partnerName" placeholder="Partner Name" label="Partner Name" required />
        </div>

        <div className="flex flex-col gap-3">
          <FormSectionTitle>Partner Rep Details</FormSectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <TextInput name="partnerRepFirstName" placeholder="First Name" label="First Name" required />
            <TextInput name="partnerRepLastName" placeholder="Last Name" label="Last Name" required />
          </div>
          <TextInput name="partnerRepPhone" type="tel" placeholder="+1 (555) 000-0000" label="Phone" />
          <TextInput name="partnerRepEmail" type="email" placeholder="jane@company.com" label="Email" required />
        </div>

        <div className="flex flex-col gap-3">
          <FormSectionTitle>Prospect Details</FormSectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <TextInput name="prospectFirstName" placeholder="First Name" label="First Name" required />
            <TextInput name="prospectLastName" placeholder="Last Name" label="Last Name" required />
          </div>
          <TextInput name="prospectPhone" type="tel" placeholder="+1 (555) 000-0000" label="Phone" />
          <TextInput name="prospectEmail" type="email" placeholder="jane@company.com" label="Email" required />
          <TextArea name="dealDetails" placeholder="Deal Details" label="Deal Details" />
        </div>

        <RecaptchaPlaceholder />
        <SubmitButton>Submit application</SubmitButton>
      </form>
    </FormCard>
  );
}
