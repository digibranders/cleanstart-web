"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { Container, Section } from "@/components/layout";
import { FormCard, TextArea, TextInput } from "@/components/sections/forms/FormCard";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { submitApplication } from "@/lib/careers/submitApplication";

const MAX_RESUME_BYTES = 10 * 1024 * 1024;
const CONSENT_TEXT =
  "I consent to CleanStart storing and processing my application data and resume for recruitment purposes.";

interface JobApplyFormProps {
  jobSlug: string;
  jobTitle: string;
}

/**
 * Per-job application form for CMS-native, open roles. Mirrors the shared
 * FormCard / TurnstileWidget / consent language of the lead-capture forms
 * (see `BecomePartnerCta`), but posts a resume file as multipart through
 * `submitApplication` → CMS `/api/career-applications/apply`.
 *
 * The Turnstile widget injects a hidden `cf-turnstile-response` input into the
 * surrounding form; its value is read off FormData on submit — the same wiring
 * the lead forms use.
 */
export function JobApplyForm({
  jobSlug,
  jobTitle,
}: JobApplyFormProps): React.ReactElement {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inFlightRef = useRef(false);

  const onSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    if (inFlightRef.current) return;
    setError(null);

    const form = e.currentTarget;
    const fd = new FormData(form);

    // The form is noValidate, so the required consent checkbox isn't enforced
    // by the browser — gate on it here before sending.
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

    const turnstileToken = fd.get("cf-turnstile-response");
    const phone = String(fd.get("phone") ?? "").trim();
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
      ...(coverLetter ? { coverLetter } : {}),
      ...(linkedinUrl ? { linkedinUrl } : {}),
      ...(typeof turnstileToken === "string" ? { turnstileToken } : {}),
      ...(typeof window !== "undefined" ? { source: window.location.href } : {}),
    });
    setBusy(false);

    if (result.ok) {
      setDone(true);
      formRef.current?.reset();
    } else {
      setError("Something went wrong. Please try again.");
      inFlightRef.current = false;
    }
  };

  return (
    <Section padding="md">
      <Container variant="prose">
        <FormCard maxWidth={560}>
          <h2
            className="font-display font-semibold text-[#0F123E]"
            style={{
              fontSize: "var(--fs-h3)",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              marginBottom: "20px",
            }}
          >
            Apply for {jobTitle}
          </h2>

          {done ? (
            <p
              className="text-[#0F123E]"
              style={{ fontSize: "var(--fs-body)", lineHeight: 1.5 }}
            >
              Thanks for applying to {jobTitle}. Our team will review your
              application and be in touch.
            </p>
          ) : (
            <form
              ref={formRef}
              onSubmit={onSubmit}
              noValidate
              className="flex flex-col gap-4"
            >
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TextInput
                  name="firstName"
                  placeholder="First Name"
                  label="First Name"
                  required
                />
                <TextInput
                  name="lastName"
                  placeholder="Last Name"
                  label="Last Name"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TextInput
                  name="email"
                  type="email"
                  placeholder="Business Email"
                  label="Business Email"
                  required
                />
                <TextInput
                  name="phone"
                  type="tel"
                  placeholder="Phone number"
                  label="Phone number"
                />
              </div>
              <TextInput
                name="linkedinUrl"
                placeholder="LinkedIn URL"
                label="LinkedIn URL"
              />

              <ResumeInput />

              <TextArea
                name="coverLetter"
                placeholder="Cover letter (optional)"
                label="Cover letter"
              />

              <RecruitmentConsent />

              <div className="flex justify-start">
                <TurnstileWidget />
              </div>

              {error && (
                <p
                  role="alert"
                  style={{
                    fontFamily: "var(--font-sans), 'Sora', sans-serif",
                    fontSize: "var(--fs-body-sm)",
                    fontWeight: 500,
                    lineHeight: 1.45,
                    color: "#B42318",
                  }}
                >
                  {error}
                </p>
              )}

              <ApplyButton busy={busy} />
            </form>
          )}
        </FormCard>
      </Container>
    </Section>
  );
}

/**
 * File picker styled to match the FormCard text inputs (same #FBFBFB surface,
 * #DDDDDD border, 16px label). The native file-chooser button is left to the
 * browser, but the field wrapper carries the shared treatment.
 */
function ResumeInput(): React.ReactElement {
  return (
    <label className="block">
      <span
        className="block"
        style={{
          fontFamily: "var(--font-display), 'Manrope', sans-serif",
          fontWeight: 500,
          fontSize: "var(--fs-body-sm)",
          lineHeight: 1.4,
          color: "#111111",
          marginBottom: "6px",
        }}
      >
        Resume <span className="text-[#D14343]">*</span>
      </span>
      <input
        name="resume"
        type="file"
        accept=".pdf,.doc,.docx"
        required
        aria-label="Resume (PDF, DOC, or DOCX, 10 MB max)"
        className="w-full rounded-[8px] outline-none transition-colors focus:border-[#3960F9] file:mr-3 file:rounded-[6px] file:border-0 file:bg-[#3960F9] file:px-3 file:py-2 file:text-white file:cursor-pointer"
        style={{
          background: "#FBFBFB",
          border: "1.5px solid #DDDDDD",
          padding: "11px 12px",
          fontFamily: "var(--font-display), 'Manrope', sans-serif",
          fontWeight: 500,
          fontSize: "var(--fs-input)",
          lineHeight: 1.125,
          color: "#111111",
        }}
      />
      <span
        className="block"
        style={{
          fontFamily: "var(--font-sans), 'Sora', sans-serif",
          fontWeight: 400,
          fontSize: "var(--fs-caption)",
          lineHeight: 1.4,
          color: "#111111",
          opacity: 0.7,
          marginTop: "6px",
        }}
      >
        PDF, DOC, or DOCX. 10 MB maximum.
      </span>
    </label>
  );
}

/**
 * Required recruitment consent, mirroring the `LeadConsent` checkbox treatment
 * but with a single recruitment-purpose category and its own snapshot copy.
 */
function RecruitmentConsent(): React.ReactElement {
  return (
    <label className="flex items-start cursor-pointer" style={{ gap: "8px" }}>
      <span
        className="inline-flex shrink-0 items-center"
        style={{ height: "1.4em", fontSize: "var(--fs-caption)" }}
      >
        <span
          className="relative inline-flex"
          style={{ width: "18px", height: "18px" }}
        >
          <input
            type="checkbox"
            name="consent_recruitment"
            required
            aria-required
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
        {CONSENT_TEXT} See our{" "}
        <Link href="/privacy-policy" className="underline" style={{ color: "#2F49E5" }}>
          Privacy Policy
        </Link>
        .<span className="ml-0.5 text-[#D14343]">*</span>
      </span>
    </label>
  );
}

/**
 * Primary submit button styled identically to FormCard's `SubmitButton`, with
 * an added busy/disabled state (the shared component takes no `disabled` prop).
 */
function ApplyButton({ busy }: { busy: boolean }): React.ReactElement {
  return (
    <button
      type="submit"
      disabled={busy}
      aria-busy={busy}
      className="relative w-full overflow-hidden rounded-[8px] text-white cursor-pointer transition-colors hover:bg-[#2438C2] disabled:cursor-not-allowed disabled:opacity-70"
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
          fontSize: "var(--fs-button)",
          lineHeight: "24.06px",
          letterSpacing: "-0.01em",
        }}
      >
        {busy ? "Submitting…" : "Submit application"}
      </span>
    </button>
  );
}

export default JobApplyForm;
