"use client";

import { useEffect, useRef, useState } from "react";
import type { Form } from "@/lib/forms";
import { FormRenderer } from "@/components/forms/FormRenderer";

interface ResourceGateModalProps {
  open: boolean;
  onClose: () => void;
  form: Form;
  resourceId: string | number;
  resourceTitle: string;
  sourceUrl?: string;
  onUnlocked: (downloadUrl: string) => void;
}

export function ResourceGateModal({
  open,
  onClose,
  form,
  resourceId,
  resourceTitle,
  sourceUrl,
  onUnlocked,
}: ResourceGateModalProps): React.ReactElement | null {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [stage, setStage] = useState<"form" | "success">("form");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  // Pending auto-close timer: after a successful unlock the modal shows the
  // "download ready" stage briefly, then closes itself. Tracked so it can be
  // cancelled on manual close/reopen or unmount.
  const closeTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (closeTimerRef.current != null) window.clearTimeout(closeTimerRef.current);
    },
    [],
  );

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
      if (closeTimerRef.current != null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setStage("form");
      setDownloadUrl(null);
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

  const handleSuccess = (result: {
    download?: { url: string; expiresAt: number };
  }): void => {
    if (result.download?.url) {
      setDownloadUrl(result.download.url);
      setStage("success");
      onUnlocked(result.download.url);
      window.setTimeout(() => {
        window.location.assign(result.download!.url);
      }, 400);
    } else {
      setStage("success");
    }
    // Auto-close the modal a few seconds after success — long enough for the
    // download to start (triggered at 400ms) and for the fallback "Download
    // now" button to remain grabbable. Cancelled on manual close/reopen/unmount.
    if (closeTimerRef.current != null) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(onClose, 3500);
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
                className="font-display font-semibold text-[#111] truncate"
                style={{
                  fontSize: "var(--fs-h3)",
                  lineHeight: 1.2,
                  letterSpacing: "-0.02em",
                }}
              >
                {stage === "form"
                  ? `Unlock “${resourceTitle}”`
                  : "Your download is ready"}
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

          {stage === "form" ? (
            <>
              <p
                className="text-sm text-[#555] mb-5"
                style={{ lineHeight: 1.5 }}
              >
                Fill in the form below and we'll unlock the download instantly.
              </p>
              <FormRenderer
                form={form}
                context={sourceUrl ? { resourceId, sourceUrl } : { resourceId }}
                onSuccess={handleSuccess}
              />
            </>
          ) : (
            <div className="flex flex-col items-stretch gap-4">
              <p className="text-sm text-[#333]" style={{ lineHeight: 1.5 }}>
                Thanks — your download has started. If it didn't, use the
                button below.
              </p>
              {downloadUrl ? (
                <a
                  href={downloadUrl}
                  className="inline-flex items-center justify-center gap-2 font-semibold text-white"
                  style={{
                    background:
                      "linear-gradient(180deg, #3960f9 0%, #1e3eb8 100%)",
                    borderRadius: "8px",
                    padding: "12px 24px",
                    height: "48px",
                    textDecoration: "none",
                  }}
                >
                  Download now
                </a>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-[#555] underline self-start"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
