"use client";

import { useEffect, useState } from "react";

/**
 * Disables navigation and form submission on `/preview/*` routes.
 *
 * Mounted once in `app/preview/layout.tsx`. Attaches a single capture-phase
 * `click` and `submit` listener on `document`, so existing components don't
 * need to know about preview mode.
 *
 * What's blocked:
 *  - Anchor clicks (header nav, footer nav, CTAs, in-body links, external links)
 *  - Form submissions (lead capture, search, anything submitting to a backend)
 *
 * What's allowed:
 *  - Hash-only anchors (`#section`) — TOC links, back-to-top
 *  - Anything inside an element with `data-preview-allow="true"` —
 *    used by the banner's "Exit preview" link
 *
 * UX feedback: a small toast at the bottom of the viewport flashes for
 * ~2.5s when an action is blocked, so the reviewer understands why
 * nothing happened.
 */

interface Toast {
  id: number;
  message: string;
}

const TOAST_TTL_MS = 2500;
const MAX_TOASTS = 2;

function isAllowed(el: Element | null): boolean {
  let cur: Element | null = el;
  while (cur) {
    if (cur instanceof HTMLElement && cur.dataset.previewAllow === "true") {
      return true;
    }
    cur = cur.parentElement;
  }
  return false;
}

export function PreviewInteractionShield(): React.ReactElement | null {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let nextId = 0;

    function showToast(message: string): void {
      const id = ++nextId;
      setToasts((prev) => {
        const next = [...prev, { id, message }];
        return next.length > MAX_TOASTS ? next.slice(-MAX_TOASTS) : next;
      });
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, TOAST_TTL_MS);
    }

    function handleClick(event: MouseEvent): void {
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href") ?? "";
      // Allow same-page hash anchors (TOC, scroll-spy, back-to-top).
      if (href.startsWith("#")) return;
      // Allow explicitly whitelisted links (e.g. Exit preview).
      if (isAllowed(anchor)) return;

      event.preventDefault();
      event.stopPropagation();
      showToast("Link disabled in preview. Exit preview to use it.");
    }

    function handleSubmit(event: SubmitEvent): void {
      if (!(event.target instanceof HTMLFormElement)) return;
      if (isAllowed(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      showToast("Form submissions are disabled in preview.");
    }

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: "1.25rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: "#111",
            color: "#fff",
            padding: "0.6rem 1rem",
            borderRadius: 8,
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: "0.85rem",
            fontWeight: 500,
            boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
            maxWidth: "26rem",
            textAlign: "center",
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
