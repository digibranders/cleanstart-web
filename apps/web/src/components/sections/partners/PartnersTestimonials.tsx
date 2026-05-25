"use client";

import { useState } from "react";
import { Container, Section } from "@/components/layout";

interface Quote {
  name: string;
  role: string;
  body: string;
}

const QUOTES: Quote[] = [
  {
    name: "Kevin R.",
    role: "CISO, TechCorp",
    body: "CleanStart has fundamentally changed our approach to developer security. We've reduced vulnerabilities by 90% by following community-driven standards.",
  },
  {
    name: "Kevin R.",
    role: "CISO, TechCorp",
    body: "CleanStart has fundamentally changed our approach to developer security. We've reduced vulnerabilities by 90% by following community-driven standards.",
  },
];

export function PartnersTestimonials(): React.ReactElement {
  const [index, setIndex] = useState(0);
  const prev = () => setIndex((i) => (i - 1 + QUOTES.length) % QUOTES.length);
  const next = () => setIndex((i) => (i + 1) % QUOTES.length);

  return (
    <Section padding="lg" className="bg-white">
      <Container>
        <div className="flex items-start justify-between gap-6">
          <QuoteMark />
          <div className="flex items-center gap-3">
            <NavButton ariaLabel="Previous testimonial" onClick={prev}>
              <ChevronLeft />
            </NavButton>
            <NavButton ariaLabel="Next testimonial" onClick={next}>
              <ChevronRight />
            </NavButton>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[0, 1].map((offset) => {
            const q = QUOTES[(index + offset) % QUOTES.length];
            if (!q) return null;
            return <QuoteCard key={offset} quote={q} />;
          })}
        </div>
      </Container>
    </Section>
  );
}

function QuoteCard({ quote }: { quote: Quote }): React.ReactElement {
  return (
    <div
      className="flex flex-col gap-5 rounded-[14px] bg-white p-6"
      style={{
        border: "1px solid #E2E8F0",
        boxShadow: "0 12px 32px -24px rgba(60,30,150,0.18)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF1FF] text-[#2F49E5] font-semibold"
            aria-hidden
          >
            {quote.name.charAt(0)}
          </span>
          <div className="flex flex-col">
            <span
              className="font-display font-semibold text-[#0F123E]"
              style={{ fontSize: "var(--text-body-md)" }}
            >
              {quote.name}
            </span>
            <span className="text-[#64748B]" style={{ fontSize: "var(--text-body-xs)" }}>
              {quote.role}
            </span>
          </div>
        </div>
        <QuoteMark size={28} muted />
      </div>
      <p
        className="text-[#0F123E]"
        style={{ fontSize: "var(--text-body-md)", lineHeight: 1.55, fontWeight: 500 }}
      >
        &ldquo;{quote.body}&rdquo;
      </p>
    </div>
  );
}

function QuoteMark({ size = 40, muted = false }: { size?: number; muted?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <title>Quote</title>
      <path
        d="M9 22h-4v-7c0-3.5 2.5-7 7-7v3c-2 0-3.5 1.5-3.5 4H9v7Zm14 0h-4v-7c0-3.5 2.5-7 7-7v3c-2 0-3.5 1.5-3.5 4H23v7Z"
        fill={muted ? "#CBD5E1" : "#0F123E"}
      />
    </svg>
  );
}

function NavButton({
  children,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0F123E] hover:bg-[#F4F6FB] transition-colors"
      style={{ border: "1px solid #E2E8F0" }}
    >
      {children}
    </button>
  );
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" role="img" aria-hidden="true" focusable="false">
      <title>Previous</title>
      <path d="m10 3-5 5 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" role="img" aria-hidden="true" focusable="false">
      <title>Next</title>
      <path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
