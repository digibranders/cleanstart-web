"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { TurnstileWidget } from "@/components/TurnstileWidget";

interface CareerApplyFormProps {
  jobTitle: string;
  jobSlug: string;
  contactEmail: string;
}

interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  resumeName: string;
}

const EMPTY: FormState = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  resumeName: "",
};

const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export function CareerApplyForm({
  jobTitle,
  jobSlug,
  contactEmail,
}: CareerApplyFormProps): React.ReactElement {
  const [values, setValues] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleChange = (field: keyof FormState) =>
    (event: ChangeEvent<HTMLInputElement>): void => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleResume = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) {
      setValues((prev) => ({ ...prev, resumeName: "" }));
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      setError("Resume must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }
    setError(null);
    setValues((prev) => ({ ...prev, resumeName: file.name }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (
      !values.firstName.trim() ||
      !values.lastName.trim() ||
      !values.email.trim()
    ) {
      setError("Please fill in your name and email.");
      return;
    }
    if (!turnstileToken) {
      setError("Please complete the verification challenge.");
      return;
    }
    const subject = `Application: ${jobTitle} (${jobSlug})`;
    const lines = [
      `Role: ${jobTitle}`,
      `Name: ${values.firstName} ${values.lastName}`,
      `Email: ${values.email}`,
      `Phone: ${values.phone || "—"}`,
      `Resume: ${values.resumeName || "(attach manually)"}`,
      "",
      "Please attach your CV/Resume to this email before sending.",
    ];
    const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(lines.join("\n"))}`;
    window.location.href = mailto;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div
        className="bg-white"
        style={{
          borderRadius: "16px",
          padding: "32px 24px",
          border: "1px solid rgba(74,59,241,0.25)",
          textAlign: "center",
        }}
      >
        <h3
          className="font-display"
          style={{
            fontSize: "20px",
            fontWeight: 600,
            color: "#111",
            marginBottom: "8px",
            letterSpacing: "-0.02em",
          }}
        >
          Email draft opened
        </h3>
        <p
          className="font-sans"
          style={{ fontSize: "15px", color: "rgba(17,17,17,0.65)", lineHeight: 1.5 }}
        >
          Attach your resume to the draft in your mail client, then hit send.
          Our team will reply within 5 business days.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="First Name"
          name="firstName"
          value={values.firstName}
          onChange={handleChange("firstName")}
          required
          autoComplete="given-name"
        />
        <Field
          label="Last Name"
          name="lastName"
          value={values.lastName}
          onChange={handleChange("lastName")}
          required
          autoComplete="family-name"
        />
      </div>

      <div className="mt-4">
        <Field
          label="Phone"
          name="phone"
          type="tel"
          value={values.phone}
          onChange={handleChange("phone")}
          placeholder="+1 (555) 000-0000"
          autoComplete="tel"
        />
      </div>

      <div className="mt-4">
        <Field
          label="Email address"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange("email")}
          placeholder="you@company.com"
          required
          autoComplete="email"
        />
      </div>

      <div className="mt-4">
        <label
          htmlFor="resume"
          className="font-sans block"
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "rgba(17,17,17,0.7)",
            marginBottom: "6px",
            letterSpacing: "-0.005em",
          }}
        >
          Resume / CV
        </label>
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
              fontSize: "14px",
              fontWeight: 500,
              color: "#4a3bf1",
              marginTop: "8px",
            }}
          >
            {values.resumeName || "Drop or browse — PDF, DOC, DOCX"}
          </span>
          <span
            style={{
              fontSize: "12px",
              color: "rgba(17,17,17,0.55)",
              marginTop: "4px",
            }}
          >
            Max file size: 5 MB
          </span>
          <input
            id="resume"
            name="resume"
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleResume}
            className="sr-only"
          />
        </label>
      </div>

      <div className="mt-5 flex justify-center sm:justify-start">
        <TurnstileWidget
          onToken={(token) => {
            setTurnstileToken(token);
            setError(null);
          }}
          onExpired={() => setTurnstileToken(null)}
          onError={() => setTurnstileToken(null)}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="font-sans mt-3"
          style={{ fontSize: "13px", color: "#B42318", lineHeight: 1.4 }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        className="font-sans relative inline-flex items-center justify-center w-full mt-5 cursor-pointer transform-gpu hover:-translate-y-px hover:brightness-110 active:translate-y-0 active:scale-[0.99] active:duration-[80ms] active:brightness-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#33BAEC] focus-visible:outline-offset-[3px]"
        style={{
          height: "48px",
          borderRadius: "10px",
          background: "#4a3bf1",
          color: "white",
          fontSize: "15px",
          fontWeight: 500,
          letterSpacing: "-0.01em",
          transition: "transform 200ms ease, filter 200ms ease, box-shadow 200ms ease",
          WebkitTapHighlightColor: "transparent",
          boxShadow:
            "0 0 0 1px #4a3bf1, 0 1px 2px rgba(9,6,63,0.4), inset 0 1px 0 rgba(255,255,255,0.16)",
        }}
      >
        Submit application
      </button>
    </form>
  );
}

interface FieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}

function Field({
  label,
  name,
  value,
  onChange,
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
          fontSize: "13px",
          fontWeight: 500,
          color: "rgba(17,17,17,0.7)",
          marginBottom: "6px",
          letterSpacing: "-0.005em",
        }}
      >
        {label}
        {required && <span aria-hidden style={{ color: "#4a3bf1" }}> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
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
          fontSize: "16px",
          color: "#111",
          outline: "none",
        }}
      />
    </div>
  );
}

function UploadIcon(): React.ReactElement {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
        stroke="#4a3bf1"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
