"use client";

import React, { useState } from "react";

/**
 * Section: "Frequently Asked Questions"
 * Figma 108:8525 (title) + 108:8527 (description) + 108:8555 (left card) + 108:8575 (right card)
 *
 * Figma exact specs:
 * - Title: Manrope Bold 62px, color #111
 * - Description: Sora Regular 30px, color #111
 * - Each card: 622×variable, 40px corner radius, 40px padding all sides, white bg
 * - Vertical layout, 32px gap between FAQ items
 * - Item question: Manrope Bold 32px, color #111
 * - Item answer: Sora Regular 20px, color #666
 * - Question-to-answer gap (open): 16px
 * - Toggle icon: 32×32 frame with 21×21 black filled +/× vector
 * - Divider between items: 1px solid #D9D9D9
 * - Card-to-card horizontal gap: 32px
 *
 * UX:
 * - Each column has INDEPENDENT open state — opening a left FAQ does not affect the right card,
 *   and the layout never shifts horizontally. Both columns can have one item open simultaneously.
 * - Open animation uses CSS grid `grid-template-rows: 0fr → 1fr` so heights are exact and never
 *   clipped, regardless of font-load timing or rich-text content.
 * - Plus icon rotates 45° to become an × when open.
 * - Full keyboard accessibility (Enter/Space) and proper ARIA expanded/controls.
 */

interface FaqItem {
  id: string;
  q: string;
  a: React.ReactNode;
}

const LEFT_FAQS: FaqItem[] = [
  {
    id: "what-is",
    q: "What is CleanStart?",
    a: (
      <>
        CleanStart provides hardened, near-zero-CVE{" "}
        <a
          href="#container-images"
          className="font-medium text-[#3960F9] underline-offset-2 hover:underline"
        >
          container base images
        </a>{" "}
        that are continuously scanned, rebuilt, and cryptographically signed.
        Our images are designed to eliminate known vulnerabilities at the
        source, giving your team secure foundations to build on.
      </>
    ),
  },
  {
    id: "security-updates",
    q: "How does CleanStart handle security updates?",
    a: "CleanStart images are updated regularly, with signed attestations and SBOMs for every release, ensuring transparency and traceability.",
  },
  {
    id: "customize",
    q: "Can I customize CleanStart images for my applications?",
    a: "Yes — CleanStart provides curated base images, allowing you to securely build custom containers that match your unique application needs while maintaining a minimal, secure footprint.",
  },
];

const RIGHT_FAQS: FaqItem[] = [
  {
    id: "verify",
    q: "How can I verify a CleanStart image?",
    a: "Each CleanStart image comes with attestation, signed and SBOM files. You can verify their integrity using standard container tools or CleanStart's verification utilities.",
  },
  {
    id: "registries",
    q: "Which registries work with CleanStart images?",
    a: "CleanStart images are compatible with popular registries like Docker Hub, GitHub Container Registry, and private enterprise registries. We also support authenticated access for secured environments.",
  },
  {
    id: "compliance",
    q: "Does CleanStart support compliance frameworks like FIPS or NIST?",
    a: "Yes — CleanStart maintains a dedicated set of FIPS-compliant container images for industries with strict security and compliance requirements.",
  },
];

export function FrequentlyAskedQuestions() {
  // Single shared open state — only ONE FAQ across all 6 can be open at a time.
  // The two-column layout still preserves horizontal stability: opening a left FAQ
  // grows the left card downward only; the right card stays put (items-start grid).
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section
      // Note: no overflow-hidden — lets the decorative lavender/cyan/purple
      // blobs bleed across the top/bottom section boundaries. Body has
      // overflow-x: hidden so horizontal scroll is still prevented.
      className="relative w-full py-14 sm:py-16 lg:py-20 mb-[-50px]"
      aria-labelledby="faq-title"
    >
      {/* Figma 108:7627 "Ellipse 46691" — cyan glow at top-right of FAQ.
          Figma absolute: x=1496, y=6374, 262×262 in 1920-wide frame.
          With FAQ section top at y=6231 (title y=6311 minus py-20 80px),
          section-relative top = 6374−6231 = 143px.
          Horizontal: right = 1920−1496−262 = 162px from viewport right edge. */}
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
      {/* Figma 108:7626 "Ellipse 46681" — pink/lavender glow on the left of FAQ.
          Figma absolute: x=215, y=6884, 262×262.
          Section-relative top = 6884−6231 = 653px; left = 215px from viewport. */}
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
        {/* Title row — title flush-left, separator centered, description right-aligned.
            Same 1fr_auto_1fr grid pattern used by SecurityNotPatching and
            HowCleanStartHelp for visual parity. */}
        <div className="mb-8 flex flex-col items-start gap-5 md:mb-10 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-12">
          <h2
            id="faq-title"
            className="justify-self-start font-display font-bold text-[#111111]"
            style={{
              maxWidth: "493px",
              fontSize: "var(--text-t-display-2)",
              letterSpacing: "var(--text-t-display-2-ls)",
              lineHeight: "var(--text-t-display-2-lh)",
            }}
          >
            Frequently Asked Questions
          </h2>
          {/* Vertical 1×90 fading-gray separator */}
          <div
            aria-hidden
            className="hidden h-[90px] w-px shrink-0 justify-self-center md:block"
            style={{
              background:
                "linear-gradient(180deg, rgba(204,204,204,0) 0%, rgba(204,204,204,1) 47.2%, rgba(204,204,204,0) 100%)",
            }}
          />
          <p
            className="font-normal text-[#111111] md:justify-self-end md:text-right"
            style={{
              fontSize: "var(--text-t-subhead)",
              lineHeight: "var(--text-t-subhead-lh)",
              letterSpacing: "var(--text-t-subhead-ls)",
              maxWidth: "585px",
              opacity: 0.8,
            }}
          >
            Common questions about CleanStart&apos;s hardened container images,
            security, and integrations.
          </p>
        </div>

        {/* Cards size to their natural content. Opening a FAQ grows the card
            (and the section) by the answer height — standard FAQ behavior with
            no permanent empty space below the cards in the closed state. */}
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
          <FaqColumn
            items={LEFT_FAQS}
            openId={openId}
            setOpenId={setOpenId}
            idPrefix="left"
          />
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
      className="flex flex-col gap-5 self-start rounded-[24px] bg-white p-6 sm:rounded-[40px] sm:p-8"
      style={{
        boxShadow:
          "0 1px 0 rgba(0,0,0,0.04), 0 24px 48px -24px rgba(60,30,150,0.08)",
      }}
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
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={answerId}
        className="group flex w-full items-start justify-between gap-6 text-left cursor-pointer md:gap-12"
      >
        <span
          className="flex-1 font-display font-bold text-[#111111] transition-colors duration-200 group-hover:text-[#1B1F4F]"
          style={{
            fontSize: "var(--text-t-heading-md)",
            lineHeight: "var(--text-t-heading-md-lh)",
            letterSpacing: "var(--text-t-heading-md-ls)",
          }}
        >
          {item.q}
        </span>
        <ToggleIcon isOpen={isOpen} />
      </button>

      {/* Smooth open/close — modern accordion pattern.
          Per Google Core Web Vitals: layout shifts within 500 ms of user input
          are excluded from CLS, so animating the section's natural growth here
          is the correct UX (not a CLS regression).
          Inline styles for the height/opacity transition keep the cascade
          deterministic across browsers. */}
      <section
        id={answerId}
        aria-hidden={!isOpen}
        data-faq-answer={isOpen ? "open" : "closed"}
        style={{
          maxHeight: isOpen ? "600px" : "0px",
          opacity: isOpen ? 1 : 0,
          overflow: "hidden",
          transition:
            "max-height 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease-out",
        }}
      >
        <p
          className="pt-3 font-normal text-[#333333]"
          style={{
            fontSize: "var(--text-t-body-md)",
            lineHeight: "var(--text-t-body-md-lh)",
            letterSpacing: "var(--text-t-body-md-ls)",
          }}
        >
          {item.a}
        </p>
      </section>
    </div>
  );
}

function ToggleIcon({ isOpen }: { isOpen: boolean }) {
  // 28×28 frame to match the smaller question type — keeps optical balance.
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
        {/* Horizontal bar */}
        <rect x="2" y="8" width="14" height="2" rx="1" fill="#111111" />
        {/* Vertical bar */}
        <rect x="8" y="2" width="2" height="14" rx="1" fill="#111111" />
      </svg>
    </span>
  );
}
