"use client";

import { Container } from "@/components/layout";
import { useState } from "react";

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

export function ContactForm() {
  const [values, setValues] = useState<FieldState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onChange = (key: keyof FieldState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    // Wired to a no-op locally; lead intake will be added when Phase E adapter
    // is exposed at the web edge. For now the form provides client-side UX only.
    window.setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setValues(initialState);
    }, 600);
  };

  return (
    <section className="relative -mt-10 pb-16 sm:-mt-16 sm:pb-20">
      <Container>
        <div className="mx-auto w-full max-w-[860px]">
          <div
            className="overflow-hidden rounded-[28px] bg-white p-1.5"
            style={{
              boxShadow:
                "0 1px 0 rgba(0,0,0,0.04), 0 24px 60px -30px rgba(60,30,150,0.20)",
              backgroundImage:
                "linear-gradient(180deg, rgba(122,89,255,0.35) 0%, rgba(255,255,255,0) 35%)",
            }}
          >
            <div className="rounded-[24px] bg-white">
              {/* Purple header */}
              <div
                className="rounded-t-[22px] px-6 py-6 sm:px-10 sm:py-7"
                style={{
                  background:
                    "linear-gradient(135deg, #5B3FE4 0%, #7A59FF 100%)",
                }}
              >
                <h2
                  className="font-display font-semibold text-white"
                  style={{
                    fontSize: "var(--text-card-title-xl)",
                    lineHeight: 1.2,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Send us a message
                </h2>
                <p
                  className="mt-2 text-white/85"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--text-body-md)",
                    lineHeight: 1.5,
                  }}
                >
                  Fill in the form and our team will be in touch within 24
                  hours.
                </p>
              </div>

              {/* Form body */}
              <form
                onSubmit={onSubmit}
                className="px-6 py-7 sm:px-10 sm:py-9"
                noValidate
              >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
                  <Field
                    id="firstName"
                    label="First Name"
                    required
                    value={values.firstName}
                    onChange={onChange("firstName")}
                  />
                  <Field
                    id="lastName"
                    label="Last Name"
                    required
                    value={values.lastName}
                    onChange={onChange("lastName")}
                  />
                  <Field
                    id="email"
                    label="Email"
                    type="email"
                    required
                    value={values.email}
                    onChange={onChange("email")}
                  />
                  <Field
                    id="company"
                    label="Company"
                    value={values.company}
                    onChange={onChange("company")}
                  />
                  <div className="sm:col-span-2">
                    <Field
                      id="phone"
                      label="Phone"
                      type="tel"
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
                      value={values.brief}
                      onChange={onChange("brief")}
                    />
                  </div>
                </div>

                {/* reCAPTCHA placeholder — visual parity with Figma until key
                    is wired through env at Phase J. */}
                <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div
                    className="inline-flex items-center gap-3 rounded-[3px] border border-[#D3D3D3] bg-[#F9F9F9] px-3 py-2"
                    aria-hidden
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-sm border border-[#BFBFBF] bg-white">
                      <span className="sr-only">I&apos;m not a robot</span>
                    </span>
                    <span
                      className="text-[#333]"
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "14px",
                      }}
                    >
                      protect by reCAPTCHA
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#3960F9] px-6 py-3.5 font-medium text-white transition-colors duration-150 hover:bg-[#2B4DDB] disabled:opacity-70"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "16px",
                  }}
                >
                  {submitting ? "Sending…" : "Submit"}
                  {!submitting && (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M5 12h14M13 5l7 7-7 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>

                {submitted && (
                  <output
                    className="mt-4 block text-center text-[#1A7F3C]"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--text-body-md)",
                    }}
                  >
                    Thanks — we&apos;ve received your message and will reply
                    within 24 hours.
                  </output>
                )}
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
}

function Field({
  id,
  label,
  required = false,
  type = "text",
  multiline = false,
  value,
  onChange,
}: FieldProps) {
  const sharedClass =
    "block w-full rounded-[8px] border border-[#D9D9D9] bg-white px-3 py-2.5 text-[#111111] placeholder:text-transparent focus:border-[#3960F9] focus:outline-none focus:ring-2 focus:ring-[#3960F9]/20";
  // 16 px enforced inline to defeat any cascade override — iOS Safari zoom rule.
  const inputStyle: React.CSSProperties = {
    fontFamily: "var(--font-sans)",
    fontSize: "16px",
    lineHeight: 1.5,
  };

  return (
    <label htmlFor={id} className="block">
      <span
        className="mb-1.5 block text-[#333]"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "14px",
          fontWeight: 500,
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
          onChange={onChange}
          className={sharedClass}
          style={inputStyle}
        />
      )}
    </label>
  );
}
