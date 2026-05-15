"use client";

import { useReducedMotion } from "motion/react";
import Image from "next/image";

type Direction = "in" | "out";

type Track = {
  id: "in-top" | "in-bot" | "out-top" | "out-bot";
  dir: Direction;
};

const TRACKS: Track[] = [
  { id: "in-top", dir: "in" },
  { id: "in-bot", dir: "in" },
  { id: "out-top", dir: "out" },
  { id: "out-bot", dir: "out" },
];

const IN_LOGOS = [
  "nginx.svg",
  "postgres.svg",
  "redis.svg",
  "kafka.svg",
  "mongodb.svg",
  "python.svg",
  "node.svg",
  "mysql.svg",
];

const OUT_LOGOS = [
  "helm.svg",
  "prometheus.svg",
  "grafana.svg",
  "vault-k8s.svg",
  "envoy.svg",
  "consul.svg",
  "etcd.svg",
  "keycloak.svg",
];

const CHIPS_PER_TRACK = 5;
const DURATION = 11;

type Chip = {
  key: string;
  trackId: Track["id"];
  dir: Direction;
  logo: string;
  delay: number;
};

function buildChips(): Chip[] {
  const chips: Chip[] = [];
  TRACKS.forEach((track, ti) => {
    const pool = track.dir === "in" ? IN_LOGOS : OUT_LOGOS;
    const interval = DURATION / CHIPS_PER_TRACK;
    const trackOffset = ti % 2 === 0 ? 0 : interval / 2;
    for (let i = 0; i < CHIPS_PER_TRACK; i++) {
      chips.push({
        key: `${track.id}-${i}`,
        trackId: track.id,
        dir: track.dir,
        logo: pool[(i + ti * 2) % pool.length]!,
        delay: -(i * interval) - trackOffset,
      });
    }
  });
  return chips;
}

/**
 * Hero orb stage — pixel-faithful reproduction of Figma frame
 * CleanStart V4 → Home page → Frame 2147238430.
 *
 * Centre orb is a single 1:1 PNG export of Figma node 177:142
 * (Group 2085662909, 309×420). The export bakes in every layer the
 * Figma comp uses — sphere fills, specular highlights, luminosity-blended
 * cube logo, drop shadow — so no CSS reproduction is needed.
 * Beams + chip motion remain SVG so they can animate.
 */
export function HeroOrb() {
  const reduced = useReducedMotion();
  const chips = buildChips();

  return (
    <div className="cs-orb-stage" aria-hidden>
      <svg
        className="cs-orb-flow"
        viewBox="0 0 1280 460"
        preserveAspectRatio="xMidYMid meet"
        role="presentation"
      >
        <defs>
          {/* Straight motion paths along the beam axes — chips ride these. */}
          <path id="cs-path-in-top" d="M -100 50 L 540 218" fill="none" />
          <path id="cs-path-in-bot" d="M -100 410 L 540 242" fill="none" />
          <path id="cs-path-out-top" d="M 740 218 L 1380 50" fill="none" />
          <path id="cs-path-out-bot" d="M 740 242 L 1380 410" fill="none" />

          {/* Beam fill — bright at the apex (orb side), fading out at the
              wide end. Matches Figma's high-opacity wash. */}
          <linearGradient
            id="cs-beam-in"
            x1="-100"
            y1="230"
            x2="640"
            y2="230"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.05" />
            <stop offset="0.30" stopColor="#FFFFFF" stopOpacity="0.32" />
            <stop offset="0.70" stopColor="#FFFFFF" stopOpacity="0.62" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.92" />
          </linearGradient>
          <linearGradient
            id="cs-beam-out"
            x1="640"
            y1="230"
            x2="1380"
            y2="230"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.92" />
            <stop offset="0.30" stopColor="#FFFFFF" stopOpacity="0.62" />
            <stop offset="0.70" stopColor="#FFFFFF" stopOpacity="0.32" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.05" />
          </linearGradient>

          {/* Three blur tiers for volumetric depth */}
          <filter id="cs-beam-blur-soft" x="-20%" y="-80%" width="140%" height="260%">
            <feGaussianBlur stdDeviation="20" />
          </filter>
          <filter id="cs-beam-blur-mid" x="-15%" y="-60%" width="130%" height="220%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
          <filter id="cs-beam-blur-core" x="-10%" y="-30%" width="120%" height="160%">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>
        </defs>

        {/* TRIANGULAR LIGHT BEAMS — 3 layers per beam (soft halo / mid body /
            tight core). Apex at the orb edge (~640,230), wide end at stage
            edges (-100 / 1380). */}

        <g filter="url(#cs-beam-blur-soft)" opacity="0.65">
          <polygon points="-120,-30 -120,200 640,228 640,232" fill="url(#cs-beam-in)" />
          <polygon points="-120,490 -120,260 640,232 640,228" fill="url(#cs-beam-in)" />
          <polygon points="640,228 640,232 1400,200 1400,-30" fill="url(#cs-beam-out)" />
          <polygon points="640,232 640,228 1400,490 1400,260" fill="url(#cs-beam-out)" />
        </g>

        <g filter="url(#cs-beam-blur-mid)" opacity="0.95">
          <polygon points="-100,20 -100,160 630,228 630,232" fill="url(#cs-beam-in)" />
          <polygon points="-100,440 -100,300 630,232 630,228" fill="url(#cs-beam-in)" />
          <polygon points="650,228 650,232 1380,160 1380,20" fill="url(#cs-beam-out)" />
          <polygon points="650,232 650,228 1380,440 1380,300" fill="url(#cs-beam-out)" />
        </g>

        <g filter="url(#cs-beam-blur-core)">
          <polygon points="-80,60 -80,95 625,228 625,232" fill="url(#cs-beam-in)" />
          <polygon points="-80,400 -80,365 625,232 625,228" fill="url(#cs-beam-in)" />
          <polygon points="655,228 655,232 1360,95 1360,60" fill="url(#cs-beam-out)" />
          <polygon points="655,232 655,228 1360,365 1360,400" fill="url(#cs-beam-out)" />
        </g>

        {!reduced &&
          chips.map((chip) => {
            const opacityValues =
              chip.dir === "in" ? "0; 1; 1; 0; 0" : "0; 0; 1; 1; 0";
            const opacityKeyTimes =
              chip.dir === "in"
                ? "0; 0.12; 0.78; 0.95; 1"
                : "0; 0.05; 0.18; 0.82; 1";
            return (
              <g key={chip.key} opacity={0}>
                <animate
                  attributeName="opacity"
                  values={opacityValues}
                  keyTimes={opacityKeyTimes}
                  dur={`${DURATION}s`}
                  begin={`${chip.delay}s`}
                  repeatCount="indefinite"
                />
                <animateMotion
                  dur={`${DURATION}s`}
                  begin={`${chip.delay}s`}
                  repeatCount="indefinite"
                  rotate="0"
                  calcMode="linear"
                >
                  <mpath href={`#cs-path-${chip.trackId}`} />
                </animateMotion>
                <foreignObject
                  x={-36}
                  y={-36}
                  width={72}
                  height={72}
                  overflow="visible"
                >
                  <div
                    className={`cs-flow-chip ${chip.dir === "in" ? "is-in" : "is-out"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/images/trusted/${chip.logo}`} alt="" />
                  </div>
                </foreignObject>
              </g>
            );
          })}
      </svg>

      {/* Centre orb — Figma node 177:142 split into two layers so the cube
          (177:154) can rotate subtly inside the static sphere. */}
      <div className="cs-orb">
        <Image
          src="/images/hero/orb-sphere.png"
          alt=""
          width={1040}
          height={1250}
          priority
          sizes="(min-width: 1024px) 320px, 38vw"
          className="cs-orb__img"
        />
        <Image
          src="/images/hero/orb-cube.png"
          alt=""
          width={456}
          height={462}
          priority
          sizes="(min-width: 1024px) 95px, 11vw"
          className="cs-orb__cube"
        />
      </div>
    </div>
  );
}
