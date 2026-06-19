import type React from "react";
import Link from "next/link";
import { HeroReveal } from "@/components/ui/Reveal";

export function SCAHero(): React.ReactElement {
  return (
    <section
      className="relative overflow-hidden lg:min-h-[824px]"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgb(21,16,33) 25.7%, rgb(16,18,62) 31.2%, rgb(19,30,143) 51%, rgb(71,30,192) 68.7%, rgb(71,31,195) 79.8%, rgba(70,30,191,0.85) 85%, rgba(66,30,188,0.4) 93.7%, rgba(66,30,188,0) 98.9%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          right: "224px",
          top: "434px",
          width: "159px",
          height: "156px",
          background:
            "radial-gradient(ellipse at center, rgba(45,184,249,0.9) 0%, rgba(11,138,227,0.7) 25%, rgba(1,60,125,0.4) 65%, rgba(2,17,47,0) 100%)",
          transform: "rotate(32.82deg)",
          filter: "blur(2px)",
          mixBlendMode: "plus-lighter",
        }}
      />

      {/* Positioned absolutely so it can overflow the right content edge. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/sca/hero-3d-illustration.webp"
        alt=""
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          width: "492px",
          height: "516px",
          top: "clamp(96px, 11vw, 160px)",
          right: "max(0px, calc(50vw - 703px))",
          objectFit: "contain",
        }}
        decoding="async"
      />

      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 text-center lg:text-left"
        style={{ paddingTop: "calc(clamp(112px, 11vw, 160px) + var(--cs-header-extra))", paddingBottom: "clamp(56px, 7vw, 100px)" }}
      >
        <HeroReveal y={50} duration={1.0}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-display)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              color: "#ffffff",
              maxWidth: "805px",
              margin: 0,
            }}
          >
            Smarter Software Composition Analysis
          </h1>
        </HeroReveal>

        <HeroReveal y={30} delay={0.2} duration={0.8}>
          <p
            style={{
              marginTop: "clamp(16px, 1.67vw, 32px)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-lead)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.8)",
              maxWidth: "688px",
            }}
          >
            Reduce alert fatigue and improve SCA effectiveness with minimal,
            hardened container foundations and contextualized risk insights.
          </p>
        </HeroReveal>

        <Link
          href="/book-a-demo"
          className="cs-btn-glass self-start"
          style={{
            marginTop: "clamp(28px, 2.5vw, 48px)",
            ["--cs-btn-px" as string]: "18px",
            ["--cs-btn-fs" as string]: "16px",
          } as React.CSSProperties}
        >
          <svg
            aria-hidden
            role="presentation"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <polygon points="6,4 20,12 6,20" />
          </svg>

          <span>Watch How SCA Works</span>

        </Link>

        <div className="hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/sca/hero-3d-illustration.webp"
            alt=""
            aria-hidden
            width={492}
            height={516}
            decoding="async"
            className="select-none pointer-events-none h-auto"
            style={{ width: "clamp(280px, 90vw, 380px)" }}
          />
        </div>
      </div>
    </section>
  );
}
