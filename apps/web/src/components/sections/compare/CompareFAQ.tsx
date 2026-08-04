"use client";

import { useState } from "react";
import Link from "next/link";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/Reveal";
import { COMPARE_FAQS, FAQ_HEADING, type CompareFaq } from "./compare-data";

/**
 * Comparison FAQ — Balanced 2-Column Split:
 *  - Left: Heading, intro copy, and quick support/demo callout card.
 *  - Right: Sleek accordion cards with smooth grid-height transitions and glowing purple toggle discs.
 */
export function CompareFAQ(): React.ReactElement {
  const [openId, setOpenId] = useState<string | null>(COMPARE_FAQS[0]?.id ?? null);

  return (
    <section
      data-section="CompareFAQ"
      className="relative w-full bg-white"
      style={{
        paddingTop: "var(--spacing-section-md)",
        paddingBottom: "var(--spacing-section-cta)",
      }}
      aria-labelledby="compare-faq-title"
    >
      <div className="relative mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start lg:gap-16">
          {/* Left Column: Heading & Help Callout */}
          <div className="lg:sticky lg:top-32">
            <Reveal header>
              <h2
                id="compare-faq-title"
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
                className="mt-4 text-[#555555]"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-body)",
                  lineHeight: 1.6,
                  letterSpacing: "-0.01em",
                }}
              >
                Everything you need to know about container image security, provenance, reproducible builds, and compliance.
              </p>
            </Reveal>

            {/* Quick Demo Callout Box */}
            <Reveal delay={0.12} className="mt-8">
              <div className="relative overflow-hidden rounded-2xl border border-purple-200/80 bg-gradient-to-br from-purple-50/70 via-indigo-50/30 to-white p-6 shadow-sm">
                {/* A UI callout, not part of the document outline. */}
                <p className="font-display text-base font-semibold text-[#111111]">
                  Have more questions?
                </p>
                <p className="mt-2 text-sm text-[#4B5563]" style={{ fontFamily: "var(--font-sans)" }}>
                  Speak directly with our security engineering team to explore CleanStart for your supply chain.
                </p>
                <Link
                  href="/book-a-demo"
                  className="mt-4 inline-flex items-center gap-2 font-sans text-xs font-bold text-purple-700 hover:text-purple-900 transition-colors"
                >
                  <span>Book a Technical Demo</span>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Right Column: Interactive Accordion Cards */}
          <div>
            <RevealStagger className="flex flex-col gap-4">
              {COMPARE_FAQS.map((faq) => (
                <RevealItem key={faq.id}>
                  <FaqCard
                    item={faq}
                    isOpen={openId === faq.id}
                    onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
                  />
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqCard({
  item,
  isOpen,
  onToggle,
}: {
  item: CompareFaq;
  isOpen: boolean;
  onToggle: () => void;
}): React.ReactElement {
  const answerId = `compare-faq-answer-${item.id}`;
  return (
    <div
      className="group rounded-2xl border transition-all duration-300"
      style={{
        borderColor: isOpen ? "rgba(109, 40, 217, 0.4)" : "rgba(17, 17, 17, 0.11)",
        background: isOpen
          ? "linear-gradient(180deg, rgba(245, 243, 255, 0.6) 0%, #ffffff 100%)"
          : "#ffffff",
        boxShadow: isOpen ? "0 10px 28px -14px rgba(109, 40, 217, 0.18)" : "none",
      }}
    >
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={answerId}
          className="flex w-full cursor-pointer items-center justify-between gap-6 p-5 sm:p-6 text-left outline-none focus-visible:[outline-style:solid] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d28d9] rounded-2xl"
        >
          <span
            className="flex-1 font-display text-[#111111] font-semibold"
            style={{
              fontSize: "var(--fs-h4)",
              lineHeight: 1.35,
              letterSpacing: "-0.02em",
            }}
          >
            {item.question}
          </span>
          <ToggleDisc isOpen={isOpen} />
        </button>
      </h3>

      <div
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
            className="px-5 pb-5 sm:px-6 sm:pb-6 text-[#374151]"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-body)",
              fontWeight: 400,
              lineHeight: 1.65,
              letterSpacing: "-0.01em",
              maxWidth: "68ch",
              textWrap: "pretty",
            }}
          >
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Glowing purple toggle disc. */
function ToggleDisc({ isOpen }: { isOpen: boolean }): React.ReactElement {
  return (
    <span
      aria-hidden
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300"
      style={{
        background: isOpen ? "#6d28d9" : "rgba(17, 17, 17, 0.05)",
        color: isOpen ? "#ffffff" : "#111111",
        boxShadow: isOpen ? "0 4px 12px rgba(109, 40, 217, 0.3)" : "none",
        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path
          d={isOpen ? "M3 8h10" : "M8 3v10M3 8h10"}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

