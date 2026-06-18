"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";

interface Slide {
  src: string;
  alt: string;
}

const SLIDES: Slide[] = [1, 2, 3].map((n) => ({
  src: `/images/teams/squad/${n}.webp`,
  alt: `CleanStart Hustle Squad, moment ${n}`,
}));

const AUTOPLAY_MS = 5000;

function Sparkle({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 196 196"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      aria-hidden
      style={{ display: "block" }}
    >
      <defs>
        <radialGradient id={`${id}-beam`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D3FFF8" stopOpacity="1" />
          <stop offset="5.7%" stopColor="#15ADFA" stopOpacity="0.95" />
          <stop offset="48.96%" stopColor="#0166CC" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#001132" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-core`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="20%" stopColor="#D3FFF8" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#15ADFA" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#0166CC" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        d="M98 0 L104 98 L98 196 L92 98 Z"
        fill={`url(#${id}-beam)`}
        opacity="0.95"
      />
      <path
        d="M0 98 L98 104 L196 98 L98 92 Z"
        fill={`url(#${id}-beam)`}
        opacity="0.95"
      />
      <circle cx="98" cy="98" r="28" fill={`url(#${id}-core)`} />
    </svg>
  );
}

export function TeamsHustleSquad() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    if (SLIDES.length <= 1) return;
    const id = window.setInterval(() => {
      if (pausedRef.current) return;
      setActive((i) => (i + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, []);

  function next() {
    setActive((i) => (i + 1) % SLIDES.length);
  }

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #131E8F 62.497%, #471EC0 100%)",
      }}
      aria-label="The Hustle Squad"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{
          left: "50%",
          top: "-142.5px",
          width: "min(1280px, 100%)",
          height: "285px",
          transform: "translateX(-50%)",
          background:
            "radial-gradient(50% 50% at 50% 50%, #D3FFF8 0%, #15ADFA 10%, #0166CC 49%, #02112F 100%)",
          mixBlendMode: "screen",
          WebkitMaskImage:
            "radial-gradient(50% 50% at 50% 50%, black 49%, transparent 100%)",
          maskImage:
            "radial-gradient(50% 50% at 50% 50%, black 49%, transparent 100%)",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute hidden lg:block"
        style={{
          left: "-192px",
          top: "-178px",
          width: "701px",
          height: "680px",
          background:
            "radial-gradient(closest-side, rgba(100,13,251,0.30) 0%, rgba(100,13,251,0) 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute hidden lg:block"
        style={{
          right: "-192px",
          top: "-134px",
          width: "701px",
          height: "680px",
          background:
            "radial-gradient(closest-side, rgba(100,13,251,0.30) 0%, rgba(100,13,251,0) 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 py-section-md">
        <Reveal header>
          <h2
            className="mb-[60px] text-center font-display text-white"
            style={{
              fontSize: "var(--fs-h2)",
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
            }}
          >
            {"The Hustle "}
            <span className="cs-text-gradient-impact">Squad</span>
          </h2>
        </Reveal>

        <div
          className="relative mx-auto w-full max-w-[840px]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute hidden md:block"
            style={{
              left: "-220px",
              top: "-140px",
              width: "196px",
              height: "196px",
              mixBlendMode: "screen",
            }}
          >
            <Sparkle id="hustle-sparkle-tl" />
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute hidden md:block"
            style={{
              right: "-220px",
              bottom: "-140px",
              width: "196px",
              height: "196px",
              mixBlendMode: "screen",
            }}
          >
            <Sparkle id="hustle-sparkle-br" />
          </div>

          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="group relative block w-full cursor-pointer overflow-hidden rounded-[32px] p-[16px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2CC1EB]/60"
            style={{
              background:
                "linear-gradient(180deg, rgba(44,193,235,0.45) 0%, rgba(44,193,235,0.25) 100%)",
              aspectRatio: "840 / 468",
            }}
          >
            <div className="relative size-full overflow-hidden rounded-[16px]">
              {SLIDES.map((slide, i) => (
                <div
                  key={i}
                  className="absolute inset-0 transition-opacity duration-700 ease-out"
                  style={{ opacity: i === active ? 1 : 0 }}
                  aria-hidden={i !== active}
                >
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 840px"
                    className="object-cover"
                    priority={i === 0}
                  />
                </div>
              ))}
            </div>
          </button>
        </div>

        <div
          className="mt-[40px] flex items-center justify-center gap-[12px]"
          role="tablist"
          aria-label="Hustle Squad photo navigation"
        >
          {SLIDES.map((_, i) => {
            const isActive = i === active;
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Show slide ${i + 1}`}
                onClick={() => setActive(i)}
                className="size-[12px] rounded-full transition-colors"
                style={{
                  backgroundColor: isActive
                    ? "#DEDEDE"
                    : "rgba(225,225,225,0.3)",
                }}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
