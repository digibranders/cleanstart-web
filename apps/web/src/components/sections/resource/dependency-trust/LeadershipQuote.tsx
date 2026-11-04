import Image from "next/image";

import { Container, Section } from "@/components/layout";
import { FadeUp } from "@/components/ui/FadeUp";

import { LEADERSHIP } from "./content";

export function LeadershipQuote(): React.ReactElement {
  const [first, second] = LEADERSHIP.quote;

  return (
    <Section
      padding="lg"
      data-section="LeadershipQuote"
      className="overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #10123E 30%, #131E8F 72%, #471EC0 100%)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/for-developers/why/deco-union-left.svg"
        alt=""
        className="pointer-events-none absolute -left-24 bottom-0 hidden w-[620px] max-w-none select-none opacity-50 lg:block"
        loading="lazy"
        decoding="async"
      />
      <Container>
        <FadeUp>
          <div className="relative grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <div className="relative mx-auto w-full max-w-[340px]">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-6 rounded-full opacity-80 blur-[48px]"
                  style={{
                    background:
                      "radial-gradient(closest-side, rgba(169,116,255,0.5) 0%, rgba(169,116,255,0) 72%)",
                  }}
                />
                <div className="relative overflow-hidden rounded-[24px] ring-1 ring-white/25">
                  <Image
                    src={LEADERSHIP.photo}
                    alt={`${LEADERSHIP.name}, ${LEADERSHIP.role}`}
                    width={500}
                    height={602}
                    sizes="(min-width: 1024px) 340px, 70vw"
                    className="h-auto w-full"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-8">
              <p
                className="text-white/75"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-eyebrow)",
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {LEADERSHIP.label}
              </p>
              <h2
                className="mt-4 text-white"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--fs-h2)",
                  fontWeight: 600,
                  letterSpacing: "-0.03em",
                  lineHeight: "var(--fs-h2-lh)",
                  textWrap: "balance",
                }}
              >
                {LEADERSHIP.heading}
              </h2>

              <figure className="mt-8 max-w-[64ch]">
                <blockquote
                  className="flex flex-col gap-5 text-white/90"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-lead-sm)",
                    lineHeight: 1.55,
                    letterSpacing: "-0.01em",
                  }}
                >
                  <p>{`“${first}`}</p>
                  <p>{`${second}”`}</p>
                </blockquote>
                <figcaption className="mt-8">
                  <p
                    className="text-white"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "var(--fs-h5)",
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {LEADERSHIP.name}
                  </p>
                  <p
                    className="mt-1 text-white/70"
                    style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body-sm)" }}
                  >
                    {LEADERSHIP.role}
                  </p>
                </figcaption>
              </figure>
            </div>
          </div>
        </FadeUp>
      </Container>
    </Section>
  );
}
