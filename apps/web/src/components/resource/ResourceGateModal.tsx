"use client";

import { useEffect, useRef } from "react";
import { GatedDownloadForm } from "@/components/resource/GatedDownloadForm";
import { trackEvent } from "@/lib/analytics/track";
import type { LeadDownload } from "@/lib/leads/submitLead";

interface ResourceGateModalProps {
  open: boolean;
  onClose: () => void;
  resourceId: string | number;
  /** The resource's gate form id, routed straight through to the form. */
  gateFormId: number;
  resourceTitle: string;
  onUnlocked: (downloadUrl: string) => void;
}

export function ResourceGateModal({
  open,
  onClose,
  resourceId,
  gateFormId,
  resourceTitle,
  onUnlocked,
}: ResourceGateModalProps): React.ReactElement | null {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open) {
      if (!dlg.open) {
        try {
          dlg.showModal();
        } catch {
          /* dialog already open in some browsers */
        }
      }
    } else if (dlg.open) {
      dlg.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // The signed link arrives with the submit response, so the download is ready
  // the moment the form succeeds: start it and close in one step. The submit
  // button stays busy until the modal unmounts, so it cannot fire twice.
  const handleUnlocked = (download: LeadDownload): void => {
    trackEvent("file_download", {
      resource_title: resourceTitle,
      gated: true,
    });
    onUnlocked(download.url);
    window.location.assign(download.url);
    onClose();
  };

  return (
    <>
      <style>{`
        dialog.cs-gate-modal {
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
        dialog.cs-gate-modal::backdrop {
          background: rgba(10, 12, 30, 0.65);
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
        }
        dialog.cs-gate-modal[open] {
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
          // Backdrop click — close when the click landed on the dialog
          // surface itself, not the inner panel.
          if (e.target === e.currentTarget) onClose();
        }}
        onKeyDown={(e) => {
          if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
            onClose();
          }
        }}
        className="cs-gate-modal"
        aria-labelledby="rgm-title"
      >
        <div
          role="document"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          style={{
            width: "min(520px, calc(100vw - 32px))",
            maxHeight: "calc(100dvh - 32px)",
            overflow: "auto",
            background: "white",
            borderRadius: "16px",
            boxShadow:
              "0 24px 64px rgba(10, 12, 30, 0.35), 0 8px 16px rgba(10, 12, 30, 0.18)",
            padding: "28px 28px 24px 28px",
          }}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
              <h2
                id="rgm-title"
                // Wraps rather than truncating: resource titles are routinely
                // long enough that an ellipsis cut them mid-word.
                className="font-display font-semibold text-[#111]"
                style={{
                  fontSize: "var(--fs-h3)",
                  lineHeight: 1.2,
                  letterSpacing: "-0.02em",
                  textWrap: "balance",
                }}
              >
                {`Unlock “${resourceTitle}”`}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 inline-flex items-center justify-center rounded-full"
              style={{
                width: "32px",
                height: "32px",
                border: "1px solid rgba(17,17,17,0.12)",
                background: "white",
                cursor: "pointer",
                color: "#555",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden
              >
                <path
                  d="M2 2l10 10M12 2L2 12"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {open ? (
            <>
              <p
                className="text-sm text-[#555] mb-5"
                style={{ lineHeight: 1.5 }}
              >
                Enter your details and the download starts straight away.
              </p>
              <GatedDownloadForm
                resourceId={resourceId}
                gateFormId={gateFormId}
                onUnlocked={handleUnlocked}
              />
            </>
          ) : null}
        </div>
      </dialog>
    </>
  );
}
