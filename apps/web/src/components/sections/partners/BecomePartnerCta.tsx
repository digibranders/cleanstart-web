"use client";

import { useEffect, useRef, useState } from "react";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { LeadConsent } from "@/components/forms/LeadConsent";
import { StatusBanner, useFormStatus } from "@/components/forms/StatusBanner";
import { PhoneField } from "@/components/forms/PhoneField";
import { TextField } from "@/components/forms/TextField";
import { FormCard, SubmitButton } from "@/components/sections/forms/FormCard";
import {
  emptyPhoneValue,
  toE164,
  validatePhone,
  type PhoneValue,
} from "@/lib/forms/phone-value";
import { useDetectedCountry } from "@/lib/forms/useDetectedCountry";
import { emailError, optionalText, requiredText } from "@/lib/forms/validate";
import { submitPartner } from "@/lib/partners/submitPartner";
import { trackEvent } from "@/lib/analytics/track";

const STORAGE_CONSENT_TEXT =
  "I agree to allow CleanStart to store and process my personal data.";

type TextKey = "firstName" | "lastName" | "email" | "company" | "website" | "partnerReason";
type ErrorKey = TextKey | "phone";

const INITIAL: Record<TextKey, string> = {
  firstName: "",
  lastName: "",
  email: "",
  company: "",
  website: "",
  partnerReason: "",
};

/**
 * "Become a Partner" CTA + modal. The old Webflow site opened a popup
 * ("Join Forces with CleanStart") from this CTA; this reproduces it on the
 * new site using the shared FormCard design language (white card / blue
 * border) so it matches its sibling, the Deal Registration form. Submissions
 * post through the `submitPartner` helper to the dedicated CMS endpoint
 * `/api/partner-applications/apply`.
 */
export function BecomePartnerCta(): React.ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cs-btn-glass"
        style={
          {
            ["--cs-btn-fs" as string]: "var(--fs-button)",
            ["--cs-btn-px" as string]: "22px",
          } as React.CSSProperties
        }
      >
        <span>Become a Partner</span>
      </button>
      <PartnerModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

interface PartnerModalProps {
  open: boolean;
  onClose: () => void;
}

function PartnerModal({ open, onClose }: PartnerModalProps): React.ReactElement {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [values, setValues] = useState<Record<TextKey, string>>(INITIAL);
  const [phone, setPhone] = useState<PhoneValue>(() => emptyPhoneValue());
  const [errors, setErrors] = useState<Partial<Record<ErrorKey, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const { status, setStatus, statusRef } = useFormStatus();
  const inFlightRef = useRef(false);
  const { country: detectedCountry, detected } = useDetectedCountry();
  const touchedCountryRef = useRef(false);
  // Pending auto-close timer: on success the modal flashes the confirmation
  // banner, then closes itself. Tracked so it can be cancelled on manual
  // close/reopen or unmount.
  const closeTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (closeTimerRef.current != null) window.clearTimeout(closeTimerRef.current);
    },
    [],
  );

  // Adopt the detected country until the visitor picks one themselves.
  useEffect(() => {
    if (!detected || touchedCountryRef.current) return;
    setPhone((prev) => ({ ...prev, country: detectedCountry }));
  }, [detected, detectedCountry]);

  const setError = (key: ErrorKey, message: string | null): void =>
    setErrors((prev) => {
      if (message) return { ...prev, [key]: message };
      const { [key]: _removed, ...rest } = prev;
      return rest;
    });

  const onChange = (key: TextKey) => (next: string) => {
    setValues((prev) => ({ ...prev, [key]: next }));
    if (errors[key]) setError(key, null);
  };

  const validateAll = (): Partial<Record<ErrorKey, string>> => {
    const next: Partial<Record<ErrorKey, string>> = {};
    const first = requiredText(values.firstName, "First name", { min: 2, max: 120 });
    if (first) next.firstName = first;
    const last = requiredText(values.lastName, "Last name", { min: 2, max: 120 });
    if (last) next.lastName = last;
    const mail = emailError(values.email, { requireBusiness: false });
    if (mail) next.email = mail;
    const company = requiredText(values.company, "Company", { min: 2, max: 200 });
    if (company) next.company = company;
    const website = optionalText(values.website, "Website", { max: 500 });
    if (website) next.website = website;
    const reason = optionalText(values.partnerReason, "Your answer", { max: 5000 });
    if (reason) next.partnerReason = reason;
    const tel = validatePhone(phone, { required: false });
    if (tel) next.phone = tel;
    return next;
  };

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open) {
      if (!dlg.open) {
        try {
          dlg.showModal();
        } catch {
          /* already open */
        }
      }
      if (closeTimerRef.current != null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setStatus(null);
      setSubmitting(false);
      setErrors({});
      inFlightRef.current = false;
    } else if (dlg.open) {
      dlg.close();
    }
  }, [open, setStatus]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (inFlightRef.current) return;
    setStatus(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    // The form is noValidate, so the required consent checkbox isn't enforced
    // by the browser — gate on it here before sending.
    if (fd.get("consent_storage") == null) {
      setStatus({
        tone: "error",
        title: "Consent required",
        message:
          "Please agree to the storage & processing of your data to continue.",
      });
      return;
    }
    const found = validateAll();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const firstKey = Object.keys(found)[0];
      if (firstKey) document.getElementById(`partner-${firstKey}`)?.focus();
      return;
    }

    inFlightRef.current = true;
    setSubmitting(true);

    const optional = (value: string): string | undefined => {
      const trimmed = value.trim();
      return trimmed ? trimmed : undefined;
    };

    const firstName = values.firstName.trim();
    const lastName = values.lastName.trim();
    const email = values.email.trim().toLowerCase();
    const company = values.company.trim();
    const phoneE164 = toE164(phone) ?? undefined;
    const website = optional(values.website);
    const partnerReason = optional(values.partnerReason);
    const categories = ["storage", ...(fd.get("consent_marketing") != null ? ["marketing"] : [])];
    const turnstileToken = fd.get("cf-turnstile-response");
    const hp = fd.get("hp");

    try {
      const result = await submitPartner({
        firstName,
        lastName,
        email,
        company,
        ...(phoneE164 != null ? { phone: phoneE164 } : {}),
        ...(website != null ? { website } : {}),
        ...(partnerReason != null ? { partnerReason } : {}),
        consent: {
          snapshot: STORAGE_CONSENT_TEXT,
          givenAt: new Date().toISOString(),
          categories,
        },
        ...(typeof turnstileToken === "string" ? { turnstileToken } : {}),
        ...(typeof hp === "string" ? { hp } : {}),
        ...(typeof window !== "undefined"
          ? { source: window.location.href }
          : {}),
      });

      if (result.ok) {
        trackEvent("generate_lead", { form_name: "become-a-partner" });
        setValues(INITIAL);
        setPhone((prev) => ({ country: prev.country, national: "" }));
        setErrors({});
        form.reset();
        setStatus({
          tone: "success",
          title: "Request received",
          message:
            "Thanks, your partnership request has been received. Our team will be in touch within one business day.",
        });
        // Modal UX: show the confirmation briefly, then close the popup.
        if (closeTimerRef.current != null) window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = window.setTimeout(onClose, 2500);
      } else {
        setStatus({
          tone: "error",
          title: "Couldn't submit",
          message: "We couldn't submit your request. Please try again.",
        });
      }
    } finally {
      inFlightRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        dialog.cs-partner-modal {
          position: fixed;
          inset: 0;
          margin: auto;
          padding: 0;
          border: 0;
          background: transparent;
          max-width: none;
          max-height: none;
          width: 100vw;
          height: 100dvh;
          overflow: visible;
        }
        dialog.cs-partner-modal::backdrop {
          background: rgba(10, 12, 30, 0.65);
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
        }
        dialog.cs-partner-modal[open] {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
      <dialog
        ref={dialogRef}
        onClose={onClose}
        onCancel={(e) => {
          e.preventDefault();
          onClose();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        onKeyDown={(e) => {
          if (
            e.target === e.currentTarget &&
            (e.key === "Enter" || e.key === " ")
          ) {
            onClose();
          }
        }}
        className="cs-partner-modal"
        aria-labelledby="partner-modal-title"
      >
        <div
          role="document"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          style={{
            width: "min(560px, calc(100vw - 32px))",
            maxHeight: "calc(100dvh - 32px)",
            overflow: "auto",
          }}
        >
          <FormCard maxWidth={560}>
            <div className="flex items-start justify-between gap-4 mb-5">
              <h2
                id="partner-modal-title"
                className="font-display font-semibold text-[#0F123E]"
                style={{
                  fontSize: "var(--fs-h3)",
                  lineHeight: 1.2,
                  letterSpacing: "-0.02em",
                }}
              >
                Join Forces with CleanStart
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 inline-flex items-center justify-center rounded-full transition-colors hover:bg-[#F0F0F4]"
                style={{
                  width: "32px",
                  height: "32px",
                  border: "1px solid rgba(17,17,17,0.12)",
                  background: "white",
                  cursor: "pointer",
                  color: "#555",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path
                    d="M2 2l10 10M12 2L2 12"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
              {status ? <StatusBanner ref={statusRef} {...status} /> : null}
              <input
                type="text"
                name="hp"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                defaultValue=""
                style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TextField
                  id="partner-firstName"
                  label="First Name"
                  required
                  size="md"
                  maxLength={120}
                  value={values.firstName}
                  onChange={onChange("firstName")}
                  onBlur={() =>
                    setError(
                      "firstName",
                      requiredText(values.firstName, "First name", { min: 2, max: 120 }),
                    )
                  }
                  error={errors.firstName}
                />
                <TextField
                  id="partner-lastName"
                  label="Last Name"
                  required
                  size="md"
                  maxLength={120}
                  value={values.lastName}
                  onChange={onChange("lastName")}
                  onBlur={() =>
                    setError(
                      "lastName",
                      requiredText(values.lastName, "Last name", { min: 2, max: 120 }),
                    )
                  }
                  error={errors.lastName}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <PhoneField
                  id="partner-phone"
                  label="Phone Number"
                  size="md"
                  value={phone}
                  onChange={(next) => {
                    if (next.country.code !== phone.country.code) {
                      touchedCountryRef.current = true;
                    }
                    setPhone(next);
                    if (errors.phone) setError("phone", null);
                  }}
                  onBlur={() =>
                    setError(
                      "phone",
                      phone.national ? validatePhone(phone, { required: false }) : null,
                    )
                  }
                  error={errors.phone}
                />
                <TextField
                  id="partner-email"
                  label="Email"
                  type="email"
                  required
                  size="md"
                  maxLength={254}
                  value={values.email}
                  onChange={onChange("email")}
                  onBlur={() =>
                    setError(
                      "email",
                      values.email.trim()
                        ? emailError(values.email, { requireBusiness: false })
                        : null,
                    )
                  }
                  error={errors.email}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TextField
                  id="partner-company"
                  label="Company"
                  required
                  size="md"
                  maxLength={200}
                  value={values.company}
                  onChange={onChange("company")}
                  onBlur={() =>
                    setError(
                      "company",
                      requiredText(values.company, "Company", { min: 2, max: 200 }),
                    )
                  }
                  error={errors.company}
                />
                <TextField
                  id="partner-website"
                  label="Website"
                  size="md"
                  maxLength={500}
                  value={values.website}
                  onChange={onChange("website")}
                  onBlur={() =>
                    setError("website", optionalText(values.website, "Website", { max: 500 }))
                  }
                  error={errors.website}
                />
              </div>
              <TextField
                id="partner-partnerReason"
                label="Why are you interested in partnering with us?"
                placeholder="We resell container security into regulated finance across EMEA and want hardened images in our catalogue."
                multiline
                size="md"
                maxLength={5000}
                value={values.partnerReason}
                onChange={onChange("partnerReason")}
                error={errors.partnerReason}
              />
              <LeadConsent />
              <div className="flex justify-start">
                <TurnstileWidget />
              </div>
              <SubmitButton busy={submitting} busyLabel="Submitting…">
                Join Now
              </SubmitButton>
            </form>
          </FormCard>
        </div>
      </dialog>
    </>
  );
}
