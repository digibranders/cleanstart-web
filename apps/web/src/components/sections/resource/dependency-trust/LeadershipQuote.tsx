import Image from "next/image";

import { Container } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";

import { LEADERSHIP } from "./content";
import { GradientTitle } from "./parts";

const QUOTE_MARK_STYLE: React.CSSProperties = {
  fontSize: "clamp(44px, 4.5vw, 68px)",
  fontWeight: 700,
  background: "linear-gradient(135deg, #4FD1F5 0%, #6F8DFF 55%, #B19CFF 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  opacity: 0.55,
};

export function LeadershipQuote(): React.ReactElement {
  const [first, second] = LEADERSHIP.quote;

  return (
    <section
      data-section="LeadershipQuote"
      className="relative w-full overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #10123E 30%, #131E8F 72%, #471EC0 100%)",
        paddingTop: "clamp(56px, 6.25vw, 120px)",
        paddingBottom: "clamp(56px, 6.25vw, 120px)",
      }}
    >
      {/* Ambient aura behind the card, as on the other testimonial blocks. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[760px] w-[1100px] max-w-[120%] -translate-x-1/2 -translate-y-1/2 select-none"
        style={{
          background:
            "radial-gradient(48% 50% at 50% 42%, rgba(79,30,192,0.55) 0%, rgba(19,30,143,0.32) 42%, rgba(51,186,236,0.10) 68%, rgba(0,0,0,0) 100%)",
          mixBlendMode: "screen",
          filter: "blur(8px)",
        }}
      />
      <Container className="relative z-[2]">
        <Reveal header>
          <GradientTitle text={LEADERSHIP.heading} accent="software security" tone="dark" />
        </Reveal>

        <Reveal y={28} delay={0.12} className="mx-auto mt-10 sm:mt-12" style={{ maxWidth: "980px" }}>
          <figure
            className="cs-grad-border relative overflow-hidden rounded-[28px] px-7 py-8 text-center sm:px-14 sm:py-10"
            style={{
              background:
                "linear-gradient(155deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.025) 48%, rgba(255,255,255,0.05) 100%)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              boxShadow: "0 40px 90px -30px rgba(8,4,24,0.85), inset 0 1px 0 rgba(255,255,255,0.10)",
            }}
          >
            <div className="relative mx-auto max-w-[900px] px-3 py-2 sm:px-10">
              <span
                aria-hidden
                className="pointer-events-none absolute left-0 top-0 select-none font-display leading-none sm:-left-2"
                style={QUOTE_MARK_STYLE}
              >
                &ldquo;
              </span>
              <blockquote
                className="relative flex flex-col gap-5 font-display"
                style={{
                  fontSize: "var(--fs-lead-sm)",
                  fontWeight: 500,
                  lineHeight: 1.55,
                  letterSpacing: "-0.02em",
                  color: "rgba(255,255,255,0.96)",
                  textWrap: "pretty",
                }}
              >
                <p>{first}</p>
                <p>{second}</p>
              </blockquote>
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-5 right-0 select-none font-display leading-none sm:-right-2"
                style={QUOTE_MARK_STYLE}
              >
                &rdquo;
              </span>
            </div>

            <div
              aria-hidden
              className="mx-auto mt-8 h-px w-full max-w-[440px]"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0) 100%)",
              }}
            />

            <figcaption className="mt-6 flex items-center justify-center gap-4">
              <Image
                src={LEADERSHIP.photo}
                alt=""
                width={500}
                height={602}
                sizes="56px"
                className="h-14 w-14 rounded-full object-cover object-top ring-1 ring-white/25"
              />
              <div className="text-left">
                <p
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
                  className="mt-0.5"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-body-sm)",
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.66)",
                  }}
                >
                  {LEADERSHIP.role}
                </p>
              </div>
            </figcaption>
          </figure>
        </Reveal>
      </Container>
    </section>
  );
}
