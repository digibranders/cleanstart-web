"use client";

import { useState, useCallback } from "react";
import { ComposableMap, Geographies, Geography, Marker, Line } from "react-simple-maps";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

type LocationId = "hq" | "ahmedabad" | "bengaluru" | "singapore";

export interface Office {
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

interface GlobalPresenceMapProps {
  offices: Office[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GEO_URL = "/data/world-110m.json";

const PIN_FILL: Record<"amber" | "cyan", string> = {
  amber: "#FBB824",
  cyan: "#2CC1EB",
};

// Staggered pulse delays — deterministic to avoid hydration mismatch
const PULSE_DELAY: Record<LocationId, string> = {
  hq: "0s",
  ahmedabad: "0.7s",
  bengaluru: "1.4s",
  singapore: "0.35s",
};

// Country centroid labels — only for the 3 countries with offices
const COUNTRY_LABELS: { name: string; coords: [number, number] }[] = [
  { name: "UNITED STATES", coords: [-97, 40] },
  { name: "INDIA", coords: [80, 22] },
  { name: "SINGAPORE", coords: [103.8, 3.0] },
];

function buildConnections(
  offices: Office[],
): { from: [number, number]; to: [number, number]; key: string }[] {
  const hq = offices.find((o) => o.id === "hq");
  if (!hq) return [];
  const lines: { from: [number, number]; to: [number, number]; key: string }[] = [];
  for (const o of offices) {
    if (o.id !== "hq") {
      lines.push({ from: hq.coordinates, to: o.coordinates, key: `hq-${o.id}` });
    }
  }
  const ahm = offices.find((o) => o.id === "ahmedabad");
  const ben = offices.find((o) => o.id === "bengaluru");
  if (ahm && ben) {
    lines.push({ from: ahm.coordinates, to: ben.coordinates, key: "ahm-ben" });
  }
  return lines;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GlobalPresenceMap({ offices }: GlobalPresenceMapProps) {
  const [hoveredOffice, setHoveredOffice] = useState<Office | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const connections = buildConnections(offices);

  const handleEnter = useCallback(
    (office: Office, e: React.MouseEvent) => {
      setHoveredOffice(office);
      setTooltipPos({ x: e.clientX, y: e.clientY });
    },
    [],
  );

  const handleLeave = useCallback(() => {
    setHoveredOffice(null);
    setTooltipPos(null);
  }, []);

  return (
    <div className="relative w-full" style={{ maxWidth: 1100, margin: "0 auto" }}>
      <ComposableMap
        width={1100}
        height={500}
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 170, center: [12, 10] }}
        style={{ width: "100%", height: "auto" }}
      >
        <defs>
          {/* Glow filters for each dot colour */}
          <filter id="glow-amber" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-cyan" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Land masses — dark indigo, slightly lighter than the section bg */}
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#1c2d82"
                stroke="#2a3ea0"
                strokeWidth={0.35}
                style={{
                  default: { outline: "none" },
                  hover: { outline: "none" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {/* Connection arcs between HQ and each office (+ Ahmedabad–Bengaluru) */}
        {connections.map(({ from, to, key }) => (
          <Line
            key={key}
            from={from}
            to={to}
            stroke="rgba(44,193,235,0.28)"
            strokeWidth={1}
            strokeDasharray="3 5"
            strokeLinecap="round"
          />
        ))}

        {/* Country name labels — SVG text, no tile font dependency */}
        {COUNTRY_LABELS.map(({ name, coords }) => (
          <Marker key={name} coordinates={coords}>
            <text
              textAnchor="middle"
              style={{
                fontSize: 7,
                fontWeight: 700,
                letterSpacing: "0.1em",
                fill: "rgba(255,255,255,0.28)",
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              {name}
            </text>
          </Marker>
        ))}

        {/* Office markers */}
        {offices.map((office) => {
          const fill = PIN_FILL[office.color];
          const isHovered = hoveredOffice?.id === office.id;

          return (
            <Marker
              key={office.id}
              coordinates={office.coordinates}
              onMouseEnter={(e) => handleEnter(office, e as unknown as React.MouseEvent)}
              onMouseLeave={handleLeave}
              style={{ cursor: "pointer" }}
            >
              {/* Outermost pulse ring — animated */}
              <circle
                r={22}
                fill="none"
                stroke={fill}
                strokeWidth={0.6}
                className="gp-svg-pulse"
                style={{ animationDelay: PULSE_DELAY[office.id] }}
              />
              {/* Secondary ring */}
              <circle
                r={14}
                fill="none"
                stroke={fill}
                strokeWidth={0.8}
                className="gp-svg-pulse"
                style={{
                  animationDelay: `calc(${PULSE_DELAY[office.id]} + 0.4s)`,
                  animationDuration: "2s",
                }}
              />
              {/* Static halo disc */}
              <circle r={8} fill={`${fill}22`} stroke={fill} strokeWidth={0.6} opacity={0.7} />
              {/* Core dot */}
              <circle
                r={isHovered ? 5.5 : 4}
                fill={fill}
                filter={`url(#glow-${office.color})`}
                style={{ transition: "r 0.15s ease" }}
              />
            </Marker>
          );
        })}
      </ComposableMap>

      {/* Tooltip — fixed so it escapes all overflow contexts */}
      {hoveredOffice && tooltipPos && (
        <div
          style={{
            position: "fixed",
            left: tooltipPos.x - 120,
            top: tooltipPos.y - 20,
            transform: "translateY(-100%)",
            width: 240,
            background: "rgba(8,12,24,0.96)",
            backdropFilter: "blur(20px) saturate(1.4)",
            WebkitBackdropFilter: "blur(20px) saturate(1.4)",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.1)",
            overflow: "hidden",
            boxShadow: "0 24px 64px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04) inset",
            zIndex: 9999,
            pointerEvents: "none",
          }}
        >
          {/* Location image */}
          <div style={{ position: "relative", height: 140 }}>
            <Image
              src={hoveredOffice.imageSrc}
              alt={hoveredOffice.city}
              fill
              style={{ objectFit: "cover" }}
              sizes="240px"
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top, rgba(8,12,24,0.92) 0%, rgba(8,12,24,0.1) 60%, transparent 100%)",
              }}
            />
            <div style={{ position: "absolute", bottom: 10, left: 12, right: 12 }}>
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 15,
                  color: "#fff",
                  lineHeight: 1.2,
                }}
              >
                {hoveredOffice.city}
              </p>
              <p
                style={{
                  margin: "3px 0 0",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: PIN_FILL[hoveredOffice.color],
                }}
              >
                {hoveredOffice.role}
              </p>
            </div>
          </div>
          {/* Address */}
          <div style={{ padding: "10px 12px 13px" }}>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
              {hoveredOffice.address}
            </p>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 10,
                color: "rgba(255,255,255,0.25)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {hoveredOffice.country}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
