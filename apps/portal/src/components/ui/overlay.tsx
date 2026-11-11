"use client";

import { useEffect, useId, useRef } from "react";
import { Icon } from "../icon";

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Extra element shown left of the title (an avatar, for instance). */
  lead?: React.ReactNode;
  /** Render as a form so Enter submits; onSubmit receives the form event. */
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
}

// shortcut: no focus trap, only focus-in, Escape and focus-return. Fine for a review mock.
function useOverlayBehaviour(open: boolean, onClose: () => void): React.RefObject<HTMLElement | null> {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const first = ref.current?.querySelector<HTMLElement>(
      "[autofocus], input:not([type=hidden]), textarea, select, button.btn-p",
    );
    first?.focus();
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open, onClose]);
  return ref;
}

function OverlayBody(props: OverlayProps & { kind: "drawer" | "dialog" }): React.JSX.Element | null {
  const { open, onClose, title, subtitle, children, footer, lead, onSubmit, kind, className } = props;
  const labelId = useId();
  const ref = useOverlayBehaviour(open, onClose);
  if (!open) return null;

  const inner = (
    <>
      <div className="ov-h">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {lead}
          <div>
            <h2 id={labelId} className="ov-t">
              {title}
            </h2>
            {subtitle ? <p className="ov-s">{subtitle}</p> : null}
          </div>
        </div>
        <button
          type="button"
          className="ibtn"
          onClick={onClose}
          aria-label="Close"
          style={{ width: 26, height: 26 }}
        >
          <Icon name="x" />
        </button>
      </div>
      <div className="ov-b">{children}</div>
      {footer ? <div className="ov-f">{footer}</div> : null}
    </>
  );
  const cls = `${kind}${className ? ` ${className}` : ""}`;

  return (
    <>
      <div className="cs-scrim" onClick={onClose} aria-hidden="true" />
      {onSubmit ? (
        <form
          ref={ref as React.RefObject<HTMLFormElement>}
          className={cls}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelId}
          onSubmit={onSubmit}
          noValidate
        >
          {inner}
        </form>
      ) : (
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={cls}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelId}
        >
          {inner}
        </div>
      )}
    </>
  );
}

export function Drawer(props: OverlayProps): React.JSX.Element | null {
  return <OverlayBody {...props} kind="drawer" />;
}

export function Dialog(props: OverlayProps): React.JSX.Element | null {
  return <OverlayBody {...props} kind="dialog" />;
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
  danger,
}: ConfirmDialogProps): React.JSX.Element | null {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${danger ? "btn-dd" : "btn-p"}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ margin: 0, lineHeight: 1.55 }}>{body}</p>
    </Dialog>
  );
}
