import type React from "react";
import Image from "next/image";
import type { CaseStudyOutcome } from "@/lib/case-studies";
import type { CaseStudyQuote } from "./case-study-quote";

/**
 * The result card in the detail hero.
 *
 * This is the page's one deliberate piece of system continuity: the listing
 * hero draws an abstract stack of glass "case study" panels with charts and a
 * seal on them, and here the same card vocabulary shows up carrying the actual
 * customer, the actual figures, the actual quote. The illustration on the
 * listing is a promise; this is the thing it was promising.
 *
 * Three states, in priority order. Figures if the study publishes any
 * (`outcomes` on the collection), the customer's quote if not, and nothing at
 * all when neither exists — in which case the hero drops to a single centred
 * column rather than padding a card out with filler.
 */

const CARD_BASE: React.CSSProperties = {
  borderRadius: "28px",
  background:
    "linear-gradient(155deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.055) 46%, rgba(44,193,235,0.06) 100%), rgba(22,15,51,0.5)",
  border: "1px solid rgba(255,255,255,0.15)",
  boxShadow: "0 40px 80px -40px rgba(8,5,26,0.85)",
};

function Sheen(): React.ReactElement {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-8 top-0 h-px select-none"
      style={{
        background:
          "linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 38%, rgba(255,255,255,0.12) 72%, rgba(255,255,255,0) 100%)",
      }}
    />
  );
}

function CompanyRow({
  company,
  industry,
  logoSrc,
}: {
  company: string;
  industry: string;
  logoSrc?: string | undefined;
}): React.ReactElement {
  return (
    <div className="flex items-center gap-3.5">
      {logoSrc && (
        // Customer marks are drawn for light surfaces, so they get one rather
        // than being knocked out and losing the colour that identifies them.
        <div className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-white p-2">
          <Image
            src={logoSrc}
            alt=""
            aria-hidden
            width={40}
            height={40}
            sizes="40px"
            className="h-full w-full object-contain"
          />
        </div>
      )}
      <div className="min-w-0">
        <p
          className="truncate font-display font-semibold text-white"
          style={{ fontSize: "var(--fs-h5)", letterSpacing: "-0.02em" }}
        >
          {company}
        </p>
        {industry && (
          <p
            className="font-sans text-white/55"
            style={{ fontSize: "var(--fs-caption)", letterSpacing: "0.04em" }}
          >
            {industry.toUpperCase()}
          </p>
        )}
      </div>
    </div>
  );
}

function Hairline(): React.ReactElement {
  return (
    <div
      aria-hidden
      className="h-px w-full"
      style={{
        background:
          "linear-gradient(to right, rgba(255,255,255,0.16), rgba(255,255,255,0.05))",
      }}
    />
  );
}

export function CaseStudyResultCard({
  company,
  industry,
  logoSrc,
  outcomes,
  quote,
}: {
  company: string;
  industry: string;
  logoSrc?: string | undefined;
  outcomes?: readonly CaseStudyOutcome[] | undefined;
  quote?: CaseStudyQuote | undefined;
}): React.ReactElement | null {
  const hasOutcomes = Boolean(outcomes && outcomes.length > 0);
  if (!hasOutcomes && !quote) return null;

  return (
    <div className="relative overflow-hidden p-7 sm:p-8" style={CARD_BASE}>
      <Sheen />

      <CompanyRow company={company} industry={industry} logoSrc={logoSrc} />

      <div className="mt-7 flex flex-col gap-6">
        {hasOutcomes ? (
          <>
            {outcomes?.map((outcome, i) => (
              <div key={outcome.label} className="flex flex-col gap-6">
                {i > 0 && <Hairline />}
                <div>
                  <p
                    className="font-display font-semibold text-white"
                    style={{
                      fontSize: "var(--fs-h2)",
                      lineHeight: 1,
                      letterSpacing: "-0.04em",
                    }}
                  >
                    {outcome.value}
                  </p>
                  <p
                    className="mt-2 font-sans text-white/65"
                    style={{ fontSize: "var(--fs-body-sm)", lineHeight: 1.4 }}
                  >
                    {outcome.label}
                  </p>
                </div>
              </div>
            ))}
            <Hairline />
            <p
              className="font-sans text-white/40"
              style={{ fontSize: "var(--fs-caption)", lineHeight: 1.4 }}
            >
              Figures as published in the case study.
            </p>
          </>
        ) : (
          quote && (
            <figure className="flex flex-col gap-5">
              <Hairline />
              <blockquote
                className="font-display font-medium text-white"
                style={{
                  fontSize: "var(--fs-lead-sm)",
                  lineHeight: 1.4,
                  letterSpacing: "-0.02em",
                }}
              >
                &ldquo;{quote.text}&rdquo;
              </blockquote>
              {(quote.author || quote.role) && (
                <figcaption
                  className="font-sans text-white/60"
                  style={{ fontSize: "var(--fs-body-sm)", lineHeight: 1.5 }}
                >
                  {quote.author && (
                    <span className="font-medium text-white">{quote.author}</span>
                  )}
                  {quote.role && <span className="block">{quote.role}</span>}
                </figcaption>
              )}
            </figure>
          )
        )}
      </div>
    </div>
  );
}
