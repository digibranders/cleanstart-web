"use client";

import Link from "next/link";
import { useRef, useState, type ChangeEvent } from "react";

import { TurnstileWidget } from "@/components/TurnstileWidget";
import { submitApplication } from "@/lib/careers/submitApplication";

const MAX_RESUME_BYTES = 10 * 1024 * 1024;
const ACCENT = "#4a3bf1";
const CONSENT_TEXT =
  "I consent to CleanStart storing and processing my application data and resume for recruitment purposes.";
const HEAR_OPTIONS = [
  "LinkedIn",
  "Job board",
  "Referral",
  "Search engine",
  "Event / conference",
  "Other",
] as const;

interface JobApplyFormProps {
  jobSlug: string;
  jobTitle: string;
}

/**
 * Per-job application form for CMS-native, open roles. Posts a resume file as
 * multipart through `submitApplication` → CMS `/api/career-applications/apply`.
 * Styled to match the careers content column (full width, indigo accent, dashed
 * drop-zone). The Turnstile widget injects a hidden `cf-turnstile-response`
 * input read off FormData on submit.
 */
export function JobApplyForm({
  jobSlug,
  jobTitle,
}: JobApplyFormProps): React.ReactElement {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const inFlightRef = useRef(false);

  const handleResume = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) {
      setResumeName("");
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      setError("Resume must be 10 MB or smaller.");
      event.target.value = "";
      setResumeName("");
      return;
    }
    setError(null);
    setResumeName(file.name);
  };

  const onSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    if (inFlightRef.current) return;
    setError(null);

    const form = e.currentTarget;
    const fd = new FormData(form);

    if (fd.get("consent_recruitment") == null) {
      setError("Please confirm consent to continue.");
      return;
    }

    const resume = fd.get("resume");
    if (!(resume instanceof File) || resume.size === 0) {
      setError("Please attach your resume (PDF, DOC, or DOCX).");
      return;
    }
    if (resume.size > MAX_RESUME_BYTES) {
      setError("Resume must be 10 MB or smaller.");
      return;
    }

    const coverLetterFile = fd.get("coverLetterFile");
    if (
      coverLetterFile instanceof File &&
      coverLetterFile.size > MAX_RESUME_BYTES
    ) {
      setError("Cover letter file must be 10 MB or smaller.");
      return;
    }

    const turnstileToken = fd.get("cf-turnstile-response");
    const phone = String(fd.get("phone") ?? "").trim();
    const location = String(fd.get("location") ?? "").trim();
    const howDidYouHear = String(fd.get("howDidYouHear") ?? "").trim();
    const coverLetter = String(fd.get("coverLetter") ?? "").trim();
    const linkedinUrl = String(fd.get("linkedinUrl") ?? "").trim();

    inFlightRef.current = true;
    setBusy(true);
    const result = await submitApplication({
      jobSlug,
      firstName: String(fd.get("firstName") ?? "").trim(),
      lastName: String(fd.get("lastName") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      resume,
      consent: {
        snapshot: CONSENT_TEXT,
        givenAt: new Date().toISOString(),
        categories: ["recruitment"],
      },
      ...(phone ? { phone } : {}),
      ...(location ? { location } : {}),
      ...(howDidYouHear ? { howDidYouHear } : {}),
      ...(coverLetter ? { coverLetter } : {}),
      ...(coverLetterFile instanceof File && coverLetterFile.size > 0
        ? { coverLetterFile }
        : {}),
      ...(linkedinUrl ? { linkedinUrl } : {}),
      ...(typeof turnstileToken === "string" ? { turnstileToken } : {}),
      ...(typeof window !== "undefined" ? { source: window.location.href } : {}),
    });
    setBusy(false);

    if (result.ok) {
      setDone(true);
      setResumeName("");
      formRef.current?.reset();
    } else {
      setError("Something went wrong. Please try again.");
      inFlightRef.current = false;
    }
  };

  return (
    <section className="relative w-full bg-white overflow-x-clip">
      <div className="relative mx-auto max-w-[820px] px-6 sm:px-10 pt-2 pb-24">
        {done ? (
          <div
            className="bg-white"
            style={{
              borderRadius: "16px",
              padding: "32px 24px",
              border: "1px solid rgba(74,59,241,0.25)",
            }}
          >
            <h3
              className="font-display"
              style={{
                fontSize: "var(--fs-h4)",
                fontWeight: 600,
                color: "#111",
                marginBottom: "8px",
                letterSpacing: "-0.02em",
              }}
            >
              Application received
            </h3>
            <p
              className="font-sans"
              style={{
                fontSize: "var(--fs-body-sm)",
                color: "rgba(17,17,17,0.65)",
                lineHeight: 1.5,
              }}
            >
              Thanks for applying to {jobTitle}. Our team will review your
              application and be in touch.
            </p>
          </div>
        ) : (
          <form
            ref={formRef}
            onSubmit={onSubmit}
            className="bg-white"
            style={{
              borderRadius: "16px",
              padding: "24px",
              border: "1px solid rgba(74,59,241,0.25)",
              boxShadow:
                "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01), 0px 29px 17px 0px rgba(0,0,0,0.01)",
            }}
            noValidate
          >
            <h2
              className="font-display"
              style={{
                fontSize: "var(--fs-h3)",
                fontWeight: 600,
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                color: "#111",
                marginBottom: "20px",
              }}
            >
              Apply for {jobTitle}
            </h2>

            {/* Honeypot — visually hidden, kept out of the tab order. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{
                position: "absolute",
                width: "1px",
                height: "1px",
                padding: 0,
                margin: "-1px",
                overflow: "hidden",
                clip: "rect(0 0 0 0)",
                whiteSpace: "nowrap",
                border: 0,
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="First Name"
                name="firstName"
                placeholder="Jane"
                required
                autoComplete="given-name"
              />
              <Field
                label="Last Name"
                name="lastName"
                placeholder="Doe"
                required
                autoComplete="family-name"
              />
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Email"
                name="email"
                type="email"
                placeholder="you@email.com"
                required
                autoComplete="email"
              />
              <Field
                label="Phone"
                name="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                autoComplete="tel"
              />
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Location"
                name="location"
                placeholder="City, Country"
                autoComplete="address-level2"
              />
              <SelectField
                label="How did you hear about us?"
                name="howDidYouHear"
                options={HEAR_OPTIONS}
              />
            </div>

            <div className="mt-4">
              <Field
                label="LinkedIn URL"
                name="linkedinUrl"
                type="url"
                placeholder="https://linkedin.com/in/…"
              />
            </div>

            <div className="mt-4">
              <span
                className="font-sans block"
                style={{
                  fontSize: "var(--fs-caption)",
                  fontWeight: 500,
                  color: "rgba(17,17,17,0.7)",
                  marginBottom: "6px",
                  letterSpacing: "-0.005em",
                }}
              >
                Resume / CV
                <span aria-hidden style={{ color: ACCENT }}> *</span>
              </span>
              <label
                htmlFor="resume"
                className="font-sans flex flex-col items-center justify-center cursor-pointer"
                style={{
                  border: "1px dashed rgba(74,59,241,0.45)",
                  background: "rgba(74,59,241,0.04)",
                  borderRadius: "12px",
                  padding: "20px 16px",
                  textAlign: "center",
                }}
              >
                <UploadIcon />
                <span
                  style={{
                    fontSize: "var(--fs-body-sm)",
                    fontWeight: 500,
                    color: ACCENT,
                    marginTop: "8px",
                  }}
                >
                  {resumeName || "Drop or browse — PDF, DOC, DOCX"}
                </span>
                <span
                  style={{
                    fontSize: "var(--fs-caption)",
                    color: "rgba(17,17,17,0.55)",
                    marginTop: "4px",
                  }}
                >
                  Max file size: 10 MB
                </span>
                <input
                  id="resume"
                  name="resume"
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  required
                  onChange={handleResume}
                  aria-label="Resume (PDF, DOC, or DOCX, 10 MB max)"
                  className="sr-only"
                />
              </label>
            </div>

            <div className="mt-4">
              <label
                htmlFor="coverLetter"
                className="font-sans block"
                style={{
                  fontSize: "var(--fs-caption)",
                  fontWeight: 500,
                  color: "rgba(17,17,17,0.7)",
                  marginBottom: "6px",
                  letterSpacing: "-0.005em",
                }}
              >
                Cover letter (optional) — paste below or upload a file
              </label>
              <textarea
                id="coverLetter"
                name="coverLetter"
                rows={4}
                placeholder="A short note on why you're a great fit…"
                className="font-sans w-full"
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(17,17,17,0.12)",
                  background: "white",
                  fontSize: "var(--fs-body)",
                  color: "#111",
                  outline: "none",
                  resize: "vertical",
                  lineHeight: 1.5,
                }}
              />
              <input
                name="coverLetterFile"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                aria-label="Cover letter file (PDF, DOC, or DOCX, 10 MB max)"
                className="font-sans w-full mt-2 file:mr-3 file:rounded-[6px] file:border-0 file:bg-[#4a3bf1] file:px-3 file:py-1.5 file:text-white file:cursor-pointer"
                style={{
                  fontSize: "var(--fs-caption)",
                  color: "rgba(17,17,17,0.7)",
                }}
              />
              <span
                className="font-sans block"
                style={{
                  fontSize: "var(--fs-caption)",
                  color: "rgba(17,17,17,0.55)",
                  marginTop: "4px",
                }}
              >
                Optional file: PDF, DOC, or DOCX, 10 MB max.
              </span>
            </div>

            <div className="mt-4">
              <RecruitmentConsent />
            </div>

            <div className="mt-5 flex justify-center sm:justify-start">
              <TurnstileWidget />
            </div>

            {error && (
              <p
                role="alert"
                className="font-sans mt-3"
                style={{
                  fontSize: "var(--fs-caption)",
                  color: "#B42318",
                  lineHeight: 1.4,
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              aria-busy={busy}
              className="font-sans relative inline-flex items-center justify-center w-full mt-5 cursor-pointer transform-gpu hover:-translate-y-px hover:brightness-110 active:translate-y-0 active:scale-[0.99] active:duration-[80ms] active:brightness-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#33BAEC] focus-visible:outline-offset-[3px] disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                height: "48px",
                borderRadius: "10px",
                background: ACCENT,
                color: "white",
                fontSize: "var(--fs-body-sm)",
                fontWeight: 500,
                letterSpacing: "-0.01em",
                transition:
                  "transform 200ms ease, filter 200ms ease, box-shadow 200ms ease",
                WebkitTapHighlightColor: "transparent",
                boxShadow:
                  "0 0 0 1px #4a3bf1, 0 1px 2px rgba(9,6,63,0.4), inset 0 1px 0 rgba(255,255,255,0.16)",
              }}
            >
              {busy ? "Submitting…" : "Submit application"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

interface FieldProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  autoComplete,
}: FieldProps): React.ReactElement {
  return (
    <div>
      <label
        htmlFor={name}
        className="font-sans block"
        style={{
          fontSize: "var(--fs-caption)",
          fontWeight: 500,
          color: "rgba(17,17,17,0.7)",
          marginBottom: "6px",
          letterSpacing: "-0.005em",
        }}
      >
        {label}
        {required && (
          <span aria-hidden style={{ color: ACCENT }}>
            {" "}
            *
          </span>
        )}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="font-sans w-full"
        style={{
          height: "44px",
          padding: "0 14px",
          borderRadius: "10px",
          border: "1px solid rgba(17,17,17,0.12)",
          background: "white",
          fontSize: "var(--fs-body)",
          color: "#111",
          outline: "none",
        }}
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  name: string;
  options: readonly string[];
}

function SelectField({
  label,
  name,
  options,
}: SelectFieldProps): React.ReactElement {
  return (
    <div>
      <label
        htmlFor={name}
        className="font-sans block"
        style={{
          fontSize: "var(--fs-caption)",
          fontWeight: 500,
          color: "rgba(17,17,17,0.7)",
          marginBottom: "6px",
          letterSpacing: "-0.005em",
        }}
      >
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue=""
        className="font-sans w-full cursor-pointer"
        style={{
          height: "44px",
          padding: "0 14px",
          borderRadius: "10px",
          border: "1px solid rgba(17,17,17,0.12)",
          background: "white",
          fontSize: "var(--fs-body)",
          color: "#111",
          outline: "none",
        }}
      >
        <option value="">Select…</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function RecruitmentConsent(): React.ReactElement {
  return (
    <label className="flex items-start cursor-pointer" style={{ gap: "8px" }}>
      <span
        className="relative inline-flex shrink-0"
        style={{ width: "18px", height: "18px", marginTop: "2px" }}
      >
        <input
          type="checkbox"
          name="consent_recruitment"
          required
          aria-required
          className="peer w-full h-full appearance-none cursor-pointer rounded-[4px] bg-white border-[1.5px] border-[rgba(17,17,17,0.2)] checked:bg-[#4a3bf1] checked:border-[#4a3bf1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a3bf1]"
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
        className="font-sans"
        style={{
          fontSize: "var(--fs-caption)",
          lineHeight: 1.4,
          letterSpacing: "-0.01em",
          color: "rgba(17,17,17,0.85)",
        }}
      >
        {CONSENT_TEXT} See our{" "}
        <Link href="/privacy-policy" className="underline" style={{ color: ACCENT }}>
          Privacy Policy
        </Link>
        .<span aria-hidden style={{ color: ACCENT }}> *</span>
      </span>
    </label>
  );
}

function UploadIcon(): React.ReactElement {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
        stroke={ACCENT}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default JobApplyForm;
