"use client";

import { useEffect, useRef, useState } from "react";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { LeadConsent } from "@/components/forms/LeadConsent";
import {
  FormCard,
  SubmitButton,
  TextArea,
  TextInput,
} from "@/components/sections/forms/FormCard";

/**
 * "Become a Partner" CTA + modal. The old Webflow site opened a popup
 * ("Join Forces with CleanStart") from this CTA; this reproduces it on the
 * new site using the shared FormCard design language (white card / blue
 * border) so it matches its sibling, the Deal Registration form. The form is
 * client-side UX only until it is wired through the CMS LeadHandler / HubSpot
 * `website-partner` form — matching the other marketing forms on the site.
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
        <ArrowIcon className="cs-cta-arrow" />
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
  const [submitted, setSubmitted] = useState(false);
  const inFlightRef = useRef(false);

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
      setSubmitted(false);
      inFlightRef.current = false;
    } else if (dlg.open) {
      dlg.close();
    }
  }, [open]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    // The lead intake adapter is not yet exposed at the web edge; this form is
    // client-side UX only until it is wired through LeadHandler.
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setSubmitted(true);
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

            {submitted ? (
              <p
                className="text-[#0F123E]"
                style={{ fontSize: "var(--fs-body)", lineHeight: 1.5 }}
              >
                Thanks — your partnership request has been received. Our team
                will be in touch within one business day.
              </p>
            ) : (
              <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextInput name="firstName" placeholder="First Name" label="First Name" required />
                  <TextInput name="lastName" placeholder="Last Name" label="Last Name" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextInput name="phone" type="tel" placeholder="Phone number" label="Phone number" />
                  <TextInput name="email" type="email" placeholder="Business Email" label="Business Email" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextInput name="company" placeholder="Company Name" label="Company Name" required />
                  <TextInput name="website" placeholder="Website" label="Website" />
                </div>
                <TextArea
                  name="partnerReason"
                  placeholder="Why are you interested in partnering with us?"
                  label="Why are you interested in partnering with us?"
                />
                <LeadConsent />
                <div className="flex justify-start">
                  <TurnstileWidget />
                </div>
                <SubmitButton>Join Now</SubmitButton>
              </form>
            )}
          </FormCard>
        </div>
      </dialog>
    </>
  );
}

function ArrowIcon({ className = "" }: { className?: string }): React.ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      role="img"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <title>Arrow right</title>
      <path
        d="M3.5 8h9m0 0L9 4.5M12.5 8 9 11.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
