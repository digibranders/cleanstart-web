"use client";

import { useEffect, useId, useRef } from "react";
import { FOCUSABLE_SELECTOR, focusReturnTarget, isInertExempt, trapTarget } from "@/lib/focus-trap";
import { Icon } from "../icon";
import { Scrim } from "./scrim";

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

/** Open overlays, innermost last: only the top one answers the keyboard, so a dialog opened from a drawer does not fight it. */
const openOverlays: HTMLElement[] = [];

/** Makes everything outside the overlay inert (unreachable by keyboard, pointer and screen readers) and returns the undo. */
function inertBackground(overlay: HTMLElement): () => void {
  const changed: Element[] = [];
  for (let node: HTMLElement = overlay; node !== document.body && node.parentElement; node = node.parentElement) {
    for (const sibling of Array.from(node.parentElement.children)) {
      if (sibling === node) continue;
      const exempt = isInertExempt({ tag: sibling.tagName, classes: Array.from(sibling.classList), inert: sibling.hasAttribute("inert") });
      if (exempt) continue;
      sibling.setAttribute("inert", "");
      changed.push(sibling);
    }
  }
  return () => {
    for (const el of changed) el.removeAttribute("inert");
  };
}

/** Focus goes in when the overlay opens, stays inside while it is open (Tab and Shift+Tab wrap), Escape closes it, and focus returns to what opened it. */
function useOverlayBehaviour(open: boolean, onClose: () => void): React.RefObject<HTMLElement | null> {
  const ref = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const overlay = ref.current;
    if (!open || !overlay) return;
    const previous = document.activeElement as HTMLElement | null;
    overlay.querySelector<HTMLElement>("[autofocus], input:not([type=hidden]), textarea, select, button.btn-p")?.focus();
    openOverlays.push(overlay);
    const restoreBackground = inertBackground(overlay);
    const onKey = (event: KeyboardEvent): void => {
      if (openOverlays.at(-1) !== overlay) return;
      // Another dialog that is not an overlay (the search palette, opened with Ctrl K) handles its own keys.
      if (event.target instanceof Element && !overlay.contains(event.target) && event.target.closest('[role="dialog"]')) return;
      if (event.key === "Escape") {
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = Array.from(overlay.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.getClientRects().length > 0 && !el.closest("[inert]"),
      );
      const target = trapTarget(items, document.activeElement as HTMLElement | null, event.shiftKey);
      if (target) {
        event.preventDefault();
        target.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      restoreBackground();
      openOverlays.splice(openOverlays.indexOf(overlay), 1);
      focusReturnTarget(previous, document.getElementById("main"))?.focus();
    };
  }, [open]);
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
      <Scrim className="cs-scrim" onClose={onClose} />
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
