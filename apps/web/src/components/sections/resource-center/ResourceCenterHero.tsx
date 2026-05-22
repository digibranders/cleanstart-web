import { Suspense } from "react";
import { SearchBar } from "@/components/sections/_shared/SearchBar";

const HERO_GRADIENT =
  "linear-gradient(180deg, #151021 25.7%, #10123e 37.8%, #131e8f 66.9%, #471ec0 79.7%, #471fc3 92.2%, rgba(70,30,191,0.85) 97.9%, rgba(66,30,188,0.4) 107.7%, rgba(66,30,188,0) 113.5%)";

interface ResourceCenterHeroProps {
  initialQuery: string;
}

export function ResourceCenterHero({
  initialQuery,
}: ResourceCenterHeroProps): React.ReactElement {
  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: "clamp(420px, 37vw, 521px)", background: HERO_GRADIENT }}
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
      <div className="relative mx-auto max-w-[var(--container-default)] px-6">
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
                fontSize: "var(--text-hero-utility)",
                letterSpacing: "var(--text-hero-utility-ls)",
                lineHeight: "var(--text-hero-lh)",
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
          <Suspense
            fallback={
              <div
                className="flex items-center"
                style={{ height: "42px", width: "100%", maxWidth: "674px" }}
              />
            }
          >
            <SearchBar
              initialQuery={initialQuery}
              placeholder="Search resources..."
              ariaLabel="Search resources"
            />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
