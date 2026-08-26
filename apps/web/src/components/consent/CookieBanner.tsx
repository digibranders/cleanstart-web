"use client";

import { useEffect, useRef, useState } from "react";
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
      className="relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors"
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
          className="flex cursor-pointer items-center gap-2 text-left font-medium text-white"
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
  const { promptOpen, gpc, decide, record, closePrompt } = useConsent();
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

  // Slide-up + fade-in entrance. `entered` starts false (sheet sits below the
  // fold) and flips true after a delay so the CSS transition runs. The first
  // appearance waits ~1.5s to "settle in" after page load like typical CMPs; a
  // footer re-open animates near-instantly. Honors reduced-motion via the
  // `motion-reduce:*` classes on the sheet.
  const FIRST_LOAD_DELAY_MS = 1500;
  const REOPEN_DELAY_MS = 60;
  const [entered, setEntered] = useState(false);
  const hasAnimatedOnce = useRef(false);
  useEffect(() => {
    if (!promptOpen) {
      setEntered(false);
      return;
    }
    const delay = hasAnimatedOnce.current ? REOPEN_DELAY_MS : FIRST_LOAD_DELAY_MS;
    hasAnimatedOnce.current = true;
    const t = window.setTimeout(() => setEntered(true), delay);
    return () => window.clearTimeout(t);
  }, [promptOpen]);

  if (!promptOpen) return null;

  const setCategory = (key: OptionalCategory, next: boolean) =>
    setSelection((prev) => ({ ...prev, [key]: next }));

  // Height / font-size / padding live in globals.css under
  // `.cs-consent-actions .cs-btn-blue.cs-consent-btn`: 36px on desktop (the
  // header utility size), 44px / 16px on mobile. They cannot be set inline
  // here — the site-wide mobile clamp on `.cs-btn-blue` is `!important`, so
  // only a higher-specificity rule beats it.
  const actionBtn = "cs-btn-blue cs-consent-btn";

  return (
    <div
      // biome-ignore lint/a11y/useSemanticElements: intentionally a non-modal
      // bottom sheet — native <dialog> forces modal semantics that §11 forbids
      // (centered/blocking interstitials trigger Google ranking penalties).
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      className={`fixed inset-x-0 bottom-0 z-[60] transform-gpu border-t border-white/10 bg-[#131a2e] text-white shadow-[0_-8px_30px_rgba(0,0,0,0.35)] transition duration-500 ease-out will-change-transform motion-reduce:transition-none ${
        entered ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="relative mx-auto flex max-h-[100dvh] w-full max-w-[1100px] flex-col px-6 pt-4 pb-8 lg:pt-5">
        <button
          type="button"
          onClick={closePrompt}
          aria-label="Close"
          // 44px hit area on mobile (WCAG 2.5.8 AA); the desktop chip stays 32px
          // so the hover background does not grow on pointer devices. The icon
          // size is unchanged at both breakpoints.
          className="absolute right-4 top-3 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-white/60 transition hover:bg-white/10 hover:text-white lg:h-8 lg:w-8"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        {/* Scrollable body — the cookie copy plus the optional preference
            panel. The sheet is capped at 100dvh and only this region scrolls,
            so the action row below always stays reachable on short viewports
            (mobile landscape, zoomed displays). `min-h-0` lets a flex child
            shrink below its content so the overflow actually scrolls. */}
        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
          <p
            // pr-10 clears the 44px mobile close button (inset 16px + 44px wide
            // = 60px from the sheet edge, less the 24px px-6 gutter).
            className="pr-10 text-white/80 lg:pr-8"
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
            {/* Deep-links to the "Information We Collect Automatically" section.
                The id is the slugified heading text (RenderLexical derives heading
                ids this way); keep it in sync if that CMS heading is renamed. */}
            <Link
              href="/privacy-policy#6-information-we-collect-automatically"
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
              <div className="rounded-lg bg-white/[0.03] px-4">
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
        </div>

        {/* Pinned action row — never scrolls (the body above does), so it is
            always the last visible element. Contents switch by state so no
            button is ever duplicated. On mobile the collapsed row stays on ONE
            line: the text-link "Cookies Settings" sits left, the two primary
            buttons group right (justify-between); from sm+ everything
            right-aligns. The sheet's `pb-8` lifts this row clear of fixed
            browser-extension toolbars (SEO bars, etc.) that shift the document
            root and re-anchor this fixed sheet a toolbar-height below the
            viewport.
            At the 44px/16px mobile touch size the collapsed row no longer fits
            on one line at 360-390px, so it wraps: the text link takes the first
            line and the two primary buttons stay grouped on the second. From
            sm+ it is back to a single right-aligned line. */}
        <div
          className={`cs-consent-actions mt-3 flex shrink-0 flex-wrap items-center gap-x-2 gap-y-3 sm:mt-4 sm:flex-nowrap sm:gap-x-3 ${
            showPrefs ? "justify-end" : "justify-between sm:justify-end"
          }`}
        >
          {showPrefs ? (
            <>
              <button type="button" onClick={() => decide("reject_all")} className={actionBtn}>
                Reject All
              </button>
              <button
                type="button"
                onClick={() => decide("custom", { selection })}
                className={actionBtn}
              >
                Confirm My Choices
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowPrefs(true)}
                /* `before:` lifts the touch target without moving the underline
                   or the row: the 16px label alone renders ~24px, so -inset-y-2.5
                   takes it to 44px (WCAG 2.5.8 AA). Padding would reflow the flex
                   row it shares with the two primary buttons. Desktop keeps the
                   14px label and the original 29px target. */
                className="relative cursor-pointer whitespace-nowrap text-base font-medium text-white/80 underline underline-offset-4 transition hover:text-white before:absolute before:inset-x-0 before:-inset-y-2.5 before:content-[''] lg:text-sm lg:before:-inset-y-1"
                aria-expanded={showPrefs}
              >
                Cookies Settings
              </button>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <button type="button" onClick={() => decide("reject_all")} className={actionBtn}>
                  Reject All
                </button>
                <button type="button" onClick={() => decide("accept_all")} className={actionBtn}>
                  Allow All
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
