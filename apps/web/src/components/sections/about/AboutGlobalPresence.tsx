"use client";

import { useState, useEffect, useCallback, type CSSProperties } from "react";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { WorldMapPaths } from "./WorldMapPaths";

// ─── Types ────────────────────────────────────────────────────────────────────

type LocationId = "hq" | "ahmedabad" | "bengaluru" | "singapore";

interface OfficeLocation {
  id: LocationId;
  name: string;
  country: string;
  address: string;
  landmark: string;
  landmarkAlt: string;
  color: "cyan" | "amber";
  /** SVG coordinate in the 1000×460 viewBox (equirectangular). */
  x: number;
  y: number;
  /**
   * CSS transform applied to the tooltip <div>.
   * Tooltip is anchored at (x%, y%) of the map container, then shifted
   * so it doesn't overlap the marker and stays within the container.
   */
  tooltipTransform: string;
  /** SVG text offset from the marker centre (for city label). */
  labelOffset: { x: number; y: number };
  /** Stagger index for enter animations. */
  index: number;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const OFFICES: OfficeLocation[] = [
  {
    id: "hq",
    name: "North America (HQ)",
    country: "United States",
    address: "CleanStart Security Inc., 16192 Coastal Highway, Lewes, Delaware 19958",
    landmark: "/images/about/global/landmark-delaware.jpg",
    landmarkAlt: "Cape Henlopen lighthouse, Lewes, Delaware",
    color: "amber",
    x: 290,
    y: 131,
    // HQ is in the upper portion — tooltip opens downward to avoid clipping
    tooltipTransform: "translate(-10%, 20px)",
    labelOffset: { x: 16, y: -18 },
    index: 0,
  },
  {
    id: "ahmedabad",
    name: "India — Ahmedabad",
    country: "India",
    address: "Block C, 9th Floor Navratna Business Park, Bodakdev, Ahmedabad, Gujarat 380059",
    landmark: "/images/about/global/landmark-ahmedabad.jpg",
    landmarkAlt: "Sabarmati riverfront, Ahmedabad",
    color: "cyan",
    x: 702,
    y: 171,
    tooltipTransform: "translate(-50%, calc(-100% - 18px))",
    labelOffset: { x: 13, y: 4 },
    index: 1,
  },
  {
    id: "bengaluru",
    name: "India — Bengaluru",
    country: "India",
    address: "Bhive Platinum Address Maker, 114/5, Old Madras Road, Halasuru, Bengaluru 560008",
    landmark: "/images/about/global/landmark-bengaluru.jpg",
    landmarkAlt: "Vidhana Soudha, Bengaluru",
    color: "cyan",
    x: 716,
    y: 197,
    // Right-side marker — shift tooltip left so it stays in viewport
    tooltipTransform: "translate(-85%, calc(-100% - 18px))",
    labelOffset: { x: 13, y: 4 },
    index: 2,
  },
  {
    id: "singapore",
    name: "Singapore",
    country: "Singapore",
    address: "1003 Bukit Merah Central, #07-23, Singapore 159836",
    landmark: "/images/about/global/landmark-singapore.jpg",
    landmarkAlt: "Marina Bay Sands skyline, Singapore",
    color: "cyan",
    x: 788,
    y: 227,
    tooltipTransform: "translate(-80%, calc(-100% - 18px))",
    labelOffset: { x: 13, y: 4 },
    index: 3,
  },
];

// Connection arcs: [fromId, toId, SVG cubic-bezier path, animation delay seconds]
const ARCS: Array<[LocationId, LocationId, string, number]> = [
  [
    "hq",
    "ahmedabad",
    "M 290,131 C 290,60 702,60 702,171",
    0.8,
  ],
  [
    "ahmedabad",
    "bengaluru",
    "M 702,171 C 706,155 712,155 716,197",
    1.3,
  ],
  [
    "bengaluru",
    "singapore",
    "M 716,197 C 740,185 772,200 788,227",
    1.7,
  ],
];

// ─── Colour helpers ───────────────────────────────────────────────────────────

const CYAN = "#2cc1eb";
const AMBER = "#f59e0b";

function markerColor(color: "cyan" | "amber"): string {
  return color === "amber" ? AMBER : CYAN;
}

// ─── Guide-line X positions (proportional, matching AbourPowering) ─────────────

const GUIDE_LINES_X = [323, 726, 759, 1164, 1195, 1599] as const;

// ─── Main component ───────────────────────────────────────────────────────────

export function AboutGlobalPresence() {
  const [activeId, setActiveId] = useState<LocationId | null>(null);
  const [hoveredId, setHoveredId] = useState<LocationId | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const visibleId: LocationId | null = hoveredId ?? activeId;

  const handleMarkerClick = useCallback((id: LocationId) => {
    setActiveId((prev) => (prev === id ? null : id));
  }, []);

  const handleSectionClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest("[data-marker]") &&
        !target.closest("[data-pill]")
      ) {
        setActiveId(null);
      }
    },
    [],
  );

  const handleSectionTouch = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest("[data-marker]") &&
        !target.closest("[data-pill]")
      ) {
        setActiveId(null);
        setHoveredId(null);
      }
    },
    [],
  );

  const visibleOffice = visibleId
    ? OFFICES.find((o) => o.id === visibleId) ?? null
    : null;

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%)",
      }}
      onClick={handleSectionClick}
      onKeyDown={(e) => {
        if (e.key === "Escape") setActiveId(null);
      }}
      onTouchStart={handleSectionTouch}
    >
      {/* ── Decorative ellipse blobs ─────────────────────────────────────── */}
      {[130.75, 1306.73].map((leftPx) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={leftPx}
          aria-hidden
          src="/images/about/powering-ellipse-blob.svg"
          alt=""
          className="pointer-events-none absolute hidden select-none lg:block"
          style={{
            left: `calc(${leftPx}px / 1920 * 100%)`,
            top: "246px",
            width: "432px",
            height: "432px",
            transform: "rotate(8.58deg) scale(2.0687)",
          }}
          loading="lazy"
          decoding="async"
        />
      ))}

      {(
        [
          [-525, 394],
          [1521, -210],
        ] as const
      ).map(([x, y]) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${x}-${y}`}
          aria-hidden
          src="/images/about/powering-bg-vector.svg"
          alt=""
          className="pointer-events-none absolute hidden select-none lg:block"
          style={{
            left: `calc(${x}px / 1920 * 100%)`,
            top: `${y}px`,
            width: "979px",
            height: "979px",
          }}
          loading="lazy"
          decoding="async"
        />
      ))}

      {/* ── Vertical guide lines ─────────────────────────────────────────── */}
      {GUIDE_LINES_X.map((x) => (
        <div
          key={x}
          aria-hidden
          className="pointer-events-none absolute top-[180px] hidden h-[1335px] w-px lg:block"
          style={{
            left: `calc(${x}px / 1920 * 100%)`,
            opacity: 0.9,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0) 13.67%, #ffffff 39.101%, rgba(255,255,255,0) 64.532%)",
          }}
        />
      ))}

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-[100px] pb-12 lg:pb-16">

        {/* Heading */}
        <div className="mx-auto flex max-w-[840px] flex-col items-center gap-5 text-center text-white mb-10 lg:mb-14">
          <Reveal header>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-eyebrow)",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: CYAN,
              }}
            >
              Global Presence
            </p>
          </Reveal>
          <Reveal header delay={0.1} y={20}>
            <h2
              className="font-display"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
              }}
            >
              Where We Operate
            </h2>
          </Reveal>
          <Reveal header delay={0.2} y={20}>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-lead)",
                fontWeight: 400,
                lineHeight: 1.5,
                letterSpacing: "-0.02em",
                opacity: 0.7,
                maxWidth: "600px",
              }}
            >
              From the Americas to Southeast Asia, CleanStart's team is building
              trusted software foundations globally.
            </p>
          </Reveal>
        </div>

        {/* ── Map ──────────────────────────────────────────────────────────── */}
        <Reveal delay={0.3}>
          <div className="relative w-full" style={{ overflow: "visible" }}>
            <svg
              viewBox="0 0 1000 460"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full"
              style={{ display: "block", overflow: "visible" }}
              aria-hidden
            >
              <defs>
                <radialGradient id="gp-glow-cyan" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={CYAN} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={CYAN} stopOpacity={0} />
                </radialGradient>
                <radialGradient id="gp-glow-amber" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={AMBER} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
                </radialGradient>
                <filter id="gp-core-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Continent fills */}
              <WorldMapPaths />

              {/* Connection arcs */}
              {ARCS.map(([fromId, , d, delay]) => (
                <path
                  key={fromId}
                  className="cs-map-arc"
                  d={d}
                  fill="none"
                  stroke="rgba(44,193,235,0.28)"
                  strokeWidth={1.2}
                  strokeDasharray="600 600"
                  strokeLinecap="round"
                  strokeDashoffset={mounted ? undefined : 600}
                  style={
                    mounted
                      ? {
                          animation: `cs-map-arc-draw 1.8s ease ${delay}s both`,
                        }
                      : { strokeDashoffset: 600 }
                  }
                />
              ))}

              {/* Office markers */}
              {OFFICES.map((office) => {
                const c = markerColor(office.color);
                const isActive = activeId === office.id;
                const isHovered = hoveredId === office.id;
                const isDimmed =
                  (activeId !== null || hoveredId !== null) &&
                  !isActive &&
                  !isHovered;
                const pulseDelay = `${office.index * 0.5}s`;
                const enterDelay = `${office.index * 0.15 + 0.3}s`;
                const coreR = office.color === "amber" ? 5.5 : 4.5;
                const midR = office.color === "amber" ? 13 : 10;

                return (
                  <g
                    key={office.id}
                    transform={`translate(${office.x},${office.y})`}
                    data-marker={office.id}
                    // biome-ignore lint/a11y/useSemanticElements: SVG <g> cannot contain a <button> element
                    role="button"
                    tabIndex={0}
                    aria-label={`${office.name} office`}
                    style={{
                      cursor: "pointer",
                      opacity: isDimmed ? 0.35 : 1,
                      transition: "opacity 0.25s ease",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkerClick(office.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleMarkerClick(office.id);
                      }
                    }}
                    onMouseEnter={() => setHoveredId(office.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Marker enter animation wrapper */}
                    <g
                      className="cs-map-marker"
                      style={
                        mounted
                          ? {
                              transformBox: "fill-box" as CSSProperties["transformBox"],
                              transformOrigin: "center",
                              animation: `cs-map-marker-in 0.45s cubic-bezier(0.34,1.56,0.64,1) ${enterDelay} both`,
                            }
                          : undefined
                      }
                    >
                      {/* Outer glow blob */}
                      <circle
                        cx={0}
                        cy={0}
                        r={office.color === "amber" ? 26 : 22}
                        fill={
                          office.color === "amber"
                            ? "url(#gp-glow-amber)"
                            : "url(#gp-glow-cyan)"
                        }
                        style={{ opacity: isActive || isHovered ? 1 : 0.7 }}
                      />

                      {/* Pulse ring */}
                      <circle
                        cx={0}
                        cy={0}
                        r={midR * 0.65}
                        fill={`${c}55`}
                        stroke="none"
                        className="cs-map-pulse-ring"
                        style={{
                          transformBox: "fill-box" as CSSProperties["transformBox"],
                          transformOrigin: "center",
                          animation: `cs-map-pulse 2.5s cubic-bezier(0.215,0.61,0.355,1) ${pulseDelay} infinite`,
                        }}
                      />

                      {/* Mid ring */}
                      <circle
                        cx={0}
                        cy={0}
                        r={midR}
                        fill={`${c}18`}
                        stroke={c}
                        strokeWidth={isActive || isHovered ? 1.8 : 1.2}
                        style={{ transition: "stroke-width 0.2s ease" }}
                      />

                      {/* Core dot */}
                      <circle
                        cx={0}
                        cy={0}
                        r={isActive || isHovered ? coreR * 1.2 : coreR}
                        fill={c}
                        filter="url(#gp-core-glow)"
                        style={{ transition: "r 0.2s ease" }}
                      />

                      {/* HQ badge */}
                      {office.id === "hq" && (
                        <>
                          <rect
                            x={-11}
                            y={-29}
                            width={22}
                            height={13}
                            rx={3}
                            fill={AMBER}
                          />
                          <text
                            x={0}
                            y={-19}
                            textAnchor="middle"
                            fontSize={7.5}
                            fontWeight={700}
                            fill="#000"
                            style={{ fontFamily: "var(--font-sans)" }}
                          >
                            HQ
                          </text>
                        </>
                      )}

                      {/* City label — hidden below md via SVG class */}
                      <text
                        x={office.labelOffset.x}
                        y={office.labelOffset.y}
                        textAnchor="start"
                        fontSize={8.5}
                        fill="rgba(255,255,255,0.75)"
                        fontWeight={500}
                        className="hidden md:block"
                        style={{ fontFamily: "var(--font-sans)" }}
                      >
                        {office.name.split("—")[1]?.trim() ?? office.name}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>

            {/* ── Tooltip ─────────────────────────────────────────────────── */}
            {visibleOffice && (
              <div
                role="tooltip"
                aria-live="polite"
                className="cs-map-tooltip pointer-events-none absolute z-20"
                style={{
                  left: `${(visibleOffice.x / 1000) * 100}%`,
                  top: `${(visibleOffice.y / 460) * 100}%`,
                  transform: visibleOffice.tooltipTransform,
                  animation: "cs-map-tooltip-in 0.18s ease both",
                }}
                key={visibleOffice.id}
              >
                <div
                  className="overflow-hidden rounded-2xl"
                  style={{
                    width: "220px",
                    background: "#fff",
                    boxShadow:
                      "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(44,193,235,0.25)",
                  }}
                >
                  {/* Landmark photo */}
                  <div className="relative" style={{ height: "128px" }}>
                    <Image
                      src={visibleOffice.landmark}
                      alt={visibleOffice.landmarkAlt}
                      fill
                      sizes="220px"
                      className="object-cover"
                    />
                  </div>

                  {/* Text body */}
                  <div className="px-4 pb-4 pt-3">
                    <p
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "var(--fs-eyebrow)",
                        fontWeight: 600,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: CYAN,
                        marginBottom: "3px",
                      }}
                    >
                      {visibleOffice.country}
                    </p>
                    <p
                      className="font-display"
                      style={{
                        fontSize: "var(--fs-h4)",
                        fontWeight: 700,
                        color: "#111",
                        lineHeight: 1.2,
                        marginBottom: "6px",
                      }}
                    >
                      {visibleOffice.name}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "var(--fs-caption)",
                        color: "#64748b",
                        lineHeight: 1.5,
                      }}
                    >
                      {visibleOffice.address}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Reveal>

        {/* ── Legend ribbon ─────────────────────────────────────────────── */}
        <ul
          className="mt-8 flex list-none flex-wrap justify-center gap-3 p-0"
          aria-label="Office locations"
        >
          {OFFICES.map((office) => {
            const isActive = activeId === office.id;
            const c = markerColor(office.color);

            return (
              <li key={office.id}>
                <button
                  type="button"
                  data-pill={office.id}
                  aria-pressed={isActive}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkerClick(office.id);
                  }}
                  onMouseEnter={() => setHoveredId(office.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="flex items-center gap-2 rounded-full px-4 py-2 transition-all duration-200"
                  style={{
                    border: `1.5px solid ${
                      isActive ? c : "rgba(255,255,255,0.12)"
                    }`,
                    background: isActive
                      ? `${c}22`
                      : "rgba(255,255,255,0.06)",
                    color: isActive ? "#fff" : "rgba(255,255,255,0.72)",
                    boxShadow: isActive
                      ? `0 0 0 3px ${c}20`
                      : "none",
                    cursor: "pointer",
                  }}
                >
                  {/* Coloured dot */}
                  <span
                    className="block shrink-0 rounded-full"
                    style={{ width: "8px", height: "8px", background: c }}
                  />
                  {/* Label */}
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-body-sm)",
                      fontWeight: 500,
                    }}
                  >
                    {office.name}
                  </span>
                  {/* HQ badge */}
                  {office.id === "hq" && (
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        background: AMBER,
                        color: "#000",
                        padding: "1px 5px",
                        borderRadius: "4px",
                        marginLeft: "-2px",
                      }}
                    >
                      HQ
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
