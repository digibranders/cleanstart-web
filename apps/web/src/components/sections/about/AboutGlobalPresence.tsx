"use client";

import { useRef, useState, useCallback } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { Reveal } from "@/components/ui/Reveal";

// ─── Types ────────────────────────────────────────────────────────────────────

type LocationId = "hq" | "ahmedabad" | "bengaluru" | "singapore";

interface Office {
  id: LocationId;
  city: string;
  country: string;
  role: string;
  address: string;
  color: "amber" | "cyan";
  /** [longitude, latitude] */
  coordinates: [number, number];
  imageSrc: string;
}

interface TooltipState {
  office: Office;
  /** px from container left edge */
  left: number;
  /** px from container top edge */
  top: number;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const OFFICES: Office[] = [
  {
    id: "hq",
    city: "Lewes, Delaware",
    country: "United States",
    role: "Headquarters",
    address: "8 The Green, Suite A, Dover, DE 19901",
    color: "amber",
    coordinates: [-75.5, 38.9],
    imageSrc: "/images/about/global/landmark-delaware.jpg",
  },
  {
    id: "ahmedabad",
    city: "Ahmedabad",
    country: "India",
    role: "Engineering Hub",
    address: "SG Highway, Ahmedabad, Gujarat 380054",
    color: "cyan",
    coordinates: [72.6, 23.0],
    imageSrc: "/images/about/global/landmark-ahmedabad.jpg",
  },
  {
    id: "bengaluru",
    city: "Bengaluru",
    country: "India",
    role: "Engineering Hub",
    address: "Whitefield, Bengaluru, Karnataka 560066",
    color: "cyan",
    coordinates: [77.6, 13.0],
    imageSrc: "/images/about/global/landmark-bengaluru.jpg",
  },
  {
    id: "singapore",
    city: "Singapore",
    country: "Singapore",
    role: "APAC Operations",
    address: "One Raffles Place, Singapore 048616",
    color: "cyan",
    coordinates: [103.8, 1.4],
    imageSrc: "/images/about/global/landmark-singapore.jpg",
  },
];

const GUIDE_LINES_X = [323, 726, 759, 1164, 1195, 1599] as const;
const CYAN = "#2cc1eb";
const AMBER = "#f59e0b";
const GEO_URL = "/world-110m.json";

function markerColor(color: "amber" | "cyan"): string {
  return color === "amber" ? AMBER : CYAN;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AboutGlobalPresence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const handleEnter = useCallback(
    (office: Office, e: React.MouseEvent<SVGGElement>) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      setTooltip({
        office,
        left: e.clientX - rect.left,
        top: e.clientY - rect.top,
      });
    },
    [],
  );

  const handleLeave = useCallback(() => setTooltip(null), []);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%)",
      }}
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
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-[100px] pb-16">

        {/* Heading */}
        <div className="mx-auto flex max-w-[840px] flex-col items-center gap-5 text-center text-white mb-12 lg:mb-16">
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
              From the Americas to Southeast Asia, CleanStart&apos;s team is
              building trusted software foundations globally.
            </p>
          </Reveal>
        </div>

        {/* ── Map ──────────────────────────────────────────────────────────── */}
        <Reveal delay={0.3}>
          {/* container ref used for tooltip positioning */}
          <div
            ref={containerRef}
            className="relative mx-auto w-full"
            style={{ maxWidth: "1100px" }}
          >
            <ComposableMap
              width={1000}
              height={490}
              projection="geoEqualEarth"
              projectionConfig={{ scale: 195, center: [10, 5] }}
              style={{ width: "100%", height: "auto", display: "block" }}
            >
              <defs>
                {/* Pin glow */}
                <filter
                  id="gp-pin-glow"
                  x="-100%"
                  y="-100%"
                  width="300%"
                  height="300%"
                >
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* ── Country fills — ghost style on section bg ──────────── */}
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      style={{
                        default: {
                          fill: "rgba(255,255,255,0.05)",
                          stroke: "rgba(255,255,255,0.18)",
                          strokeWidth: 0.5,
                          outline: "none",
                        },
                        hover: {
                          fill: "rgba(255,255,255,0.05)",
                          outline: "none",
                        },
                        pressed: {
                          fill: "rgba(255,255,255,0.05)",
                          outline: "none",
                        },
                      }}
                    />
                  ))
                }
              </Geographies>

              {/* ── Office pin markers ────────────────────────────────────── */}
              {OFFICES.map((o, i) => {
                const c = markerColor(o.color);
                const pulseDur = o.color === "amber" ? "2.2s" : "2s";
                const pulseBegin = `${i * 0.45}s`;

                return (
                  <Marker
                    key={o.id}
                    coordinates={o.coordinates}
                    onMouseEnter={(e) => handleEnter(o, e)}
                    onMouseLeave={handleLeave}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Outer pulse ring */}
                    <circle r={5} fill={c} opacity={0.55}>
                      <animate
                        attributeName="r"
                        from="5"
                        to="18"
                        dur={pulseDur}
                        begin={pulseBegin}
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        from="0.55"
                        to="0"
                        dur={pulseDur}
                        begin={pulseBegin}
                        repeatCount="indefinite"
                      />
                    </circle>
                    {/* Mid ring */}
                    <circle
                      r={7}
                      fill="none"
                      stroke={c}
                      strokeWidth={1.2}
                      opacity={0.4}
                    />
                    {/* Core dot */}
                    <circle r={4.5} fill={c} filter="url(#gp-pin-glow)" />
                    {/* Invisible hit area — must be last to sit on top */}
                    <circle
                      r={18}
                      fill="rgba(0,0,0,0.001)"
                      style={{ cursor: "pointer" }}
                    />
                  </Marker>
                );
              })}
            </ComposableMap>

            {/* ── Hover tooltip ─────────────────────────────────────────── */}
            {tooltip && (() => {
              const c = markerColor(tooltip.office.color);
              // Flip horizontally if pin is in the right 55% of the container
              // to prevent tooltip from overflowing right edge
              const containerW = containerRef.current?.offsetWidth ?? 1100;
              const flipLeft = tooltip.left > containerW * 0.55;
              const translateX = flipLeft ? "calc(-100% + 16px)" : "-16px";

              return (
                <div
                  className="pointer-events-none absolute z-20"
                  style={{
                    left: tooltip.left,
                    top: tooltip.top,
                    transform: `translate(${translateX}, calc(-100% - 18px))`,
                  }}
                >
                  <div
                    style={{
                      width: "200px",
                      background: "rgba(8, 14, 38, 0.88)",
                      backdropFilter: "blur(18px)",
                      WebkitBackdropFilter: "blur(18px)",
                      border: `1px solid ${c}44`,
                      borderRadius: "12px",
                      overflow: "hidden",
                      boxShadow: `0 10px 40px rgba(0,0,0,0.65), 0 0 0 1px ${c}22`,
                    }}
                  >
                    {/* Location image */}
                    <div
                      style={{
                        width: "100%",
                        height: "118px",
                        overflow: "hidden",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={tooltip.office.imageSrc}
                        alt={tooltip.office.city}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>

                    {/* Colored accent line below image */}
                    <div
                      style={{
                        height: "1.5px",
                        background: `linear-gradient(90deg, ${c}00, ${c}, ${c}00)`,
                      }}
                    />

                    {/* Text */}
                    <div style={{ padding: "10px 12px 12px" }}>
                      <p
                        className="font-display"
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#fff",
                          marginBottom: "3px",
                          lineHeight: 1.2,
                        }}
                      >
                        {tooltip.office.city}
                      </p>
                      <p
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          color: c,
                          fontFamily: "var(--font-sans)",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        {tooltip.office.role}
                      </p>
                    </div>
                  </div>

                  {/* Arrow pointing down toward pin */}
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: "7px solid transparent",
                      borderRight: "7px solid transparent",
                      borderTop: "7px solid rgba(8, 14, 38, 0.88)",
                      marginLeft: flipLeft ? "auto" : "16px",
                      marginRight: flipLeft ? "16px" : "auto",
                    }}
                  />
                </div>
              );
            })()}
          </div>
        </Reveal>

        {/* ── Location ribbon (lg+) ────────────────────────────────────── */}
        <div
          className="mx-auto mt-5 hidden lg:flex"
          style={{
            maxWidth: "1100px",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.03)",
            overflow: "hidden",
          }}
        >
          {OFFICES.map((o, i) => {
            const c = markerColor(o.color);
            return (
              <div
                key={o.id}
                className="flex flex-1 flex-col gap-1"
                style={{
                  padding: "18px 22px",
                  borderRight:
                    i < OFFICES.length - 1
                      ? "1px solid rgba(255,255,255,0.07)"
                      : "none",
                }}
              >
                {/* Dot + city */}
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: c,
                      flexShrink: 0,
                      boxShadow: `0 0 6px 1px ${c}99`,
                      display: "inline-block",
                    }}
                  />
                  <p
                    className="font-display"
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#fff",
                      lineHeight: 1.2,
                    }}
                  >
                    {o.city}
                  </p>
                </div>

                {/* Role */}
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: c,
                    fontFamily: "var(--font-sans)",
                    letterSpacing: "0.09em",
                    textTransform: "uppercase",
                    paddingLeft: "16px",
                  }}
                >
                  {o.role}
                </p>

                {/* Address */}
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 400,
                    color: "rgba(255,255,255,0.45)",
                    fontFamily: "var(--font-sans)",
                    lineHeight: 1.4,
                    paddingLeft: "16px",
                  }}
                >
                  {o.address}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Mobile location grid (< lg) ───────────────────────────────── */}
        <ul className="mt-10 grid list-none grid-cols-2 gap-3 p-0 lg:hidden">
          {OFFICES.map((o) => {
            const c = markerColor(o.color);
            return (
              <li
                key={o.id}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  padding: "14px 16px",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: c,
                    marginBottom: "8px",
                    boxShadow: `0 0 8px 2px ${c}66`,
                  }}
                />
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-eyebrow)",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: c,
                    marginBottom: "2px",
                  }}
                >
                  {o.country}
                </p>
                <p
                  className="font-display"
                  style={{
                    fontSize: "var(--fs-h4)",
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: "3px",
                    lineHeight: 1.2,
                  }}
                >
                  {o.city}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-caption)",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  {o.role}
                </p>
              </li>
            );
          })}
        </ul>

      </div>
    </section>
  );
}
