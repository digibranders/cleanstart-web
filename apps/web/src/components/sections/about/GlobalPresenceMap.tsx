"use client";

import { useRef, useState, useCallback } from "react";
import MapGL, { Marker, NavigationControl, Source, Layer } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
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

const INITIAL_VIEW = {
  longitude: 15,
  latitude: 22,
  zoom: 1.8,
  pitch: 35,
  bearing: 0,
} as const;

const PIN_FILL: Record<"amber" | "cyan", string> = {
  amber: "#FBB824",
  cyan: "#2CC1EB",
};

// GeoJSON labels for the 3 countries where CleanStart has offices.
// Positioned at each country's geographic centre (not the office city).
const OFFICE_COUNTRY_GEOJSON = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [-98.0, 39.5] as [number, number] },
      properties: { name: "United States" },
    },
    {
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [80.0, 22.5] as [number, number] },
      properties: { name: "India" },
    },
    {
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [103.8, 1.35] as [number, number] },
      properties: { name: "Singapore" },
    },
  ],
};

// ─── Component ────────────────────────────────────────────────────────────────

export function GlobalPresenceMap({ offices }: GlobalPresenceMapProps) {
  const mapRef = useRef<MapRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredOffice, setHoveredOffice] = useState<Office | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [activeId, setActiveId] = useState<LocationId | null>(null);

  const flyToOffice = useCallback((office: Office) => {
    setActiveId(office.id);
    setHoveredOffice(null);
    setTooltipPos(null);
    mapRef.current?.flyTo({
      center: office.coordinates,
      zoom: 13,
      pitch: 60,
      bearing: -10,
      duration: 1800,
      essential: true,
    });
  }, []);

  const resetView = useCallback(() => {
    setActiveId(null);
    mapRef.current?.flyTo({
      center: [INITIAL_VIEW.longitude, INITIAL_VIEW.latitude],
      zoom: INITIAL_VIEW.zoom,
      pitch: INITIAL_VIEW.pitch,
      bearing: INITIAL_VIEW.bearing,
      duration: 1500,
      essential: true,
    });
  }, []);

  const handleMarkerEnter = useCallback(
    (office: Office) => {
      if (activeId) return;
      setHoveredOffice(office);
      const map = mapRef.current;
      const container = containerRef.current;
      if (!map || !container) return;
      const point = map.project(office.coordinates);
      const rect = container.getBoundingClientRect();
      setTooltipPos({ x: rect.left + point.x, y: rect.top + point.y });
    },
    [activeId],
  );

  const handleMarkerLeave = useCallback(() => {
    setHoveredOffice(null);
    setTooltipPos(null);
  }, []);

  // Hide every country label that the Liberty tile style renders, then overlay
  // our own labels so only office countries are visible.
  const handleMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const style = map.getStyle();
    if (!style?.layers) return;
    for (const layer of style.layers) {
      if (layer.type !== "symbol") continue;
      const id = layer.id.toLowerCase();
      if (
        id.includes("country") ||
        id.includes("state-label") ||
        id.includes("place-state") ||
        id.includes("place-country")
      ) {
        map.setLayoutProperty(layer.id, "visibility", "none");
      }
    }
  }, []);

  return (
    /* Outer wrapper — position:relative so the fixed tooltip aligns correctly */
    <div className="relative" ref={containerRef}>
      {/* Map box with overflow:hidden restores rounded corners cleanly */}
      <div
        className="overflow-hidden"
        style={{
          height: 520,
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow:
            "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06) inset",
        }}
      >
        <MapGL
          ref={mapRef}
          initialViewState={INITIAL_VIEW}
          mapStyle="https://tiles.openfreemap.org/styles/liberty"
          style={{ width: "100%", height: "100%" }}
          maxZoom={15}
          minZoom={1.2}
          attributionControl={false}
          doubleClickZoom={false}
          scrollZoom={false}
          onLoad={handleMapLoad}
        >
          <NavigationControl position="top-right" visualizePitch />

          {/* Custom country labels — only for the 3 countries with offices */}
          <Source id="office-country-labels" type="geojson" data={OFFICE_COUNTRY_GEOJSON}>
            <Layer
              id="office-country-names"
              type="symbol"
              layout={{
                "text-field": ["get", "name"],
                "text-font": ["Noto Sans Bold"],
                "text-size": 11,
                "text-letter-spacing": 0.08,
                "text-transform": "uppercase",
                "text-anchor": "center",
                "text-max-width": 6,
              }}
              paint={{
                "text-color": "#444444",
                "text-halo-color": "rgba(255,255,255,0.9)",
                "text-halo-width": 1.5,
              }}
            />
          </Source>

          {offices.map((office) => {
            const fill = PIN_FILL[office.color];
            const isActive = activeId === office.id;

            return (
              <Marker
                key={office.id}
                longitude={office.coordinates[0]}
                latitude={office.coordinates[1]}
                anchor="center"
                onClick={() => flyToOffice(office)}
              >
                <button
                  type="button"
                  aria-label={`${office.city}, ${office.country} — click to zoom`}
                  onMouseEnter={() => handleMarkerEnter(office)}
                  onMouseLeave={handleMarkerLeave}
                  style={{
                    cursor: "pointer",
                    position: "relative",
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "none",
                    border: "none",
                    padding: 0,
                  }}
                >
                  {/* pulse ring */}
                  <span
                    className="gp-marker-pulse-ring"
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      background: `${fill}44`,
                      animation: isActive
                        ? "none"
                        : "gp-marker-pulse 2.4s ease-out infinite",
                    }}
                  />
                  {/* outer ring */}
                  <span
                    style={{
                      position: "absolute",
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      border: `2px solid ${fill}`,
                      boxShadow: "0 0 0 1.5px rgba(255,255,255,0.6)",
                      opacity: 0.85,
                    }}
                  />
                  {/* core dot */}
                  <span
                    style={{
                      position: "relative",
                      width: isActive ? 14 : 11,
                      height: isActive ? 14 : 11,
                      borderRadius: "50%",
                      background: fill,
                      transition: "width 0.2s ease, height 0.2s ease",
                      boxShadow: `0 0 0 2px rgba(255,255,255,0.9), 0 0 10px 4px ${fill}88`,
                    }}
                  />
                </button>
              </Marker>
            );
          })}
        </MapGL>

        {/* controls shown after zooming into a city */}
        {activeId && (() => {
          const activeOffice = offices.find((o) => o.id === activeId);
          const mapsUrl = activeOffice
            ? `https://www.google.com/maps?q=${activeOffice.coordinates[1]},${activeOffice.coordinates[0]}`
            : null;
          const btnStyle: React.CSSProperties = {
            background: "rgba(8,12,24,0.88)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 24,
            padding: "8px 18px",
            color: "rgba(255,255,255,0.9)",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 7,
            letterSpacing: "0.02em",
            textDecoration: "none",
          };
          return (
            <div
              style={{
                position: "absolute",
                bottom: 20,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: 8,
                zIndex: 10,
              }}
            >
              <button type="button" onClick={resetView} style={btnStyle}>
                <span style={{ fontSize: 14, lineHeight: 1 }}>←</span>
                World view
              </button>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={btnStyle}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Navigate
                </a>
              )}
            </div>
          );
        })()}
      </div>

      {/* Tooltip — position:fixed escapes every overflow container */}
      {hoveredOffice && tooltipPos && (
        <div
          style={{
            position: "fixed",
            left: tooltipPos.x - 120,
            top: tooltipPos.y - 20,
            transform: "translateY(-100%)",
            width: 240,
            background: "rgba(8,12,24,0.95)",
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
          {/* location image */}
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
            <div
              style={{ position: "absolute", bottom: 10, left: 12, right: 12 }}
            >
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

          {/* address */}
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
