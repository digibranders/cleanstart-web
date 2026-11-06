import Image from "next/image";
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
 *
 * The three products share one lit panel: each emblem stands on its own glow,
 * a thin line runs behind them to say they are one platform, and the whole
 * column is the link.
 */
export function AboutCleanStart(): React.ReactElement {
  return (
    <section
      data-section="AboutCleanStart"
      className="relative w-full overflow-hidden text-white"
      style={{
        background: DARK_BAND,
        paddingTop: "clamp(64px, 7vw, 132px)",
        paddingBottom: "var(--spacing-section-cta)",
      }}
    >
      {/* Stage light behind the panel, and a faint dot grid that fades out from it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none"
        style={{
          background:
            "radial-gradient(52% 46% at 50% 56%, rgba(96, 56, 255, 0.34) 0%, rgba(96, 56, 255, 0) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.16) 1px, rgba(255,255,255,0) 1.5px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(60% 55% at 50% 55%, #000 0%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage: "radial-gradient(60% 55% at 50% 55%, #000 0%, rgba(0,0,0,0) 100%)",
        }}
      />

      <Container className="relative z-[2]">
        <Reveal header>
          <GradientTitle text={ABOUT_CLEANSTART.heading} accent="CleanStart" tone="dark" />
        </Reveal>

        <Reveal y={24} delay={0.08}>
          <p
            className="mx-auto mt-8 max-w-[800px] text-center"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-lead-sm)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.8)",
              textWrap: "pretty",
            }}
          >
            {ABOUT_CLEANSTART.body}
          </p>

          <div className="mx-auto mt-14 max-w-[1120px]">
            <div
              className="relative overflow-hidden rounded-[32px]"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.02) 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 50px 100px -40px rgba(6,3,28,0.9)",
              }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute left-[16.6%] right-[16.6%] top-[148px] hidden h-px md:block"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(79,209,245,0) 0%, rgba(79,209,245,0.55) 28%, rgba(154,81,255,0.55) 72%, rgba(154,81,255,0) 100%)",
                }}
              />
              <ul className="relative grid md:grid-cols-3">
                {ABOUT_CLEANSTART.products.map((product) => (
                  <li
                    key={product.href}
                    className="border-t border-white/10 first:border-t-0 md:border-l md:border-t-0 md:first:border-l-0"
                  >
                    <Link
                      href={product.href}
                      className="group relative flex h-full items-center gap-5 px-6 py-5 outline-offset-[-4px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#33BAEC] md:flex-col md:gap-0 md:px-8 md:pb-10 md:pt-12"
                    >
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none"
                        style={{
                          background:
                            "radial-gradient(70% 60% at 50% 0%, rgba(111, 70, 255, 0.3) 0%, rgba(111, 70, 255, 0) 100%)",
                        }}
                      />
                      <span className="relative flex shrink-0 items-end justify-center md:h-[200px] md:w-full">
                        <span
                          aria-hidden
                          className="absolute bottom-[10px] left-1/2 hidden h-[34px] w-[170px] -translate-x-1/2 rounded-[50%] opacity-70 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none md:block"
                          style={{
                            background:
                              "radial-gradient(closest-side, rgba(79, 209, 245, 0.55) 0%, rgba(79, 209, 245, 0) 100%)",
                          }}
                        />
                        <Image
                          src={product.emblem}
                          alt=""
                          aria-hidden
                          width={768}
                          height={768}
                          sizes="(min-width: 768px) 176px, 72px"
                          className="relative h-[72px] w-[72px] object-contain transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-2 group-hover:scale-105 motion-reduce:transition-none md:h-[176px] md:w-[176px]"
                          style={{ filter: "drop-shadow(0 22px 28px rgba(8, 4, 40, 0.65))" }}
                        />
                      </span>
                      <span
                        className="relative flex flex-1 items-center justify-between gap-4 md:mt-8 md:flex-none md:flex-col md:gap-6"
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "var(--fs-h4)",
                          fontWeight: 600,
                          letterSpacing: "-0.03em",
                          lineHeight: 1.15,
                        }}
                      >
                        {product.label}
                        <span
                          aria-hidden
                          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] text-[#4FD1F5] transition-colors duration-300 group-hover:border-[#4FD1F5]/60 group-hover:bg-white/[0.14] motion-reduce:transition-none"
                        >
                          <ArrowRight
                            size={20}
                            strokeWidth={2}
                            className="transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none"
                          />
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <a
              href={ABOUT_CLEANSTART.linkHref}
              className="group inline-flex min-h-12 items-center gap-3 rounded-[8px] border border-white/25 bg-white/[0.07] py-1.5 pl-5 pr-1.5 text-white outline-offset-4 transition-colors duration-300 hover:border-[#4FD1F5]/60 hover:bg-white/[0.13] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#33BAEC] motion-reduce:transition-none"
              style={{
                fontFamily: "var(--font-sora), ui-sans-serif, system-ui, sans-serif",
                fontSize: "var(--fs-button)",
                fontWeight: 500,
                letterSpacing: "-0.01em",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)",
              }}
            >
              <span>{ABOUT_CLEANSTART.linkLabel}</span>
              <span
                aria-hidden
                className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] bg-white/[0.12] text-[#4FD1F5]"
              >
                <ArrowUpRight
                  size={18}
                  strokeWidth={2}
                  className="transition-transform duration-300 group-hover:-translate-y-px group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </span>
            </a>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
