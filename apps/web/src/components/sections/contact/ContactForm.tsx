"use client";

import { Container } from "@/components/layout";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { useRef, useState } from "react";

interface FieldState {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone: string;
  brief: string;
}

const initialState: FieldState = {
  firstName: "",
  lastName: "",
  email: "",
  company: "",
  phone: "",
  brief: "",
};

function newSubmissionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function ContactForm() {
  const [values, setValues] = useState<FieldState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const inFlightRef = useRef(false);
  const submissionIdRef = useRef<string | null>(null);

  const onChange =
    (key: keyof FieldState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    submissionIdRef.current = newSubmissionId();
    // submissionIdRef.current would travel to LeadHandler as Idempotency-Key.
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setValues(initialState);
      window.setTimeout(() => {
        setSubmitted(false);
        inFlightRef.current = false;
      }, 5000);
    }, 600);
  };

  return (
    <section className="relative -mt-[140px] pb-16 sm:pb-20">
      <Container>
        <div className="mx-auto w-full max-w-[860px]">
          {/* Outer cyan border — solid 2px cyan ring + slight outer glow */}
          <div
            className="overflow-hidden rounded-[16px] p-[3px]"
            style={{
              backgroundColor: "#2CC1EB",
              boxShadow:
                "0 0 0 1px rgba(45,212,255,0.35), 0 24px 60px -30px rgba(60,30,150,0.25)",
            }}
          >
            <div className="overflow-hidden rounded-[13px] bg-white px-3 py-[18px] sm:px-3">
              {/* Purple header card — 19px radius. BG is the Figma painted-purple
                  texture (cyan→purple sweep on the left); decorative cube SVG
                  sits on the right with mix-blend-mode soft-light. */}
              <div
                className="relative overflow-hidden rounded-[19px] px-6 py-6 sm:px-[60px] sm:py-[26px]"
                style={{
                  backgroundColor: "#3A1FA3",
                  backgroundImage:
                    "url('/images/contact/form/header-bg.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  minHeight: "123px",
                }}
              >
                {/* Decorative cube (mix-blend soft-light, white at 34% opacity in Figma) */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute hidden sm:block"
                  style={{
                    right: "0px",
                    top: "9px",
                    width: "190px",
                    height: "176px",
                    mixBlendMode: "soft-light",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/contact/form/cube-decor.svg"
                    alt=""
                    className="block h-full w-full"
                  />
                </div>

                <div className="relative max-w-[452px]">
                  <h2
                    className="font-display font-semibold text-white"
                    style={{
                      fontSize: "var(--fs-h3)",
                      lineHeight: 1.1,
                      letterSpacing: "-0.5px",
                    }}
                  >
                    Send us a message
                  </h2>
                  <p
                    className="mt-3 text-white"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-input)",
                      fontWeight: 400,
                      lineHeight: 1.5,
                      letterSpacing: "-0.5px",
                    }}
                  >
                    Fill in the form and our team will be in touch within 24
                    hours.
                  </p>
                </div>
              </div>

              {/* Form body */}
              <form
                onSubmit={onSubmit}
                className="px-3 pt-6 pb-3 sm:px-[24px] sm:pt-[30px] sm:pb-[18px]"
              >
                <SuccessBanner
                  show={submitted}
                  message="Thanks — we've received your message and will reply within 24 hours."
                />
                <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
                  <Field
                    id="firstName"
                    label="First Name"
                    required
                    autoComplete="given-name"
                    minLength={2}
                    maxLength={50}
                    pattern="[A-Za-zÀ-ſ\s'\-]{2,50}"
                    title="Letters, spaces, hyphens, and apostrophes only"
                    value={values.firstName}
                    onChange={onChange("firstName")}
                  />
                  <Field
                    id="lastName"
                    label="Last Name"
                    autoComplete="family-name"
                    minLength={2}
                    maxLength={50}
                    pattern="[A-Za-zÀ-ſ\s'\-]{2,50}"
                    title="Letters, spaces, hyphens, and apostrophes only"
                    value={values.lastName}
                    onChange={onChange("lastName")}
                  />
                  <Field
                    id="email"
                    label="Email"
                    type="email"
                    required
                    autoComplete="email"
                    maxLength={254}
                    pattern="[^@\s]+@[^@\s]+\.[^@\s]{2,}"
                    title="Enter a valid email address"
                    value={values.email}
                    onChange={onChange("email")}
                  />
                  <Field
                    id="company"
                    label="Company"
                    autoComplete="organization"
                    maxLength={100}
                    value={values.company}
                    onChange={onChange("company")}
                  />
                  <div className="sm:col-span-2">
                    <Field
                      id="phone"
                      label="Phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      maxLength={20}
                      pattern="[0-9+()\-\s]{7,20}"
                      title="Digits, spaces, +, -, and parentheses only (7–20 chars)"
                      filterInput={(v) => v.replace(/[^0-9+()\-\s]/g, "")}
                      value={values.phone}
                      onChange={onChange("phone")}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Field
                      id="brief"
                      label="Brief Requirement"
                      required
                      multiline
                      minLength={10}
                      maxLength={1000}
                      title="Please provide at least 10 characters"
                      value={values.brief}
                      onChange={onChange("brief")}
                    />
                  </div>
                </div>

                <div className="mt-7 flex justify-start">
                  <TurnstileWidget />
                </div>

                {/* Submit — full-width, h=48, rounded 8, with soft inner top-highlight
                    and a subtle radial glow at the bottom-center (Figma Ellipse3938). */}
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
                  {/* Bottom-center radial glow */}
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

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  type?: string;
  multiline?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  title?: string;
  /** Optional input sanitizer — strips disallowed characters as the user types
   *  (e.g. tel field rejects letters). Runs before the parent's onChange. */
  filterInput?: (raw: string) => string;
}

function Field({
  id,
  label,
  required = false,
  type = "text",
  multiline = false,
  value,
  onChange,
  autoComplete,
  inputMode,
  pattern,
  minLength,
  maxLength,
  title,
  filterInput,
}: FieldProps) {
  // Aligned with the BookDemoForm Figma spec: 1.5px border #DDD, bg #FBFBFB,
  // rounded 8, height 48, Manrope Medium 16px, padding 15px 17px.
  // 16px font enforced inline (iOS Safari zoom rule).
  const sharedClass =
    "block w-full rounded-[8px] bg-[#FBFBFB] text-[#111111] placeholder:text-transparent outline-none transition-colors focus:border-[#3960F9]";
  const baseStyle: React.CSSProperties = {
    background: "#FBFBFB",
    border: "1.5px solid #DDDDDD",
    fontFamily: "var(--font-display), 'Manrope', sans-serif",
    fontWeight: 500,
    fontSize: "var(--fs-input)",
    lineHeight: multiline ? 1.5 : 1.125,
    color: "#111111",
  };
  const inputStyle: React.CSSProperties = multiline
    ? { ...baseStyle, minHeight: "88px", padding: "10px 14px" }
    : { ...baseStyle, height: "40px", padding: "10px 14px" };

  return (
    <label htmlFor={id} className="block">
      <span
        className="mb-2 block text-[#111111]"
        style={{
          fontFamily: "var(--font-display, 'Manrope'), sans-serif",
          fontSize: "var(--fs-input-label)",
          fontWeight: 400,
          lineHeight: 1.2,
        }}
      >
        {label}
        {required && <span className="ml-0.5 text-[#D14343]">*</span>}
      </span>
      {multiline ? (
        <textarea
          id={id}
          name={id}
          required={required}
          rows={4}
          value={value}
          onChange={onChange}
          minLength={minLength}
          maxLength={maxLength}
          title={title}
          className={sharedClass}
          style={inputStyle}
        />
      ) : (
        <input
          id={id}
          name={id}
          type={type}
          required={required}
          value={value}
          onChange={(e) => {
            if (filterInput) {
              const cleaned = filterInput(e.target.value);
              if (cleaned !== e.target.value) e.target.value = cleaned;
            }
            onChange(e);
          }}
          autoComplete={autoComplete}
          inputMode={inputMode}
          pattern={pattern}
          minLength={minLength}
          maxLength={maxLength}
          title={title}
          className={sharedClass}
          style={inputStyle}
        />
      )}
    </label>
  );
}

interface SuccessBannerProps {
  show: boolean;
  message: string;
}

function SuccessBanner({ show, message }: SuccessBannerProps) {
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
        style={{ background: "#ECFDF3", border: "1px solid #ABEFC6" }}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden className="shrink-0" style={{ marginTop: "2px" }}>
          <circle cx="10" cy="10" r="9" fill="#12B76A" />
          <path d="M6 10.5l2.5 2.5L14 7.5" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span
          style={{
            fontFamily: "var(--font-sans), 'Sora', sans-serif",
            fontSize: "var(--fs-input-label)",
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
