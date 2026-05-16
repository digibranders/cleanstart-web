"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useRef } from "react";

const HERO_GRADIENT =
  "linear-gradient(180deg, #151021 25.7%, #10123e 37.8%, #131e8f 66.9%, #471ec0 79.7%, #471fc3 92.2%, rgba(70,30,191,0.85) 97.9%, rgba(66,30,188,0.4) 107.7%, rgba(66,30,188,0) 113.5%)";

interface ResourceCenterHeroProps {
  initialQuery: string;
}

export function ResourceCenterHero({
  initialQuery,
}: ResourceCenterHeroProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const q = inputRef.current?.value.trim() ?? "";
      const params = new URLSearchParams(searchParams.toString());
      if (q) {
        params.set("q", q);
      } else {
        params.delete("q");
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: "521px", background: HERO_GRADIENT }}
      aria-labelledby="rc-hero-title"
    >
      {/* Background dot grid */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/resource-center/hero-bg-grid.svg"
        alt=""
        className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 1 }}
        loading="lazy"
        decoding="async"
      />

      {/* 3D cube — top right, color-dodge, -46.54deg rotation */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          left: "1647px",
          top: "-1px",
          width: "419px",
          height: "419px",
          mixBlendMode: "color-dodge",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/resource-center/hero-cube.png"
          alt=""
          className="w-full h-full object-cover"
          style={{ transform: "rotate(-46.54deg)", opacity: 0.4 }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Left glow — hard-light blend */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "-130px",
          top: "286px",
          width: "332px",
          height: "313px",
          mixBlendMode: "hard-light",
          opacity: 0.3,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/resource-center/hero-glow-left.png"
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-[1276px] px-6">
        {/* Title block + search */}
        <div
          className="flex flex-col items-center gap-6 lg:gap-8 mx-auto pt-[120px] lg:pt-[158px]"
          style={{ maxWidth: "955px" }}
        >
          {/* Title + subtitle */}
          <div
            className="flex flex-col items-center gap-6 text-center text-white"
            style={{ maxWidth: "674px" }}
          >
            <h1
              id="rc-hero-title"
              className="font-display font-semibold leading-none"
              style={{
                fontSize: "clamp(1.75rem, 7.5vw, 4.5rem)",
                letterSpacing: "-0.05em",
              }}
            >
              {"Resource "}
              <span
                className="bg-clip-text"
                style={{
                  WebkitTextFillColor: "transparent",
                  backgroundImage:
                    "linear-gradient(105.93deg, #9a51ff 1.76%, #2cc1eb 98.78%)",
                }}
              >
                Center
              </span>
            </h1>
            <p
              className="font-sans font-normal"
              style={{
                fontSize: "clamp(1rem, 1.25vw, 1.5rem)",
                lineHeight: 1.3,
                letterSpacing: "-0.04em",
                opacity: 0.8,
              }}
            >
              A Curated Collection of Writings, Research, and Solutions
            </p>
          </div>

          {/* Search bar */}
          <search aria-label="Search resources" className="contents">
          <form
            onSubmit={handleSearch}
            className="flex items-center w-full"
            style={{ maxWidth: "674px" }}
          >
            <div
              className="relative overflow-hidden flex-1"
              style={{
                height: "42px",
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(237,203,255,0.6)",
                borderRight: "none",
                borderRadius: "12px 0 0 12px",
              }}
            >
              <input
                ref={inputRef}
                type="search"
                name="q"
                defaultValue={initialQuery}
                placeholder="Search resources..."
                className="absolute inset-0 w-full h-full bg-transparent px-[14px] text-white placeholder:text-white/60 text-base leading-[1.5] outline-none"
                style={{ fontWeight: 400 }}
              />
            </div>
            {/* Search button */}
            <button
              type="submit"
              className="shrink-0 flex items-center justify-center"
              style={{
                width: "52px",
                height: "42px",
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(237,203,255,0.6)",
                borderLeft: "none",
                borderRadius: "0 12px 12px 0",
              }}
              aria-label="Submit search"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                  stroke="white"
                  strokeWidth="2"
                />
                <path
                  d="M16.5 16.5L21 21"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </form>
          </search>
        </div>
      </div>
    </section>
  );
}
