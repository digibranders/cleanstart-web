"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import type { OptionalCategory } from "@/lib/consent/types";
import { useConsent } from "./ConsentProvider";

type Selection = Record<OptionalCategory, boolean>;

interface CategoryMeta {
  key: OptionalCategory | "strictlyNecessary";
  name: string;
  description: string;
  locked?: boolean;
}

/** OneTrust-standard 4-category descriptions (industry boilerplate). */
const CATEGORIES: CategoryMeta[] = [
  {
    key: "strictlyNecessary",
    name: "Strictly Necessary Cookies",
    locked: true,
    description:
      "These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in or filling in forms. You can set your browser to block or alert you about these cookies, but some parts of the site will not then work. These cookies do not store any personally identifiable information.",
  },
  {
    key: "performance",
    name: "Performance Cookies",
    description:
      "These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site. All information these cookies collect is aggregated and therefore anonymous. If you do not allow these cookies we will not know when you have visited our site, and will not be able to monitor its performance.",
  },
  {
    key: "functional",
    name: "Functional Cookies",
    description:
      "These cookies enable the website to provide enhanced functionality and personalisation. They may be set by us or by third party providers whose services we have added to our pages. If you do not allow these cookies then some or all of these services may not function properly.",
  },
  {
    key: "targeting",
    name: "Targeting Cookies",
    description:
      "These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites. They do not store directly personal information, but are based on uniquely identifying your browser and internet device. If you do not allow these cookies, you will experience less targeted advertising.",
  },
];

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
      style={{ backgroundColor: checked ? "#22c55e" : "rgba(255,255,255,0.25)" }}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
        style={{ left: checked ? "22px" : "2px" }}
      />
    </button>
  );
}

function CategoryRow({
  meta,
  checked,
  onToggle,
  open,
  onToggleOpen,
}: {
  meta: CategoryMeta;
  checked: boolean;
  onToggle: (next: boolean) => void;
  open: boolean;
  onToggleOpen: () => void;
}) {
  return (
    <div className="border-t border-white/10 py-4 first:border-t-0">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onToggleOpen}
          aria-expanded={open}
          className="flex items-center gap-2 text-left font-medium text-white"
          style={{ fontSize: "var(--fs-body-sm)" }}
        >
          <span aria-hidden className="inline-block w-3 text-white/60">
            {open ? "−" : "+"}
          </span>
          {meta.name}
        </button>
        {meta.locked ? (
          <span
            className="shrink-0 font-medium text-white/70"
            style={{ fontSize: "var(--fs-caption)" }}
          >
            Always Active
          </span>
        ) : (
          <Toggle
            checked={checked}
            onChange={onToggle}
            label={`Toggle ${meta.name}`}
          />
        )}
      </div>
      {open ? (
        <p
          className="mt-3 pl-5 text-white/65"
          style={{ fontSize: "var(--fs-caption)", lineHeight: 1.6 }}
        >
          {meta.description}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Non-modal bottom-sheet consent banner (WEB-PRODUCTION.md §11).
 * - Fixed bottom overlay, never a centered modal (avoids Google
 *   intrusive-interstitial penalty + mobile UX rules).
 * - "Reject All" and "Allow All" have one-click parity (CNIL).
 * - "Cookies Settings" expands the 4-category preference panel inline.
 */
export function CookieBanner() {
  const { promptOpen, gpc, decide, record } = useConsent();
  const [showPrefs, setShowPrefs] = useState(false);
  // Single open accordion key — only one category description is shown at a time.
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>({
    performance: false,
    functional: false,
    targeting: false,
  });

  // Seed toggles each time the sheet opens: prior decision if present, else
  // default ON — except when a GPC opt-out signal is detected, which seeds OFF.
  useEffect(() => {
    if (!promptOpen) return;
    const seed = record?.categories;
    const def = !gpc;
    setSelection({
      performance: seed?.performance ?? def,
      functional: seed?.functional ?? def,
      targeting: seed?.targeting ?? def,
    });
    setShowPrefs(false);
    setOpenCategory(null);
  }, [promptOpen, record, gpc]);

  useEffect(() => {
    if (!promptOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowPrefs(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [promptOpen]);

  if (!promptOpen) return null;

  const setCategory = (key: OptionalCategory, next: boolean) =>
    setSelection((prev) => ({ ...prev, [key]: next }));

  return (
    <div
      // biome-ignore lint/a11y/useSemanticElements: intentionally a non-modal
      // bottom sheet — native <dialog> forces modal semantics that §11 forbids
      // (centered/blocking interstitials trigger Google ranking penalties).
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-[#131a2e] text-white shadow-[0_-8px_30px_rgba(0,0,0,0.35)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-[1100px] flex-col gap-4 px-6 py-5">
        <p
          className="text-white/80"
          style={{ fontSize: "var(--fs-body-sm)", lineHeight: 1.55 }}
        >
          This website uses cookies and other tracking technologies to enhance
          user experience and to analyze performance and traffic on our website.
          We also share information about your use of our site with our
          advertising and analytics partners. If we have detected an opt-out
          preference signal then it will be honored. By clicking Allow All, you
          understand that CleanStart and third-party partners use technology,
          including cookies, to — among other things — view and retain your site
          interactions, improve your experience and help us advertise. Further
          information is available in our{" "}
          <Link
            href="/privacy-policy#cookies"
            className="font-medium underline underline-offset-2 hover:text-white"
          >
            Privacy&nbsp;Notice
          </Link>
          .
        </p>

        {showPrefs ? (
          <>
            <div>
              <h2 className="font-semibold" style={{ fontSize: "var(--fs-body-sm)" }}>
                Manage Consent Preferences
              </h2>
              <p
                className="mt-1 text-white/65"
                style={{ fontSize: "var(--fs-caption)", lineHeight: 1.6 }}
              >
                When you visit any website, it may store or retrieve information
                on your browser, mostly in the form of cookies. Because we
                respect your right to privacy, you can choose not to allow some
                types of cookies. Click on the category headings to learn more
                and change our default settings.
              </p>
            </div>
            <div className="max-h-[40vh] overflow-y-auto rounded-lg bg-white/[0.03] px-4">
              {CATEGORIES.map((meta) => (
                <CategoryRow
                  key={meta.key}
                  meta={meta}
                  checked={
                    meta.locked
                      ? true
                      : selection[meta.key as OptionalCategory]
                  }
                  onToggle={(next) =>
                    !meta.locked &&
                    setCategory(meta.key as OptionalCategory, next)
                  }
                  open={openCategory === meta.key}
                  onToggleOpen={() =>
                    setOpenCategory((cur) => (cur === meta.key ? null : meta.key))
                  }
                />
              ))}
            </div>
          </>
        ) : null}

        {/* Single action row, always at the bottom. Contents switch by state
            so no button is ever duplicated. */}
        <div className="flex flex-wrap items-center justify-end gap-3">
          {showPrefs ? (
            <>
              <button type="button" onClick={() => decide("reject_all")} className="cs-btn-blue">
                Reject All
              </button>
              <button
                type="button"
                onClick={() => decide("custom", { selection })}
                className="cs-btn-blue"
              >
                Confirm My Choices
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowPrefs(true)}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-white/30 px-[22px] font-medium text-white transition hover:bg-white/10"
                style={{ fontSize: "var(--fs-button)" }}
                aria-expanded={showPrefs}
              >
                Cookies Settings
              </button>
              <button type="button" onClick={() => decide("reject_all")} className="cs-btn-blue">
                Reject All
              </button>
              <button type="button" onClick={() => decide("accept_all")} className="cs-btn-blue">
                Allow All
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
