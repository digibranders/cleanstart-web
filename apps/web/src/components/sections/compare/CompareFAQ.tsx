"use client";

import { useId, useState } from "react";
import { Section, Container } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";
import { FAQS, FAQ_HEADING, UI, type CompareFaq } from "./compare-data";
import { BRAND } from "./compare-visuals";

/**
 * The eight questions from the document, as a single-open accordion.
 *
 * The questions are `<h3>` inside the section's H2. The document does not style
 * them as headings, but an accordion whose trigger is not in a heading gives
 * screen-reader users no way to walk the list, and `<h3>` here nests under the
 * FAQ H2 without adding a level the document does not already have.
 *
 * Answers stay in the DOM when collapsed (`hidden` on a wrapper, height
 * animated by a grid row) so the text is in the page source for crawlers and
 * matches the FAQPage JSON-LD the route emits.
 */

function Row({
  faq,
  open,
  onToggle,
  index,
}: {
  faq: CompareFaq;
  open: boolean;
  onToggle: () => void;
  index: number;
}): React.ReactElement {
  const panelId = `compare-faq-panel-${faq.id}`;
  const buttonId = `compare-faq-trigger-${faq.id}`;

  return (
    <li
      className="overflow-hidden transition-colors"
      style={{
        borderRadius: "18px",
        border: `1px solid ${open ? "rgba(106,61,240,0.28)" : "rgba(17,17,17,0.09)"}`,
        background: open
          ? "linear-gradient(150deg, #ffffff 0%, #FBF7FF 100%)"
          : "#ffffff",
        boxShadow: open
          ? "0 18px 40px -28px rgba(70,30,190,0.35)"
          : "0 1px 2px rgba(17,17,17,0.03)",
      }}
    >
      <h3>
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-start gap-4 px-5 py-5 text-left sm:px-6"
        >
          <span
            aria-hidden
            className="mt-[3px] shrink-0"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              letterSpacing: "0.04em",
              color: open ? BRAND.violet : "rgba(17,17,17,0.3)",
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>

          <span
            className="flex-1 font-display"
            style={{
              fontSize: "var(--fs-h5)",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              lineHeight: 1.4,
              color: "#111111",
            }}
          >
            {faq.question}
          </span>

          <span
            aria-hidden
            className="mt-[2px] inline-flex size-7 shrink-0 items-center justify-center rounded-full transition-colors"
            style={{
              background: open ? BRAND.violet : "rgba(17,17,17,0.05)",
              color: open ? "#ffffff" : "rgba(17,17,17,0.55)",
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 14 14"
              fill="none"
              className="transition-transform duration-300"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <path
                d="M3.5 5.25 7 8.75l3.5-3.5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      </h3>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <section id={panelId} aria-labelledby={buttonId}>
            <p
              className="px-5 pb-6 pl-[52px] sm:px-6 sm:pb-7 sm:pl-[60px]"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-body)",
                lineHeight: "var(--fs-body-lh)",
                color: "rgba(17,17,17,0.68)",
              }}
            >
              {faq.answer}
            </p>
          </section>
        </div>
      </div>
    </li>
  );
}

export function CompareFAQ(): React.ReactElement {
  const [openId, setOpenId] = useState<string | null>(FAQS[0].id);
  const headingId = useId();

  return (
    // `padding="none"` with an explicit bottom: this is the last section, so it
    // owes the footer one CTA-card half of its own background to overlap (see
    // the layout contract in Footer.tsx).
    <Section
      padding="none"
      data-section="CompareFAQ"
      className="bg-white pt-[var(--spacing-section-lg)] pb-[var(--spacing-section-cta)]"
      aria-labelledby={headingId}
    >
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-16">
          <div className="lg:sticky lg:top-[calc(var(--cs-header-h)+40px)] lg:self-start">
            <Reveal header>
              <h2
                id={headingId}
                className="font-display text-[#111111]"
                style={{
                  fontSize: "var(--fs-h2)",
                  fontWeight: 600,
                  letterSpacing: "var(--fs-h2-ls)",
                  lineHeight: "var(--fs-h2-lh)",
                }}
              >
                {FAQ_HEADING}
              </h2>
              <p
                className="mt-4 max-w-[42ch]"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-body)",
                  lineHeight: "var(--fs-body-lh)",
                  color: "rgba(17,17,17,0.6)",
                }}
              >
                {UI.faqIntro}
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.1} y={24}>
            <ul className="flex flex-col gap-3">
              {FAQS.map((faq, index) => (
                <Row
                  key={faq.id}
                  faq={faq}
                  index={index}
                  open={openId === faq.id}
                  onToggle={() =>
                    setOpenId((current) => (current === faq.id ? null : faq.id))
                  }
                />
              ))}
            </ul>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
