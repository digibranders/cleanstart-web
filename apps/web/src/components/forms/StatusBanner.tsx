"use client";

import { forwardRef, useEffect, useRef, useState } from "react";

export interface FormStatus {
  tone: "success" | "error";
  title: string;
  message: string;
}

/**
 * Form-level status: a `status` value, its setter, and a ref to attach to the
 * rendered banner. When status changes the banner is scrolled into view — on
 * submit the user's focus is on the button (often below the fold), so a banner
 * at the top of the form would otherwise be missed.
 *
 * Usage:
 *   const { status, setStatus, statusRef } = useFormStatus();
 *   ...
 *   {status ? <StatusBanner ref={statusRef} {...status} /> : null}
 */
export function useFormStatus(): {
  status: FormStatus | null;
  setStatus: (status: FormStatus | null) => void;
  statusRef: React.RefObject<HTMLDivElement | null>;
} {
  const [status, setStatus] = useState<FormStatus | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status && statusRef.current) {
      statusRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [status]);

  return { status, setStatus, statusRef };
}

/**
 * Shared success/error banner. Success uses role="status"/aria-live polite;
 * error uses role="alert"/aria-live assertive so screen readers announce it. An
 * icon backs up the colour (colour alone isn't an accessible signal). The root
 * div forwards a ref so callers can scroll it into view (see useFormStatus).
 */
export const StatusBanner = forwardRef<HTMLDivElement, FormStatus>(
  function StatusBanner({ tone, title, message }, ref): React.ReactElement {
    const success = tone === "success";
    const fg = success ? "#067647" : "#B42318";
    return (
      <div
        ref={ref}
        role={success ? "status" : "alert"}
        aria-live={success ? "polite" : "assertive"}
        className="font-sans flex items-start gap-3"
        style={{
          borderRadius: "12px",
          padding: "12px 14px",
          marginBottom: "16px",
          border: `1px solid ${
            success ? "rgba(6,118,71,0.22)" : "rgba(180,35,24,0.22)"
          }`,
          background: success ? "#ECFDF3" : "#FEF3F2",
        }}
      >
        {success ? <CheckCircleIcon /> : <AlertCircleIcon />}
        <div className="min-w-0">
          <div
            style={{
              fontSize: "var(--fs-body-sm)",
              fontWeight: 600,
              color: fg,
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "var(--fs-caption)",
              color: fg,
              opacity: 0.85,
              lineHeight: 1.5,
              marginTop: "2px",
            }}
          >
            {message}
          </div>
        </div>
      </div>
    );
  },
);

function CheckCircleIcon(): React.ReactElement {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
      style={{ marginTop: "1px" }}
    >
      <circle cx="12" cy="12" r="9" stroke="#067647" strokeWidth="1.6" />
      <path
        d="M8.5 12.5l2.5 2.5 4.5-5"
        stroke="#067647"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertCircleIcon(): React.ReactElement {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
      style={{ marginTop: "1px" }}
    >
      <circle cx="12" cy="12" r="9" stroke="#B42318" strokeWidth="1.6" />
      <path
        d="M12 8v4.5"
        stroke="#B42318"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16" r="1" fill="#B42318" />
    </svg>
  );
}
