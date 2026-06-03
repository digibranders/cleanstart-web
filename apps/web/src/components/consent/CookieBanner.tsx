"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { useConsent } from "./ConsentProvider";

/**
 * Non-modal bottom-sheet consent banner (WEB-PRODUCTION.md §11).
 * - Fixed bottom overlay, never a centered modal (avoids Google
 *   intrusive-interstitial penalty + mobile UX rules).
 * - "Reject all" and "Accept all" have one-click parity (CNIL).
 * - "Manage preferences" expands an inline panel within the same sheet.
 */
export function CookieBanner() {
  const { promptOpen, gpc, decide, closePrompt, record } = useConsent();
  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Seed the toggle from any prior decision (GPC defaults analytics off) each
  // time the sheet opens.
  useEffect(() => {
    if (promptOpen) {
      setAnalytics(record?.categories.analytics ?? false);
      setShowPrefs(false);
    }
  }, [promptOpen, record]);

  useEffect(() => {
    if (!promptOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePrompt();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [promptOpen, closePrompt]);

  if (!promptOpen) return null;

  return (
    <div
      ref={sheetRef}
      // biome-ignore lint/a11y/useSemanticElements: intentionally a non-modal
      // bottom sheet — native <dialog> forces modal semantics that §11 forbids
      // (centered/blocking interstitials trigger Google ranking penalties).
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-[#151021] text-white shadow-[0_-8px_30px_rgba(0,0,0,0.35)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-[1100px] flex-col gap-4 px-6 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p
            className="max-w-[640px] text-white/80"
            style={{ fontSize: "var(--fs-body-sm)", lineHeight: 1.55 }}
          >
            We use essential cookies to run this site and, with your consent,
            analytics cookies to understand usage and improve it. See our{" "}
            <Link
              href="/privacy-policy#cookies"
              className="underline underline-offset-2 hover:text-white"
            >
              Cookie&nbsp;Policy
            </Link>
            .
            {gpc ? (
              <span className="mt-1 block text-white/60" style={{ fontSize: "var(--fs-caption)" }}>
                We detected a Global Privacy Control signal, so analytics is off
                by default.
              </span>
            ) : null}
          </p>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPrefs((v) => !v)}
              className="rounded-lg px-3 py-2 text-white/70 underline-offset-4 hover:text-white hover:underline"
              style={{ fontSize: "var(--fs-button)" }}
              aria-expanded={showPrefs}
            >
              Manage preferences
            </button>
            <button
              type="button"
              onClick={() => decide("reject_all")}
              className="rounded-lg border border-white/25 px-5 py-2.5 font-medium text-white transition hover:bg-white/10"
              style={{ fontSize: "var(--fs-button)" }}
            >
              Reject all
            </button>
            <button
              type="button"
              onClick={() => decide("accept_all")}
              className="rounded-lg bg-white px-5 py-2.5 font-medium text-[#151021] transition hover:bg-white/90"
              style={{ fontSize: "var(--fs-button)" }}
            >
              Accept all
            </button>
          </div>
        </div>

        {showPrefs ? (
          <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium" style={{ fontSize: "var(--fs-body-sm)" }}>
                  Essential
                </p>
                <p className="text-white/60" style={{ fontSize: "var(--fs-caption)" }}>
                  Required for the site to function. Always on.
                </p>
              </div>
              <span className="text-white/50" style={{ fontSize: "var(--fs-caption)" }}>
                Always on
              </span>
            </div>
            <label className="flex cursor-pointer items-center justify-between gap-4">
              <span>
                <span className="block font-medium" style={{ fontSize: "var(--fs-body-sm)" }}>
                  Analytics
                </span>
                <span className="block text-white/60" style={{ fontSize: "var(--fs-caption)" }}>
                  Anonymous usage + performance data to help us improve.
                </span>
              </span>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-white"
              />
            </label>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => decide("custom", { analytics })}
                className="rounded-lg bg-white px-5 py-2.5 font-medium text-[#151021] transition hover:bg-white/90"
                style={{ fontSize: "var(--fs-button)" }}
              >
                Save preferences
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
