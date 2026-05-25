"use client";

import Link from "next/link";
import { useState } from "react";
import { TurnstileWidget } from "@/components/TurnstileWidget";

/**
 * Book a Demo form. Mirrors Figma node 867:962 — an 840px-wide outer card
 * carrying the page gradient with a 24px inset white inner card (rounded
 * 14px, 1px white-7% border). Field order and styling track the Figma
 * spec exactly; font sizes follow the vulnerability-remediation page
 * convention (inline clamp).
 */
export function BookDemoForm(): React.ReactElement {
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Lead intake adapter is not yet exposed at the web edge; this form
    // provides client-side UX only and will be wired through LeadHandler.
    setSubmitted(true);
  };

  return (
    <div className="mx-auto w-full" style={{ maxWidth: "840px" }}>
      {/* Outer gradient card — Figma fill_39F7LQ, 24px radius, 24px inset */}
      <div
        className="rounded-[24px]"
        style={{
          padding: "12px",
          background:
            "linear-gradient(181deg, rgba(21, 16, 33, 1) 0%, rgba(16, 18, 62, 1) 0%, rgba(19, 30, 143, 1) 2%, rgba(71, 30, 192, 1) 32%, rgba(71, 31, 195, 1) 61%, rgba(70, 30, 191, 0.85) 75%, rgba(66, 30, 188, 0.4) 97%, rgba(66, 30, 188, 0) 100%)",
        }}
      >
        {/* Inner white card — rounded 14, 1px rgba(255,255,255,0.07) border */}
        <div
          className="rounded-[14px] bg-white"
          style={{
            padding: "clamp(20px, 2.5vw, 32px)",
            border: "1px solid rgba(255, 255, 255, 0.07)",
          }}
        >
          {submitted ? (
            <p
              className="text-center py-8"
              style={{
                fontFamily: "var(--font-sans), 'Sora', sans-serif",
                fontSize: "16px",
                lineHeight: 1.5,
                color: "#111111",
              }}
            >
              Thanks — your demo request has been received. Our team will reach out shortly.
            </p>
          ) : (
            <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
              <h3
                className="text-center"
                style={{
                  fontFamily: "var(--font-display), 'Manrope', sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(24px, 2.8vw, 40px)",
                  lineHeight: 1,
                  letterSpacing: "-0.05em",
                  color: "#111111",
                  marginBottom: "12px",
                }}
              >
                Get a Demo
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FigmaTextInput name="firstName" placeholder="First Name" />
                <FigmaTextInput name="lastName" placeholder="Last Name" />
              </div>

              <FigmaTextInput name="email" type="email" placeholder="Email*" required />
              <FigmaTextInput name="company" placeholder="Company Name *" required />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FigmaTextInput name="country" placeholder="Country/Region" />
                <FigmaTextInput name="phone" type="tel" placeholder="Phone Number*" required />
              </div>

              <FigmaTextInput
                name="referralSource"
                placeholder="How did you hear about CleanStart?"
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
                label="I agree to allow CleanStart to store and process my personal data.*"
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
              <SubmitButton />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

interface InputProps {
  name: string;
  type?: "text" | "email" | "tel";
  placeholder: string;
  required?: boolean;
}

function FigmaTextInput({
  name,
  type = "text",
  placeholder,
  required,
}: InputProps): React.ReactElement {
  return (
    <label className="block">
      <span className="sr-only">{placeholder}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        aria-label={placeholder}
        className="w-full rounded-[8px] outline-none transition-colors focus:border-[#3960F9]"
        style={{
          background: "#FBFBFB",
          border: "1.5px solid #DDDDDD",
          padding: "15px 17px",
          fontFamily: "var(--font-display), 'Manrope', sans-serif",
          fontWeight: 500,
          fontSize: "16px",
          lineHeight: 1.125,
          color: "#111111",
          height: "48px",
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
        fontSize: "16px",
        lineHeight: 1.5,
        letterSpacing: "-0.04em",
        color: "#111111",
        opacity: 0.8,
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
    <label className="flex items-center" style={{ gap: "9px" }}>
      <input
        type="checkbox"
        name={name}
        required={required}
        aria-required={required || undefined}
        className="appearance-none cursor-pointer checked:bg-[#3960F9] checked:border-[#3960F9] relative"
        style={{
          width: "32px",
          height: "32px",
          background: "#FBFBFB",
          border: "1.5px solid #DDDDDD",
          borderRadius: "8px",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-sans), 'Sora', sans-serif",
          fontWeight: 400,
          fontSize: "16px",
          lineHeight: 1.5,
          letterSpacing: "-0.04em",
          color: "#111111",
          opacity: 0.8,
        }}
      >
        {label}
      </span>
    </label>
  );
}

/**
 * Submit button — Figma frame 2147238317 (867:964), fill #3960F9 with a
 * 1px ring + soft inner highlight, 744px wide × 44px tall, rounded 8px,
 * Manrope Medium 18px white label. A blurred 30px white-60% ellipse
 * (867:970) glows just right of the label.
 */
function SubmitButton(): React.ReactElement {
  return (
    <button
      type="submit"
      className="relative w-full overflow-hidden rounded-[8px] text-white cursor-pointer transition-colors hover:bg-[#2438C2] disabled:cursor-not-allowed"
      style={{
        background: "#3960F9",
        height: "44px",
        boxShadow:
          "0 0 0 1px rgba(57, 96, 249, 1), 0 1px 2px -1px rgba(9, 6, 63, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.16)",
      }}
    >
      <span
        className="relative z-10 inline-flex items-center justify-center"
        style={{
          fontFamily: "var(--font-display), 'Manrope', sans-serif",
          fontWeight: 500,
          fontSize: "clamp(15px, 1.4vw, 18px)",
          lineHeight: "24.06px",
          letterSpacing: "-0.01em",
        }}
      >
        Submit application
      </span>
      {/* Blurred glow ellipse — Figma 867:970 (rgba(255,255,255,0.6) blur 20px) */}
      <span
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          width: "30px",
          height: "30px",
          right: "calc(50% - 88px)",
          top: "50%",
          transform: "translateY(-50%)",
          background: "rgba(255, 255, 255, 0.6)",
          borderRadius: "9999px",
          filter: "blur(20px)",
        }}
      />
    </button>
  );
}
