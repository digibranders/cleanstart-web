import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { Container } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";

import { ABOUT_CLEANSTART } from "./content";
import { DARK_BAND, GradientTitle } from "./parts";

/**
 * The last block before the footer. Its bottom padding is the card-overlap
 * reservation the footer's CTA slot needs, painted by the same band so the card
 * sits on the violet gradient, as on the other pages.
 */
export function AboutCleanStart(): React.ReactElement {
  return (
    <section
      data-section="AboutCleanStart"
      className="relative w-full overflow-hidden text-white"
      style={{
        background: DARK_BAND,
        paddingTop: "clamp(56px, 6.25vw, 120px)",
        paddingBottom: "var(--spacing-section-cta)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/cleanstart-images/env-union-hex.svg"
        alt=""
        className="pointer-events-none absolute -left-40 -top-24 hidden w-[720px] max-w-none select-none opacity-30 lg:block"
        loading="lazy"
        decoding="async"
      />
      <Container className="relative z-[2]">
        <Reveal header>
          <GradientTitle text={ABOUT_CLEANSTART.heading} accent="CleanStart" />
        </Reveal>

        <Reveal y={24} delay={0.08}>
          <p
            className="mx-auto mt-8 max-w-[820px] text-center"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-lead-sm)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.82)",
            }}
          >
            {ABOUT_CLEANSTART.body}
          </p>

          <ul className="mx-auto mt-10 grid max-w-[860px] gap-4 sm:grid-cols-3">
            {ABOUT_CLEANSTART.products.map((product) => (
              <li key={product.href}>
                <Link
                  href={product.href}
                  className="cs-grad-border group relative flex items-center justify-between rounded-[20px] px-5 py-4 outline-offset-4 transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#33BAEC] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  style={{
                    background:
                      "linear-gradient(155deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.025) 48%, rgba(255,255,255,0.05) 100%)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--fs-h5)",
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {product.label}
                  <ArrowRight
                    aria-hidden
                    size={20}
                    strokeWidth={2}
                    className="text-[#4FD1F5] transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
                  />
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8 text-center">
            <a
              href={ABOUT_CLEANSTART.linkHref}
              className="inline-flex items-center gap-1.5 rounded-[8px] text-[#4FD1F5] underline-offset-4 outline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#33BAEC]"
              style={{
                fontFamily: "var(--font-sora), ui-sans-serif, system-ui, sans-serif",
                fontSize: "var(--fs-body)",
                fontWeight: 500,
              }}
            >
              {ABOUT_CLEANSTART.linkLabel}
              <ArrowUpRight aria-hidden size={18} strokeWidth={2} />
            </a>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
