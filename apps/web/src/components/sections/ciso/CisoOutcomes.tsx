"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/Reveal";

function useCounter(target: number, duration = 1800, enabled = false): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return;
    }
    let rafId: number;
    const startTime = performance.now();

    const tick = (now: number): void => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const current = Math.round(eased * target);
      setCount(current);
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return (): void => cancelAnimationFrame(rafId);
  }, [target, duration, enabled]);

  return count;
}

interface StatDef {
  target: number | null;
  display: string;
  mobileDisplay: string;
  mobilePrefix: string;
  suffix: string;
  mobileSuffix: string;
  line1: string;
  line2: string;
  tall: boolean;
}

const STATS: StatDef[] = [
  {
    target: 89,   display: "89%",  mobileDisplay: "89%",  mobilePrefix: "",  suffix: "%",  mobileSuffix: "%",
    line1: "Fewer inherited",    line2: "vulnerabilities",  tall: true,
  },
  {
    target: 70,   display: "70%+", mobileDisplay: "+70%", mobilePrefix: "+", suffix: "%+", mobileSuffix: "%",
    line1: "Smaller software",   line2: "inventories",      tall: false,
  },
  {
    target: null, display: "2–3x", mobileDisplay: "2–3x", mobilePrefix: "",  suffix: "",   mobileSuffix: "",
    line1: "Faster remediation", line2: "cycles",           tall: true,
  },
  {
    target: 40,   display: "40%",  mobileDisplay: "40%",  mobilePrefix: "",  suffix: "%",  mobileSuffix: "%",
    line1: "Lower remediation",  line2: "workload",         tall: false,
  },
];

function StatCard({
  stat,
  enabled,
}: {
  stat: StatDef;
  enabled: boolean;
}): React.ReactElement {
  const count = useCounter(stat.target ?? 0, 1800, enabled && stat.target !== null);
  const displayValue =
    stat.target !== null ? `${count}${stat.suffix}` : stat.display;

  return (
    <div
      className={`relative w-full overflow-hidden h-[326px] xl:w-[295px] xl:flex-shrink-0 ${
        stat.tall ? "xl:h-[326px] xl:mt-0" : "xl:h-[258px] xl:mt-[68px]"
      }`}
      style={{
        borderRadius: "24px",
        backgroundColor: "#fff",
      }}
    >
      <div
        className="absolute whitespace-nowrap"
        style={{
          left: "32px",
          top: "106px",
          transform: "translateY(-100%)",
          fontFamily: "var(--font-display)",
          fontSize: "var(--fs-display)",
          fontWeight: 700,
          letterSpacing: "-0.04em",
          lineHeight: 1.2,
          color: "#111",
        }}
      >
        {displayValue}
      </div>

      <div
        className="absolute"
        style={{
          left: "32px",
          top: stat.tall ? "222px" : "154px",
          width: "231px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-body)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.4,
            color: "#333",
          }}
        >
          {stat.line1}
          <br />
          {stat.line2}
        </p>
      </div>
    </div>
  );
}

function MobileStatCard({
  stat,
  enabled,
}: {
  stat: StatDef;
  enabled: boolean;
}): React.ReactElement {
  const count = useCounter(stat.target ?? 0, 1800, enabled && stat.target !== null);
  const displayValue =
    stat.target !== null
      ? `${stat.mobilePrefix}${count}${stat.mobileSuffix}`
      : stat.mobileDisplay;

  return (
    <div
      className="relative flex-shrink-0"
      style={{
        width: "328px",
        height: "144px",
        borderRadius: "20px",
        backgroundColor: "#fff",
        boxShadow: "0px 4px 20px 0px rgba(0, 0, 0, 0.08)",
      }}
    >
      {/* TODO: replace inline stat number sizing with a dedicated --stat-number-* token */}
      <div
        className="absolute whitespace-nowrap"
        style={{
          left: "32px",
          top: "32px",
          fontFamily: "var(--font-display)",
          fontSize: "var(--fs-display)",
          fontWeight: 700,
          lineHeight: 1.2,
          color: "#000",
        }}
      >
        {displayValue}
      </div>

      <div
        className="absolute"
        style={{
          left: "32px",
          top: "92px",
          width: "280px",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-body)",
          fontWeight: 400,
          lineHeight: 1.4,
          letterSpacing: "-0.02em",
          color: "#333",
        }}
      >
        {stat.line1} {stat.line2}
      </div>
    </div>
  );
}

function BottomFlare({ left }: { left: string }): React.ReactElement {
  return (
    <div
      aria-hidden
      className="absolute pointer-events-none select-none"
      style={{
        left,
        bottom: "77px",
        width: "652px",
        height: "145px",
        mixBlendMode: "screen",
      }}
    >
      <div className="absolute" style={{ inset: "0 0 -100% 0" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/ciso/outcomes-flare.svg"
          alt=""
          className="absolute"
          style={{
            inset: "0 0 -100% 0",
            width: "100%",
            height: "200%",
            objectFit: "fill",
            maskImage:
              "url('/images/ciso/outcomes-flare-mask1.svg'), url('/images/ciso/outcomes-flare-mask2.png')",
            WebkitMaskImage:
              "url('/images/ciso/outcomes-flare-mask1.svg'), url('/images/ciso/outcomes-flare-mask2.png')",
            maskMode: "alpha",
            maskComposite: "intersect",
            maskRepeat: "no-repeat",
            maskSize: "100% 50%, 100% 50%",
            maskPosition: "0px 0px, 0px 0px",
          }}
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
}

function GlowBar({
  src,
  height,
  opacity,
  top,
}: {
  src: string;
  height: number;
  opacity: number;
  top: number;
}): React.ReactElement {
  return (
    <div
      aria-hidden
      className="absolute pointer-events-none select-none left-0 right-0 flex items-center justify-center"
      style={{ top: `${top}px`, height: `${height}px`, opacity }}
    >
      <div
        style={{
          flexShrink: 0,
          transform: "rotate(90deg)",
          width: `${height}px`,
          height: "1930px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "fill" }}
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
}

export function CisoOutcomes(): React.ReactElement {
  const sectionRef = useRef<HTMLElement>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return (): void => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      data-section="CisoOutcomes"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%)",
      }}
    >

      <div
        className="md:hidden relative overflow-hidden"
        style={{ minHeight: "816px" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/ciso/outcomes-vector-corner.svg"
          alt=""
          className="absolute pointer-events-none select-none"
          style={{
            left: "-72px",
            top: "-81px",
            width: "463px",
            height: "463px",
          }}
          loading="lazy"
          decoding="async"
        />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/ciso/outcomes-vector-center.svg"
          alt=""
          className="absolute pointer-events-none select-none"
          style={{
            left: "calc(50% + 0.5px)",
            top: "-56px",
            transform: "translateX(-50%)",
            width: "803px",
            height: "803px",
          }}
          loading="lazy"
          decoding="async"
        />

        <h2
          className="absolute text-center"
          style={{
            top: "32px",
            left: "calc(50% - 0.5px)",
            transform: "translateX(-50%)",
            width: "211px",
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-h2)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.2,
            color: "#fff",
          }}
        >
          {"Security "}
          <span
            style={{
              background:
                "linear-gradient(96.45deg, #9A51FF 1.758%, #2CC1EB 98.781%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {"Outcomes "}
          </span>
        </h2>

        <div
          className="absolute flex flex-col"
          style={{
            top: "124px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "328px",
            gap: "16px",
          }}
        >
          {STATS.map((stat) => (
            <MobileStatCard key={stat.mobileDisplay + stat.line1} stat={stat} enabled={animated} />
          ))}
        </div>
      </div>

      <div
        className="hidden md:block relative px-6 sm:px-10"
        style={{ paddingTop: "120px", paddingBottom: "200px" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/ciso/outcomes-vector-corner.svg"
          alt=""
          className="absolute pointer-events-none select-none"
          style={{
            left: "calc(50% + 471px)",
            top: "-339px",
            width: "979px",
            height: "979px",
          }}
          loading="lazy"
          decoding="async"
        />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/ciso/outcomes-vector-corner.svg"
          alt=""
          className="absolute pointer-events-none select-none"
          style={{
            left: "calc(50% - 1521px)",
            top: "67px",
            width: "979px",
            height: "979px",
          }}
          loading="lazy"
          decoding="async"
        />

        {/* Track and per-column flares only fit the 4-wide row, so they are xl-only and hidden in the md-lg 2x2 grid. */}
        <div className="hidden xl:block">
          <GlowBar
            src="/images/ciso/outcomes-glow-bar1.png"
            height={131}
            opacity={0.4}
            top={633}
          />
          <GlowBar
            src="/images/ciso/outcomes-glow-bar2.png"
            height={51}
            opacity={0.3}
            top={633}
          />

          <BottomFlare left="139px" />
          <BottomFlare left="469px" />
          <BottomFlare left="799px" />
          <BottomFlare left="1129px" />
        </div>

        <div className="relative mx-auto" style={{ maxWidth: "1276px" }}>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/ciso/outcomes-vector-center.svg"
            alt=""
            className="absolute pointer-events-none select-none"
            style={{
              left: "50%",
              top: "-56px",
              transform: "translateX(-50%)",
              width: "803px",
              height: "803px",
            }}
            loading="lazy"
            decoding="async"
          />

          <Reveal
            header
            className="relative text-center px-6"
            style={{ marginBottom: "80px" }}
          >
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-h2)",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
                color: "#fff",
              }}
            >
              Security{" "}
              <span className="cs-text-gradient-impact">Outcomes</span>
            </h2>
          </Reveal>

          <RevealStagger className="grid grid-cols-2 items-stretch gap-6 lg:gap-8 xl:flex xl:items-start xl:gap-[32px]">
            {STATS.map((stat) => (
              <RevealItem key={stat.display}>
                <StatCard stat={stat} enabled={animated} />
              </RevealItem>
            ))}
          </RevealStagger>

        </div>
      </div>

    </section>
  );
}
