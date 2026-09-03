"use client";

import React, { useState } from "react";
import { Section, Container } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";
import { FAQS, FAQ_HEADING, type CompareFaq } from "./compare-data";

/**
 * The eight questions from the document, in the home page's FAQ chrome: two
 * white cards side by side, hairline dividers, plus-to-cross toggles, one
 * item open at a time across both columns.
 *
 * The questions are `<h3>` inside the section's H2. The document does not
 * style them as headings, but an accordion whose trigger is not in a heading
 * gives screen-reader users no way to walk the list, and `<h3>` here nests
 * under the FAQ H2 without adding a level the document does not already have.
 *
 * Answers stay in the DOM when collapsed (height animated by a grid row) so
 * the text is in the page source for crawlers and matches the FAQPage JSON-LD
 * the route emits.
 */

const CARD =
  "flex flex-col gap-5 self-start max-md:rounded-none max-md:bg-transparent max-md:p-0 max-md:shadow-none md:rounded-[40px] md:bg-white md:p-8 md:shadow-[0_1px_0_rgba(0,0,0,0.04),_0_24px_48px_-24px_rgba(60,30,150,0.08)]";

function ToggleIcon({ open }: { open: boolean }): React.ReactElement {
  return (
    <span
      aria-hidden
      className="relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center"
      style={{
        transition: "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
        transform: open ? "rotate(45deg)" : "rotate(0deg)",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="8" width="14" height="2" rx="1" fill="#111111" />
        <rect x="8" y="2" width="2" height="14" rx="1" fill="#111111" />
      </svg>
    </span>
  );
}

function Row({
  faq,
  open,
  onToggle,
}: {
  faq: CompareFaq;
  open: boolean;
  onToggle: () => void;
}): React.ReactElement {
  const panelId = `compare-faq-panel-${faq.id}`;
  const buttonId = `compare-faq-trigger-${faq.id}`;

  return (
    <div>
      <h3 className="m-0">
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="group flex w-full cursor-pointer items-start justify-between gap-6 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33BAEC] md:gap-10"
        >
          <span
            className="flex-1 font-display text-[#111111] transition-colors duration-200 group-hover:text-[#1B1F4F]"
            style={{
              fontSize: "var(--fs-h4)",
              fontWeight: "var(--fs-h4-weight)",
              lineHeight: "var(--fs-h4-lh)",
              letterSpacing: "var(--fs-h4-ls)",
            }}
          >
            {faq.question}
          </span>
          <ToggleIcon open={open} />
        </button>
      </h3>

      <section
        id={panelId}
        aria-labelledby={buttonId}
        aria-hidden={!open}
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          opacity: open ? 1 : 0,
          transition:
            "grid-template-rows 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease-out",
        }}
      >
        <div style={{ overflow: "hidden", minHeight: 0 }}>
          <p
            className="pt-3 pr-10"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-body)",
              lineHeight: "var(--fs-body-lh)",
              letterSpacing: "var(--fs-body-ls)",
              color: "#333333",
            }}
          >
            {faq.answer}
          </p>
        </div>
      </section>
    </div>
  );
}

function Column({
  items,
  openId,
  onToggle,
}: {
  items: readonly CompareFaq[];
  openId: string | null;
  onToggle: (id: string) => void;
}): React.ReactElement {
  return (
    <div className={CARD}>
      {items.map((faq, i) => (
        <React.Fragment key={faq.id}>
          <Row faq={faq} open={openId === faq.id} onToggle={() => onToggle(faq.id)} />
          {i < items.length - 1 && (
            <div aria-hidden className="h-px w-full bg-[#D9D9D9]" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export function CompareFAQ(): React.ReactElement {
  const [openId, setOpenId] = useState<string | null>(FAQS[0].id);
  const half = Math.ceil(FAQS.length / 2);
  const left = FAQS.slice(0, half);
  const right = FAQS.slice(half);

  const toggle = (id: string): void =>
    setOpenId((current) => (current === id ? null : id));

  return (
    // `padding="none"` with an explicit bottom: this is the last section, so it
    // owes the footer one CTA-card half of its own background to overlap (see
    // the layout contract in Footer.tsx).
    <Section
      padding="none"
      data-section="CompareFAQ"
      className="relative bg-white pt-[var(--spacing-section-lg)] pb-[var(--spacing-section-cta)]"
      aria-labelledby="compare-faq-title"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{
          right: "162px",
          top: "143px",
          width: "262px",
          height: "262px",
          borderRadius: "262px",
          backgroundColor: "#2CC1EB",
          opacity: 0.18,
          filter: "blur(101.5px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{
          left: "215px",
          top: "560px",
          width: "262px",
          height: "262px",
          borderRadius: "262px",
          backgroundColor: "#DF9BFF",
          opacity: 0.45,
          filter: "blur(131.5px)",
        }}
      />

      <Container className="relative">
        <Reveal header style={{ maxWidth: "720px" }}>
          <h2
            id="compare-faq-title"
            className="font-display text-[#111111]"
            style={{
              fontSize: "var(--fs-h2)",
              fontWeight: "var(--fs-h2-weight)",
              letterSpacing: "var(--fs-h2-ls)",
              lineHeight: "var(--fs-h2-lh)",
            }}
          >
            {FAQ_HEADING}
          </h2>
        </Reveal>

        <Reveal delay={0.1} y={24} className="mt-8 md:mt-10">
          <div className="grid grid-cols-1 items-start gap-5 rounded-[24px] bg-white p-6 max-md:shadow-[0_1px_0_rgba(0,0,0,0.04),_0_24px_48px_-24px_rgba(60,30,150,0.08)] sm:rounded-[40px] sm:p-8 md:grid-cols-2 md:gap-6 md:rounded-none md:bg-transparent md:p-0 md:shadow-none">
            <Column items={left} openId={openId} onToggle={toggle} />
            <div aria-hidden className="h-px w-full bg-[#D9D9D9] md:hidden" />
            <Column items={right} openId={openId} onToggle={toggle} />
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
