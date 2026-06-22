"use client";

import React, { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";
import { LEFT_FAQS, RIGHT_FAQS, type FaqItem } from "./home-faqs";

/**
 * Frequently Asked Questions section: two columns of toggleable FAQ items.
 *
 * Content lives in `home-faqs.tsx` (shared with the home page's FAQPage schema).
 * Only one item across all columns is open at a time, but the two-column
 * layout never shifts horizontally — opening a left FAQ grows the left card
 * downward only. The open animation uses CSS grid `grid-template-rows: 0fr ->
 * 1fr` so heights are exact and never clipped regardless of font-load timing
 * or rich-text content. Keyboard-accessible (Enter/Space) with proper ARIA.
 */

export function FrequentlyAskedQuestions({
  className,
}: {
  /**
   * Overrides the section's vertical spacing. Defaults to the home-page
   * treatment (asymmetric padding + `mb-[-50px]` footer overlap). Pages that
   * follow a `Section padding`-spaced block (e.g. contact-us, after
   * ContactOffices) pass a balanced value so top/bottom spacing matches.
   */
  className?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section
      // No overflow-hidden, so the decorative blobs can bleed across the
      // top/bottom section boundaries. Horizontal scroll is still prevented by
      // overflow-x: hidden on the body.
      className={cn(
        "relative w-full",
        className ?? "pt-8 pb-14 sm:pt-10 sm:pb-16 lg:pt-12 lg:pb-20 mb-[-50px]",
      )}
      aria-labelledby="faq-title"
    >
      {/* Cyan glow at the top-right of the FAQ section. */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          right: "162px",
          top: "143px",
          width: "262px",
          height: "262px",
          borderRadius: "262px",
          backgroundColor: "#2CC1EB",
          opacity: 0.2,
          filter: "blur(101.5px)",
        }}
      />
      {/* Pink/lavender glow on the left of the FAQ section. */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "215px",
          top: "653px",
          width: "262px",
          height: "262px",
          borderRadius: "262px",
          backgroundColor: "#DF9BFF",
          opacity: 0.5,
          filter: "blur(131.5px)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10">
        <div className="mb-8 flex flex-col items-start md:mb-10">
          <Reveal header style={{ maxWidth: "720px" }}>
            <h2
              id="faq-title"
              className="font-display text-[#111111]"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
              }}
            >
              Frequently Asked Questions
            </h2>
          </Reveal>
        </div>

        {/* On mobile the outer grid hosts the white card chrome and the two
            columns share a single continuous list; at md+ each column is its
            own card. */}
        <div
          className="grid grid-cols-1 items-start gap-5 rounded-[24px] bg-white p-6 max-md:shadow-[0_1px_0_rgba(0,0,0,0.04),_0_24px_48px_-24px_rgba(60,30,150,0.08)] sm:rounded-[40px] sm:p-8 md:grid-cols-2 md:gap-6 md:rounded-none md:bg-transparent md:p-0 md:shadow-none"
        >
          <FaqColumn
            items={LEFT_FAQS}
            openId={openId}
            setOpenId={setOpenId}
            idPrefix="left"
          />
          <div aria-hidden className="h-px w-full bg-[#D9D9D9] md:hidden" />
          <FaqColumn
            items={RIGHT_FAQS}
            openId={openId}
            setOpenId={setOpenId}
            idPrefix="right"
          />
        </div>
      </div>
    </section>
  );
}

function FaqColumn({
  items,
  openId,
  setOpenId,
  idPrefix,
}: {
  items: FaqItem[];
  openId: string | null;
  setOpenId: (id: string | null) => void;
  idPrefix: string;
}) {
  return (
    <div
      className="flex flex-col gap-5 self-start max-md:rounded-none max-md:bg-transparent max-md:p-0 max-md:shadow-none md:rounded-[40px] md:bg-white md:p-8 md:shadow-[0_1px_0_rgba(0,0,0,0.04),_0_24px_48px_-24px_rgba(60,30,150,0.08)]"
    >
      {items.map((item, i) => (
        <React.Fragment key={item.id}>
          <FaqItemRow
            item={item}
            isOpen={openId === item.id}
            onToggle={() => setOpenId(openId === item.id ? null : item.id)}
            idPrefix={idPrefix}
          />
          {i < items.length - 1 && (
            <div aria-hidden className="h-px w-full bg-[#D9D9D9]" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function FaqItemRow({
  item,
  isOpen,
  onToggle,
  idPrefix,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
  idPrefix: string;
}) {
  const answerId = `faq-answer-${idPrefix}-${item.id}`;
  return (
    <div>
      {/* APG accordion pattern: the trigger button is wrapped in a heading so
          each question is a real H3 (one level under the section's <h2>),
          navigable by screen-reader heading shortcuts. The <h3> is a transparent
          wrapper — preflight zeroes its margin and it has no direct text, so the
          inner span's styling is unchanged. */}
      <h3 className="m-0">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={answerId}
          className="group flex w-full items-start justify-between gap-6 text-left cursor-pointer md:gap-12"
        >
          <span
            className="flex-1 font-display text-[#111111] transition-colors duration-200 group-hover:text-[#1B1F4F]"
            style={{
              fontSize: "var(--fs-h3)",
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
            }}
          >
            {item.q}
          </span>
          <ToggleIcon isOpen={isOpen} />
        </button>
      </h3>

      {/* Animating the section's natural growth is not a CLS regression:
          layout shifts within 500ms of user input are excluded from CLS.
          Inline styles for the height/opacity transition keep the cascade
          deterministic across browsers. */}
      <section
        id={answerId}
        aria-hidden={!isOpen}
        data-faq-answer={isOpen ? "open" : "closed"}
        style={{
          display: "grid",
          gridTemplateRows: isOpen ? "1fr" : "0fr",
          opacity: isOpen ? 1 : 0,
          transition:
            "grid-template-rows 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease-out",
        }}
      >
        <div style={{ overflow: "hidden", minHeight: 0 }}>
          <p
            className="pt-3 text-[#333333]"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-body)",
              fontWeight: 400,
              lineHeight: 1.4,
              letterSpacing: "-0.02em",
            }}
          >
            {item.a}
          </p>
        </div>
      </section>
    </div>
  );
}

function ToggleIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <span
      className="relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center"
      aria-hidden
      style={{
        transition: "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="2" y="8" width="14" height="2" rx="1" fill="#111111" />
        <rect x="8" y="2" width="2" height="14" rx="1" fill="#111111" />
      </svg>
    </span>
  );
}
