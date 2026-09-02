"use client";

import { useId, useState } from "react";
import { Section, Container } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";
import { FAQ_HEADING, FAQ_INTRO, FAQS, type ImpactFaq } from "./impact-content";

/*
 * Single-open accordion, the same recipe as the compare page's FAQ. Questions
 * are <h3> under the section H2 so screen-reader users can walk the list, and
 * answers stay in the DOM when collapsed so the page source carries the same
 * text as the FAQPage JSON-LD the route emits.
 */

const ACCENT = "#471ec0";

function Row({ faq, open, onToggle, index }: { faq: ImpactFaq; open: boolean; onToggle: () => void; index: number }): React.ReactElement {
  const panelId = `impact-faq-panel-${faq.id}`;
  const buttonId = `impact-faq-trigger-${faq.id}`;

  return (
    <li
      className="overflow-hidden transition-colors"
      style={{
        borderRadius: "14px",
        border: `1px solid ${open ? "rgba(71,30,192,0.28)" : "rgba(17,17,17,0.09)"}`,
        background: open ? "linear-gradient(150deg, #ffffff 0%, #F8F5FF 100%)" : "#ffffff",
        boxShadow: open ? "0 18px 40px -28px rgba(70,30,190,0.35)" : "0 1px 2px rgba(17,17,17,0.03)",
      }}
    >
      <h3>
        <button type="button" id={buttonId} aria-expanded={open} aria-controls={panelId} onClick={onToggle} className="flex w-full items-start gap-3 px-4 py-3.5 text-left sm:px-5">
          <span aria-hidden className="mt-[2px] shrink-0" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.04em", color: open ? ACCENT : "rgba(17,17,17,0.3)" }}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="flex-1 font-display" style={{ fontSize: "15.5px", fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.35, color: "#111111" }}>
            {faq.question}
          </span>
          <span aria-hidden className="inline-flex size-6 shrink-0 items-center justify-center rounded-full transition-colors" style={{ background: open ? ACCENT : "rgba(17,17,17,0.05)", color: open ? "#ffffff" : "rgba(17,17,17,0.55)" }}>
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" className="transition-transform duration-300" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
              <path d="M3.5 5.25 7 8.75l3.5-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      </h3>

      <div className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          <section id={panelId} aria-labelledby={buttonId}>
            <p className="px-4 pb-4 pl-[44px] sm:px-5 sm:pb-5 sm:pl-[52px]" style={{ fontFamily: "var(--font-sans)", fontSize: "14px", lineHeight: 1.55, color: "rgba(17,17,17,0.68)", maxWidth: "62ch" }}>
              {faq.answer}
            </p>
          </section>
        </div>
      </div>
    </li>
  );
}

export function ImpactFAQ(): React.ReactElement {
  const [openId, setOpenId] = useState<string | null>(FAQS[0]?.id ?? null);
  const headingId = useId();

  return (
    // Last section before the footer, so it owes the footer one CTA-card half of
    // its own background to overlap (see the layout contract in Footer.tsx).
    <Section padding="none" data-section="ImpactFAQ" className="bg-white pt-[var(--spacing-section-sm)] pb-[var(--spacing-section-cta)]" aria-labelledby={headingId}>
      <Container>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14">
          <div className="lg:sticky lg:top-[calc(var(--cs-header-h)+40px)] lg:self-start">
            <Reveal header>
              <h2 id={headingId} className="font-display text-[#111111]" style={{ fontSize: "var(--fs-h3)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                {FAQ_HEADING}
              </h2>
              <p className="mt-3 max-w-[40ch]" style={{ fontFamily: "var(--font-sans)", fontSize: "14px", lineHeight: 1.55, color: "rgba(17,17,17,0.6)" }}>
                {FAQ_INTRO}
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.1} y={24}>
            <ul className="flex flex-col gap-2">
              {FAQS.map((faq, index) => (
                <Row key={faq.id} faq={faq} index={index} open={openId === faq.id} onToggle={() => setOpenId((current) => (current === faq.id ? null : faq.id))} />
              ))}
            </ul>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
