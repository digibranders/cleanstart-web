"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FormCard,
  RecaptchaPlaceholder,
  SubmitButton,
  TextInput,
} from "./FormCard";

export function BookDemoForm(): React.ReactElement {
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Lead intake adapter is not yet exposed at the web edge; this form
    // provides client-side UX only and will be wired through LeadHandler.
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <FormCard maxWidth={520}>
        <p
          className="text-center text-[#0F123E]"
          style={{ fontSize: "var(--text-body-md)", lineHeight: 1.5 }}
        >
          Thanks — your demo request has been received. Our team will reach out shortly.
        </p>
      </FormCard>
    );
  }

  return (
    <FormCard maxWidth={520}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <TextInput name="firstName" placeholder="First Name" label="First Name" required />
          <TextInput name="lastName" placeholder="Last Name" label="Last Name" required />
        </div>
        <TextInput name="email" type="email" placeholder="Email*" label="Email" required />
        <TextInput name="company" placeholder="Company Name *" label="Company Name" required />
        <div className="grid grid-cols-2 gap-3">
          <TextInput name="country" placeholder="Country/Region" label="Country/Region" />
          <TextInput
            name="phone"
            type="tel"
            placeholder="Phone Number*"
            label="Phone Number"
            required
          />
        </div>
        <TextInput
          name="referralSource"
          placeholder="How did you hear about CleanStart?"
          label="How did you hear about CleanStart?"
        />

        <p
          className="text-[#475569]"
          style={{ fontSize: "var(--text-body-xs)", lineHeight: 1.5 }}
        >
          CleanStart is committed to protecting and respecting your privacy, and we&rsquo;ll only
          use your personal information to administer your account and to provide the products and
          services you requested from us. From time to time, we would like to contact you about our
          products and services, as well as other content that may be of interest to you. If you
          consent to us contacting you for this purpose, please tick below to say how you would
          like us to contact you:
        </p>

        <ConsentCheckbox name="consent_marketing" />

        <p
          className="text-[#475569]"
          style={{ fontSize: "var(--text-body-xs)", lineHeight: 1.5 }}
        >
          In order to provide you the content requested, we need to store and process your personal
          data. If you consent to us storing your personal data for this purpose, please tick the
          checkbox below.
        </p>

        <ConsentCheckbox name="consent_storage" />

        <p
          className="text-[#475569]"
          style={{ fontSize: "var(--text-body-xs)", lineHeight: 1.5 }}
        >
          You can unsubscribe from these communications at any time. For more information on how to
          unsubscribe, our privacy practices, and how we are committed to protecting and respecting
          your privacy, please review our{" "}
          <Link href="/privacy-policy" className="text-[#2F49E5] underline">
            Privacy Policy
          </Link>
          .
        </p>

        <RecaptchaPlaceholder />
        <SubmitButton>Submit application</SubmitButton>
      </form>
    </FormCard>
  );
}

function ConsentCheckbox({ name }: { name: string }): React.ReactElement {
  return (
    <label className="flex items-start gap-3">
      <input
        type="checkbox"
        name={name}
        className="mt-[3px] h-4 w-4 rounded border-[#D9DFE8] text-[#2F49E5] focus:ring-[#2F49E5]"
      />
      <span
        className="text-[#0F123E]"
        style={{ fontSize: "var(--text-body-xs)", lineHeight: 1.5 }}
      >
        I agree to receive other communications from CleanStart.
      </span>
    </label>
  );
}
