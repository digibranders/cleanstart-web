"use client";

import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { COMPARE_FAQS, FAQ_HEADING, type CompareFaq } from "./compare-data";
import { RULE } from "./compare-editorial";

/**
 * Comparison FAQ.
 *
 * One column of rule-separated rows on the page background — no card, no second
 * column. An accordion is the right affordance here (seven long answers, one
 * question at a time) and it is the page's only interactive element, so it does
 * not need a container to announce itself.
 *
 * Last section before the footer, so it reserves `--spacing-section-cta` of
 * bottom padding for the footer's overlapping CTA card.
 */
export function CompareFAQ(): React.ReactElement {
  const [openId, setOpenId] = useState<string | null>(null);

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
        <Reveal header>
          <div aria-hidden style={{ borderTop: RULE }} className="mb-7 w-full md:mb-9" />
          <h2
            id="compare-faq-title"
            className="font-display text-[#111111]"
            style={{
              fontSize: "var(--fs-h2)",
              fontWeight: 600,
              letterSpacing: "var(--fs-h2-ls)",
              lineHeight: "var(--fs-h2-lh)",
              marginBottom: "clamp(24px, 2.4vw, 44px)",
            }}
          >
            {FAQ_HEADING}
          </h2>
        </Reveal>

        <div className="max-w-[860px]">
          {COMPARE_FAQS.map((faq) => (
            <FaqRow
              key={faq.id}
              item={faq}
              isOpen={openId === faq.id}
              onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqRow({
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
    <div style={{ borderTop: RULE }}>
      <h3 className="m-0">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={answerId}
          // The rows have no container to carry a focus ring, so the outline is
          // drawn as an inset offset ring on the button itself. Never removed —
          // these seven buttons are the page's only keyboard-operable controls.
          // `outline-none` zeroes outline-style, so the focus rule has to restore
          // it explicitly — `outline-2` only sets the width and would render
          // nothing on its own.
          className="group flex w-full cursor-pointer items-start justify-between gap-8 rounded-[10px] text-left outline-none focus-visible:[outline-style:solid] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3960F9]"
          style={{
            paddingTop: "clamp(18px, 1.7vw, 26px)",
            paddingBottom: "clamp(18px, 1.7vw, 26px)",
          }}
        >
          <span
            className="flex-1 font-display text-[#111111] transition-opacity duration-200 group-hover:opacity-70"
            style={{
              fontSize: "var(--fs-h4)",
              fontWeight: 600,
              lineHeight: 1.3,
              letterSpacing: "-0.02em",
            }}
          >
            {item.question}
          </span>
          <ToggleIcon isOpen={isOpen} />
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
            className="text-[#3A3A3A]"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-body)",
              fontWeight: 400,
              lineHeight: 1.65,
              letterSpacing: "-0.01em",
              maxWidth: "68ch",
              textWrap: "pretty",
              paddingBottom: "clamp(20px, 1.9vw, 30px)",
            }}
          >
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Hairline plus/minus — matches the page's rule weight rather than adding a chip. */
function ToggleIcon({ isOpen }: { isOpen: boolean }): React.ReactElement {
  return (
    <span
      aria-hidden
      className="relative mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center"
      style={{
        transition: "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
        transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M1 8h14" stroke="#111111" strokeWidth="1.4" strokeLinecap="round" />
        <path
          d="M8 1v14"
          stroke="#111111"
          strokeWidth="1.4"
          strokeLinecap="round"
          style={{
            opacity: isOpen ? 0 : 1,
            transition: "opacity 200ms ease-out",
          }}
        />
      </svg>
    </span>
  );
}
