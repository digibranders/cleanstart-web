"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { TurnstileWidget } from "@/components/TurnstileWidget";

/**
 * Book a Demo form. Mirrors Figma node 867:962 — an 840px-wide outer card
 * carrying the page gradient with a 24px inset white inner card (rounded
 * 14px, 1px white-7% border). Field order and styling track the Figma
 * spec exactly; font sizes follow the vulnerability-remediation page
 * convention (inline clamp).
 */
function newSubmissionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function BookDemoForm(): React.ReactElement {
  const [submitted, setSubmitted] = useState(false);
  const inFlightRef = useRef(false);
  const submissionIdRef = useRef<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    submissionIdRef.current = newSubmissionId();
    // submissionIdRef.current would travel to LeadHandler as Idempotency-Key.
    e.currentTarget.reset();
    setSubmitted(true);
    window.setTimeout(() => {
      setSubmitted(false);
      inFlightRef.current = false;
    }, 5000);
  };

  return (
    <div className="mx-auto w-full" style={{ maxWidth: "760px" }}>
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
          <SuccessBanner
            show={submitted}
            message="Thanks — your demo request has been received. Our team will reach out within 24 hours."
          />
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
              <SubmitButton submitted={submitted} />
            </form>
        </div>
      </div>
    </div>
  );
}

interface SuccessBannerProps {
  show: boolean;
  message: string;
}

function SuccessBanner({ show, message }: SuccessBannerProps): React.ReactElement {
  return (
    <output
      aria-live="polite"
      className="block overflow-hidden transition-all duration-300 ease-out"
      style={{
        maxHeight: show ? "120px" : "0px",
        opacity: show ? 1 : 0,
        marginBottom: show ? "20px" : "0px",
      }}
    >
      <div
        className="flex items-start gap-3 rounded-[10px] px-4 py-3"
        style={{
          background: "#ECFDF3",
          border: "1px solid #ABEFC6",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          aria-hidden
          className="shrink-0"
          style={{ marginTop: "2px" }}
        >
          <circle cx="10" cy="10" r="9" fill="#12B76A" />
          <path
            d="M6 10.5l2.5 2.5L14 7.5"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          style={{
            fontFamily: "var(--font-sans), 'Sora', sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            lineHeight: 1.45,
            color: "#054F31",
          }}
        >
          {message}
        </span>
      </div>
    </output>
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
          fontSize: "14px",
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
          fontSize: "16px",
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
        fontSize: "13px",
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
          fontSize: "13px",
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

/**
 * Submit button — Figma frame 2147238317 (867:964), fill #3960F9 with a
 * 1px ring + soft inner highlight, 744px wide × 44px tall, rounded 8px,
 * Manrope Medium 18px white label. A blurred 30px white-60% ellipse
 * (867:970) glows just right of the label.
 */
function SubmitButton({ submitted }: { submitted: boolean }): React.ReactElement {
  return (
    <button
      type="submit"
      disabled={submitted}
      className="relative w-full overflow-hidden rounded-[8px] text-white cursor-pointer transition-colors hover:bg-[#2438C2] disabled:cursor-not-allowed disabled:opacity-90"
      style={{
        background: submitted ? "#12B76A" : "#3960F9",
        height: "44px",
        boxShadow: submitted
          ? "0 0 0 1px rgba(18, 183, 106, 1), 0 1px 2px -1px rgba(9, 6, 63, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.16)"
          : "0 0 0 1px rgba(57, 96, 249, 1), 0 1px 2px -1px rgba(9, 6, 63, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.16)",
      }}
    >
      <span
        className="relative z-10 inline-flex items-center justify-center gap-2"
        style={{
          fontFamily: "var(--font-display), 'Manrope', sans-serif",
          fontWeight: 500,
          fontSize: "clamp(15px, 1.4vw, 18px)",
          lineHeight: "24.06px",
          letterSpacing: "-0.01em",
        }}
      >
        {submitted ? "Submitted" : "Submit application"}
        {submitted && (
          <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden>
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
