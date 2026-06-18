"use client";

import { useState, useCallback } from "react";
import { ComposableMap, Geographies, Geography, Marker, useMapContext } from "react-simple-maps";
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

// Countries with offices — highlighted with a brighter fill
const OFFICE_COUNTRIES = new Set([
  "United States of America",
  "India",
]);

const PIN_FILL: Record<"amber" | "cyan", string> = {
  amber: "#FBB824",
  cyan: "#FFFFFF",
};

// Staggered pulse delays — deterministic, no hydration mismatch
const PULSE_DELAY: Record<LocationId, string> = {
  hq: "0s",
  ahmedabad: "0.7s",
  bengaluru: "1.4s",
  singapore: "0.35s",
};

// Country centroid labels — only office countries
const COUNTRY_LABELS: { name: string; coords: [number, number] }[] = [
  { name: "UNITED STATES", coords: [-97, 40] },
  { name: "INDIA", coords: [80, 22] },
  { name: "SINGAPORE", coords: [103.8, 3.4] },
];

// Each arc gets its own lift factor so they fan out vertically instead of bundling
const CONNECTION_ARCS: { from: LocationId; to: LocationId; liftFactor: number }[] = [
  { from: "hq",       to: "bengaluru", liftFactor: 0.42 }, // high sweep over N. Atlantic
  { from: "hq",       to: "singapore", liftFactor: 0.18 }, // flatter path, clearly below
  { from: "bengaluru",to: "singapore", liftFactor: 0.30 }, // medium hop
];

// ─── Curved arc (quadratic Bezier) using the map projection ──────────────────

interface CurvedArcProps {
  from: [number, number];
  to: [number, number];
  liftFactor?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  opacity?: number;
}

function CurvedArc({
  from,
  to,
  liftFactor = 0.28,
  stroke = "rgba(44,193,235,0.45)",
  strokeWidth = 1,
  strokeDasharray = "4 5",
  opacity = 1,
}: CurvedArcProps) {
  const ctx = useMapContext() as {
    projection: (c: [number, number]) => [number, number] | null;
  };

  const p1 = ctx.projection(from);
  const p2 = ctx.projection(to);
  if (!p1 || !p2) return null;

  const [x1, y1] = p1;
  const [x2, y2] = p2;

  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const lift = Math.max(20, dist * liftFactor);
  const cy = my - lift;

  return (
    <path
      d={`M ${x1},${y1} Q ${mx},${cy} ${x2},${y2}`}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      strokeLinecap="round"
      fill="none"
      opacity={opacity}
    />
  );
}

// ─── All arcs — rendered inside ComposableMap so useMapContext works ──────────

function ConnectionArcs({ offices }: { offices: Office[] }) {
  const byId = Object.fromEntries(offices.map((o) => [o.id, o])) as Record<
    LocationId,
    Office
  >;

  return (
    <>
      {CONNECTION_ARCS.map(({ from, to, liftFactor }) => {
        const oA = byId[from];
        const oB = byId[to];
        if (!oA || !oB) return null;
        return (
          <CurvedArc
            key={`${from}-${to}`}
            from={oA.coordinates}
            to={oB.coordinates}
            liftFactor={liftFactor}
          />
        );
      })}
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GlobalPresenceMap({ offices }: GlobalPresenceMapProps) {
  const [hoveredOffice, setHoveredOffice] = useState<Office | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const handleEnter = useCallback((office: Office, e: React.MouseEvent) => {
    setHoveredOffice(office);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleLeave = useCallback(() => {
    setHoveredOffice(null);
    setTooltipPos(null);
  }, []);

  return (
    <div className="relative w-full" style={{ maxWidth: 1100, margin: "0 auto" }}>
      <ComposableMap
        width={1100}
        height={480}
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 275, center: [5, 10] }}
        style={{ width: "100%", height: "auto" }}
      >
        <defs>
          {/* Amber glow filter */}
          <filter id="glow-amber" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Cyan glow filter */}
          <filter id="glow-cyan" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Land masses */}
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const highlighted = OFFICE_COUNTRIES.has(geo.properties?.name as string);
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={highlighted ? "#3a6fef" : "#1d3e96"}
                  stroke={highlighted ? "#5585ff" : "#2a52c0"}
                  strokeWidth={highlighted ? 0.6 : 0.3}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>

        {/* Curved dotted arcs — rendered inside ComposableMap so projection works */}
        <ConnectionArcs offices={offices} />

        {/* Country name labels */}
        {COUNTRY_LABELS.map(({ name, coords }) => (
          <Marker key={name} coordinates={coords}>
            <text
              textAnchor="middle"
              style={{
                fontSize: 7,
                fontWeight: 700,
                letterSpacing: "0.1em",
                fill: "rgba(255,255,255,0.32)",
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
              {/* Outer pulse ring */}
              <circle
                r={22}
                fill="none"
                stroke={fill}
                strokeWidth={0.6}
                className="gp-svg-pulse"
                style={{ animationDelay: PULSE_DELAY[office.id] }}
              />
              {/* Secondary pulse ring */}
              <circle
                r={14}
                fill="none"
                stroke={fill}
                strokeWidth={0.8}
                className="gp-svg-pulse"
                style={{
                  animationDelay: `calc(${PULSE_DELAY[office.id]} + 0.5s)`,
                  animationDuration: "2.1s",
                }}
              />
              {/* Static halo disc */}
              <circle r={8} fill={`${fill}20`} stroke={fill} strokeWidth={0.7} opacity={0.75} />
              {/* Core dot with glow */}
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
            boxShadow:
              "0 24px 64px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04) inset",
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
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.6,
              }}
            >
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
