"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { StatusBanner, useFormStatus } from "@/components/forms/StatusBanner";
import { submitLead } from "@/lib/leads/submitLead";
import { SubmitButton } from "./FormCard";

/** Web input name → HubSpot internal property name (the `forms` field names). */
const NAME_MAP: Record<string, string> = {
  firstName: "firstname",
  lastName: "lastname",
  email: "email",
  company: "company",
  country: "country",
  phone: "phone",
  referralSource: "how_did_you_hear_about_cleanstart_",
};

const STORAGE_CONSENT_TEXT =
  "I agree to allow CleanStart to store and process my personal data.";

export function BookDemoForm(): React.ReactElement {
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
    const fields: Record<string, string> = {};
    for (const [inputName, hsName] of Object.entries(NAME_MAP)) {
      const value = fd.get(inputName);
      if (typeof value === "string" && value.trim()) fields[hsName] = value.trim();
    }

    const categories = ["storage", ...(fd.get("consent_marketing") != null ? ["marketing"] : [])];
    const turnstileToken = fd.get("cf-turnstile-response");

    const result = await submitLead({
      formSlug: "book-a-demo",
      fields,
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
      form.reset();
      setStatus({
        tone: "success",
        title: "Demo request received",
        message:
          "Thanks, your demo request has been received. Our team will reach out within 24 hours.",
      });
      window.setTimeout(() => setStatus(null), 5000);
    } else {
      setStatus({
        tone: "error",
        title: "Couldn't submit request",
        message: "We couldn't submit your request. Please try again.",
      });
    }
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
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                <FigmaTextInput name="firstName" label="First Name" required />
                <FigmaTextInput name="lastName" label="Last Name" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                <FigmaTextInput name="email" type="email" label="Email" required />
                <FigmaTextInput name="company" label="Company Name" required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                <FigmaTextInput name="country" label="Country/Region" />
                <FigmaTextInput name="phone" type="tel" label="Phone Number" required />
              </div>

              <FigmaTextInput
                name="referralSource"
                label="How did you hear about CleanStart?"
              />

              <ConsentText>
                CleanStart is committed to protecting and respecting your privacy, and we&rsquo;ll
                only use your personal information to administer your account and to provide the
                products and services you requested from us. From time to time, we would like to
                contact you about our products and services, as well as other content that may be
                of interest to you. If you consent to us contacting you for this purpose, please
                tick below to say how you would like us to contact you:
              </ConsentText>
              <FigmaCheckbox
                name="consent_marketing"
                label="I agree to receive other communications from CleanStart."
              />

              <ConsentText>
                In order to provide you the content requested, we need to store and process your
                personal data. If you consent to us storing your personal data for this purpose,
                please tick the checkbox below.
              </ConsentText>
              <FigmaCheckbox
                name="consent_storage"
                label="I agree to allow CleanStart to store and process my personal data."
                required
              />

              <ConsentText>
                You can unsubscribe from these communications at any time. For more information on
                how to unsubscribe, our privacy practices, and how we are committed to protecting
                and respecting your privacy, please review our{" "}
                <Link href="/privacy-policy" className="underline" style={{ color: "#2F49E5" }}>
                  Privacy Policy
                </Link>
                .
              </ConsentText>

              <TurnstileWidget />
              <SubmitButton busy={submitting} busyLabel="Submitting…">
                Submit Application
              </SubmitButton>
            </form>
        </div>
      </div>
    </div>
  );
}

interface InputProps {
  name: string;
  type?: "text" | "email" | "tel";
  label: string;
  placeholder?: string;
  required?: boolean;
}

function FigmaTextInput({
  name,
  type = "text",
  label,
  placeholder,
  required,
}: InputProps): React.ReactElement {
  return (
    <label htmlFor={name} className="block">
      <span
        className="mb-2 block text-[#111111]"
        style={{
          fontFamily: "var(--font-display, 'Manrope'), sans-serif",
          fontSize: "var(--fs-body-sm)",
          fontWeight: 400,
          lineHeight: 1.2,
        }}
      >
        {label}
        {required && <span className="ml-0.5 text-[#D14343]">*</span>}
      </span>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder ?? label}
        className="block w-full rounded-[8px] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#3960F9]"
        style={{
          background: "#FBFBFB",
          border: "1.5px solid #DDDDDD",
          padding: "10px 14px",
          fontFamily: "var(--font-display), 'Manrope', sans-serif",
          fontWeight: 500,
          fontSize: "var(--fs-input)",
          lineHeight: 1.125,
          color: "#111111",
          height: "40px",
        }}
      />
    </label>
  );
}

function ConsentText({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <p
      style={{
        fontFamily: "var(--font-sans), 'Sora', sans-serif",
        fontWeight: 400,
        fontSize: "var(--fs-caption)",
        lineHeight: 1.5,
        letterSpacing: "-0.02em",
        color: "#111111",
        opacity: 0.75,
        textAlign: "justify",
      }}
    >
      {children}
    </p>
  );
}

interface CheckboxProps {
  name: string;
  label: string;
  required?: boolean;
}

function FigmaCheckbox({ name, label, required }: CheckboxProps): React.ReactElement {
  return (
    <label className="flex items-center cursor-pointer" style={{ gap: "8px" }}>
      <span className="relative inline-flex shrink-0" style={{ width: "18px", height: "18px" }}>
        <input
          type="checkbox"
          name={name}
          required={required}
          aria-required={required || undefined}
          className="peer w-full h-full appearance-none cursor-pointer rounded-[4px] bg-[#FBFBFB] border-[1.5px] border-[#DDDDDD] checked:bg-[#3960F9] checked:border-[#3960F9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3960F9]"
        />
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="pointer-events-none absolute inset-0 m-auto hidden peer-checked:block"
          width="12"
          height="12"
        >
          <path
            d="M3 8.5l3 3 7-7"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span
        style={{
          fontFamily: "var(--font-sans), 'Sora', sans-serif",
          fontWeight: 400,
          fontSize: "var(--fs-caption)",
          lineHeight: 1.4,
          letterSpacing: "-0.02em",
          color: "#111111",
          opacity: 0.85,
        }}
      >
        {label}
        {required && <span className="ml-0.5 text-[#D14343]">*</span>}
      </span>
    </label>
  );
}
