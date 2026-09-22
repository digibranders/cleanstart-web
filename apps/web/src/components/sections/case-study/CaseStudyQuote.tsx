import type React from "react";
import { Container, Section } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";
import type { CaseStudyQuote as Quote } from "./case-study-quote";

/**
 * The customer's own words, given a band of their own.
 *
 * Rendered only when the hero's result card is already carrying figures — a
 * study with no numbers puts the quote in the card instead, and printing it
 * twice on one page would read as padding. So each study shows this once,
 * wherever it earns the most.
 */
export function CaseStudyQuote({ quote }: { quote: Quote }): React.ReactElement {
  return (
    <Section
      padding="md"
      data-section="CaseStudyQuote"
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #f4f1ff 0%, #f6f6f6 60%, #eef8fc 100%)" }}
      ariaLabel="In the customer's words"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{
          right: "-60px",
          top: "-80px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(223,155,255,0.35), transparent 70%)",
          filter: "blur(70px)",
        }}
      />

      <Container className="relative">
        <Reveal y={28}>
          <figure
            className="mx-auto flex flex-col items-center gap-8 text-center"
            style={{ maxWidth: "860px" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/home/quote-mark.svg"
              alt=""
              aria-hidden
              width={44}
              height={44}
              loading="lazy"
              decoding="async"
              className="size-11 rotate-180 select-none opacity-70"
            />

            <blockquote
              className="font-display font-medium text-[#111]"
              style={{
                fontSize: "var(--prose-pull-quote)",
                lineHeight: 1.4,
                letterSpacing: "-0.025em",
                textWrap: "balance",
              }}
            >
              &ldquo;{quote.text}&rdquo;
            </blockquote>

            {(quote.author || quote.role) && (
              <figcaption className="text-center">
                {quote.author && (
                  <p
                    className="font-sans font-semibold text-[#111]"
                    style={{ fontSize: "var(--fs-body)" }}
                  >
                    {quote.author}
                  </p>
                )}
                {quote.role && (
                  <p
                    className="font-sans text-[#666]"
                    style={{ fontSize: "var(--fs-body-sm)" }}
                  >
                    {quote.role}
                  </p>
                )}
              </figcaption>
            )}
          </figure>
        </Reveal>
      </Container>
    </Section>
  );
}
