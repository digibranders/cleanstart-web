"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Section, Container } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";
import {
  HOME_TESTIMONIALS,
  type Testimonial,
} from "@/components/sections/home/Testimonials";

type StatData = {
  value: string;
  label: string;
};

// Icons are positional and live with the component — the CMS `impactStats`
// global stores only value + label. Stats beyond the icon list reuse icons
// round-robin so the band never renders a missing image.
const STAT_ICONS = [
  "/images/home/stats/shield.svg",
  "/images/home/stats/clock.svg",
  "/images/home/stats/cube.svg",
  "/images/home/stats/trend.svg",
] as const;

// Fallback used when no `stats` prop is supplied (kept local so this client
// component doesn't pull in the server-only CMS fetch helper).
const DEFAULT_STATS: StatData[] = [
  { value: "88,000+", label: "CVEs remediated" },
  { value: "90%+", label: "Average CVE reduction" },
  { value: "300,000+", label: "Engineering hours saved" },
  { value: "10M+", label: "Packages from verified source" },
];

const AUTO_ADVANCE_MS = 7000;

function CarouselArrow({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="size-8"
      style={{
        transform: direction === "prev" ? "rotate(180deg)" : undefined,
        filter: "drop-shadow(0px 1.15px 1px rgba(0,0,0,0.22))",
      }}
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="#111111"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// V4 glass control: a translucent lavender body with the light pooling toward
// the right and bottom (Figma blooms), a soft lavender ring (NOT a hard black
// border), and a gentle ambient shadow.
const NAV_GLASS_BG =
  "radial-gradient(58% 78% at 80% 48%, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 66%), " +
  "radial-gradient(48% 52% at 48% 104%, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0) 70%), " +
  "rgba(198, 186, 252, 0.92)";

/** Round glass-lavender prev/next control matching the V4 carousel. */
function NavButton({
  direction,
  onClick,
  className,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Previous testimonial" : "Next testimonial"}
      className={`grid size-14 shrink-0 cursor-pointer place-items-center rounded-full p-3 transition-[filter] hover:brightness-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a51ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f6f6] ${className ?? ""}`}
      style={{
        background: NAV_GLASS_BG,
        border: "1.5px solid rgba(178, 156, 246, 0.55)",
        boxShadow:
          "0 6px 18px rgba(123, 92, 201, 0.18), inset 0 1px 1px rgba(255,255,255,0.5)",
      }}
    >
      <CarouselArrow direction={direction} />
    </button>
  );
}

function CompanyMark({ t }: { t: Testimonial }) {
  if (t.logoSrc) {
    if (t.logoSrc.endsWith(".svg")) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={t.logoSrc}
          alt={t.company}
          width={210}
          height={42}
          loading="lazy"
          decoding="async"
          className="h-[42px] w-auto object-contain"
        />
      );
    }
    return (
      <Image
        src={t.logoSrc}
        alt={t.company}
        width={210}
        height={42}
        sizes="210px"
        className="h-[42px] w-auto object-contain"
      />
    );
  }
  return (
    <span className="font-display text-lg font-semibold text-[#111]">
      {t.company}
    </span>
  );
}

function TestimonialCard({
  items,
  active,
}: {
  items: Testimonial[];
  active: number;
}) {
  return (
    <div className="relative w-full max-w-[904px] overflow-hidden rounded-[32px] border-[1.5px] border-[#da89ef] bg-[#fefeff] px-6 py-8 sm:px-12">
      {/* Decorative closing quote mark, top-right. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/home/quote-mark.svg"
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute right-6 top-6 size-[42px] rotate-180 select-none"
      />

      {/* Stacking grid — every slide shares one grid cell, so the card always
          sizes to the TALLEST testimonial (IIFL) and its height never shifts
          when the active slide changes. */}
      <div className="grid">
        {items.map((t, i) => (
          <div
            key={t.name}
            aria-hidden={i !== active}
            className={`col-start-1 row-start-1 flex flex-col items-center gap-6 text-center transition-opacity duration-500 ${i === active ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
          >
            <CompanyMark t={t} />
            <p
              className="max-w-[668px] font-display font-medium text-[#111]"
              style={{
                fontSize: "var(--fs-lead)",
                lineHeight: 1.3,
                letterSpacing: "-0.02em",
              }}
            >
              &ldquo;{t.quote}&rdquo;
            </p>
            <p
              className="text-[#111]"
              style={{
                fontFamily: "var(--font-sora), Sora, sans-serif",
                fontSize: "var(--fs-body-sm)",
                letterSpacing: "-0.02em",
              }}
            >
              {t.role}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatItem({
  icon,
  value,
  label,
  showDivider,
}: {
  icon: string;
  value: string;
  label: string;
  showDivider: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col items-center gap-4 text-center ${showDivider
        ? "md:before:absolute md:before:left-0 md:before:top-1/2 md:before:h-[120px] md:before:w-px md:before:-translate-y-1/2 md:before:bg-gradient-to-b md:before:from-transparent md:before:via-black/15 md:before:to-transparent md:before:content-['']"
        : ""
        }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={icon}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="size-10 select-none"
      />
      <p
        className="font-display font-bold text-[#111]"
        style={{ fontSize: "var(--fs-h2)", lineHeight: 1, letterSpacing: "-0.03em" }}
      >
        {value}
      </p>
      <p
        className="max-w-[170px] text-[#666]"
        style={{
          fontFamily: "var(--font-sora), Sora, sans-serif",
          fontSize: "var(--fs-body)",
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
        }}
      >
        {label}
      </p>
    </div>
  );
}

export function TestimonialsStats({ stats = DEFAULT_STATS }: { stats?: StatData[] }) {
  const items = HOME_TESTIMONIALS;
  const total = items.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (dir: "prev" | "next") =>
      setActive((cur) =>
        dir === "next" ? (cur + 1) % total : (cur - 1 + total) % total,
      ),
    [total],
  );

  // Auto-advance, paused on hover/focus and under reduced motion.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (paused) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      setActive((cur) => (cur + 1) % total);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [paused, total]);

  return (
    <Section padding="lg" className="relative overflow-hidden bg-[#f6f6f6]">
      {/* Soft lavender / cyan ambient glows behind the card. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[8%] top-[28%] hidden size-[394px] -translate-y-1/2 select-none lg:block"
        style={{
          background:
            "radial-gradient(closest-side, rgba(154, 81, 255, 0.16) 0%, rgba(154, 81, 255, 0) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[8%] top-[28%] hidden size-[385px] -translate-y-1/2 select-none lg:block"
        style={{
          background:
            "radial-gradient(closest-side, rgba(44, 193, 235, 0.16) 0%, rgba(44, 193, 235, 0) 100%)",
        }}
      />

      <Container>
        <Reveal header>
          <h2
            className="mx-auto max-w-[867px] text-center font-display font-semibold text-[#111]"
            style={{
              fontSize: "var(--fs-h2)",
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
            }}
          >
            Trusted by Teams Building Critical Software{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(-8.92deg, #2cc1eb 0%, #9a51ff 63.96%)",
              }}
            >
              Infrastructure
            </span>
          </h2>
        </Reveal>

        {/* Carousel */}
        <Reveal>
          <div
            ref={rootRef}
            className="mt-12 flex flex-col items-center"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            <div className="flex w-full items-center justify-center gap-6 lg:gap-[68px]">
              <NavButton direction="prev" onClick={() => go("prev")} className="hidden sm:grid" />
              <TestimonialCard items={items} active={active} />
              <NavButton direction="next" onClick={() => go("next")} className="hidden sm:grid" />
            </div>

            {/* Dots */}
            <div className="mt-8 flex items-center gap-2.5">
              {items.map((t, i) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Show testimonial ${i + 1}`}
                  aria-current={i === active}
                  className={`h-2.5 cursor-pointer rounded-full transition-all ${i === active ? "w-6 bg-[#9a51ff]" : "w-2.5 bg-black/20 hover:bg-black/30"
                    }`}
                />
              ))}
            </div>

            {/* Mobile prev/next (side arrows are hidden on small screens). */}
            <div className="mt-6 flex items-center gap-6 sm:hidden">
              <NavButton direction="prev" onClick={() => go("prev")} />
              <NavButton direction="next" onClick={() => go("next")} />
            </div>
          </div>
        </Reveal>

        {/* Stats band */}
        <Reveal>
          <div className="mt-14 rounded-[32px] border-[1.5px] border-black/10 bg-[#fefeff] px-6 py-12 sm:px-12">
            <div className="grid grid-cols-2 gap-y-12 md:grid-cols-4 md:gap-y-0">
              {stats.map((stat, i) => (
                <StatItem
                  key={stat.label}
                  icon={STAT_ICONS[i % STAT_ICONS.length] ?? STAT_ICONS[0]}
                  value={stat.value}
                  label={stat.label}
                  showDivider={i > 0}
                />
              ))}
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
