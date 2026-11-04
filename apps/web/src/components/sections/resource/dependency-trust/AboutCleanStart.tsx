import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { Container, Section } from "@/components/layout";
import { FadeUp } from "@/components/ui/FadeUp";

import { ABOUT_CLEANSTART } from "./content";

export function AboutCleanStart(): React.ReactElement {
  return (
    <Section padding="md" data-section="AboutCleanStart" className="bg-white">
      <Container>
        <FadeUp>
          <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-4">
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px]"
                  style={{ background: "linear-gradient(160deg, #151021 0%, #131E8F 100%)" }}
                >
                  <Image
                    src="/images/security/cs-logomark.svg"
                    alt=""
                    aria-hidden
                    width={30}
                    height={30}
                  />
                </span>
                <h2
                  className="text-[#111]"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--fs-h3)",
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    lineHeight: "var(--fs-h3-lh)",
                  }}
                >
                  {ABOUT_CLEANSTART.heading}
                </h2>
              </div>
              <p
                className="mt-6 max-w-[68ch] text-[rgba(17,17,17,0.8)]"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-body)",
                  lineHeight: "var(--fs-body-lh)",
                }}
              >
                {ABOUT_CLEANSTART.body}
              </p>
              <a
                href={ABOUT_CLEANSTART.linkHref}
                className="mt-6 inline-flex items-center gap-1.5 rounded-[8px] text-[#3960F9] underline-offset-4 outline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3960F9]"
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

            <ul className="flex flex-col gap-3 lg:col-span-5">
              {ABOUT_CLEANSTART.products.map((product) => (
                <li key={product.href}>
                  <Link
                    href={product.href}
                    className="group flex items-center justify-between rounded-[16px] border border-black/[0.06] bg-[#F5F3FF] px-5 py-4 text-[#111] outline-offset-4 transition-colors duration-200 hover:bg-[#EAE4FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3960F9]"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "var(--fs-h5)",
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {product.label}
                    <ArrowRight
                      aria-hidden
                      size={20}
                      strokeWidth={2}
                      className="text-[#471EC0] transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </FadeUp>
      </Container>
    </Section>
  );
}
