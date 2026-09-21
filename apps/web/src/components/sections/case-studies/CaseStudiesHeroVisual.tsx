import type React from "react";

/*
 * Case-studies hero visual — "The Signed Result".
 *
 * One case study in focus, two more falling away behind it. The card in front
 * carries the whole argument of the page in shapes rather than words: a
 * jagged violet run of inherited vulnerabilities on the left, a dashed
 * adoption marker, then a cyan line that drops and stays down, with the
 * scattered findings dissolving as it goes. Underneath it, a seal and a
 * signature: a result somebody put their name to.
 *
 * Craft notes, because they are load-bearing rather than decoration:
 *  - Depth is real. The back cards are smaller, dimmer, Gaussian-blurred, and
 *    drift at a third of the front card's amplitude, so the stack reads as
 *    three planes instead of three stickers.
 *  - No skeleton bars. Grey placeholder lines are what an unfinished mockup
 *    looks like; every element here is a shape that means something (score
 *    ring, seal, signature, order ticks).
 *  - Two words of label. The rest of the site's hero visuals are textless
 *    (CisoHeroVisual), and that consistency is what cost this one its
 *    legibility: shown the chart cold, a reader asks what is plotted. An axis
 *    caption and a marker tag answer it without turning the illustration into
 *    a dashboard.
 *  - The story plays once. The entrance choreography runs a single time on
 *    load and settles; only ambient motion loops. A hero that re-enacts itself
 *    every few seconds pulls attention off the headline for the whole visit.
 *
 * Vector + CSS keyframes, scoped to `.cs-csv`. No JS, no rAF, server-rendered.
 * `prefers-reduced-motion` collapses straight to the settled frame. Not
 * decorative: it is `role="img"` with a description of what the chart shows,
 * and the hero's wrapper is deliberately not `aria-hidden` so that reaches
 * assistive tech.
 */

/** Inherited findings scattered over the "before" run. They dissolve on entry. */
const FINDINGS: readonly { x: number; y: number; r: number; hot?: boolean }[] = [
  { x: 36, y: 100, r: 3, hot: true },
  { x: 48, y: 82, r: 2.4 },
  { x: 58, y: 128, r: 2.8 },
  { x: 74, y: 90, r: 3.2, hot: true },
  { x: 84, y: 140, r: 2.4 },
  { x: 95, y: 120, r: 2.8 },
  { x: 108, y: 98, r: 3, hot: true },
];

/** Even ticks under the settled line — order, against the scatter before it. */
const ORDER_TICKS: readonly number[] = [138, 156, 174, 192, 210];

const BEFORE_LINE = "M 24 140 L 44 110 L 62 150 L 80 106 L 98 146 L 122 118";
const AFTER_LINE =
  "M 122 118 C 138 134, 147 192, 167 205 C 185 217, 205 220, 228 220";
const SIGNATURE =
  "M 72 277 C 78 258, 83 287, 90 267 C 95 253, 101 286, 108 272 C 112 263, 115 278, 121 270 " +
  "C 127 262, 130 281, 137 271 C 142 264, 145 275, 151 269 C 156 264, 159 272, 164 268 L 178 261";

/** 230° dial around (218, 42), open at the foot. The gap has to be wide enough
 *  to read as a dial; a nearly closed ring just looks like a ring. */
const GAUGE_ARC = "M 204.4 48.3 A 15 15 0 1 1 231.6 48.3";

function CardChrome({
  w,
  h,
  rx,
}: {
  w: number;
  h: number;
  rx: number;
}): React.ReactElement {
  return (
    <>
      {/* Base tint first. Glass laid straight over the bloom turns to mud and
          kills the contrast every element on the card depends on. */}
      <rect x={0} y={0} width={w} height={h} rx={rx} fill="#160f33" fillOpacity={0.42} />
      <rect x={0} y={0} width={w} height={h} rx={rx} fill="url(#csvGlass)" />
      <rect
        x={0.75}
        y={0.75}
        width={w - 1.5}
        height={h - 1.5}
        rx={rx - 0.75}
        fill="none"
        stroke="url(#csvEdge)"
        strokeWidth={1.5}
      />
      {/* Specular highlight along the top edge — what makes glass read as glass. */}
      <path
        d={`M ${rx * 0.6} 1.25 H ${w - rx * 0.6}`}
        stroke="url(#csvSheen)"
        strokeWidth={1.25}
        strokeLinecap="round"
      />
    </>
  );
}

/** Reduced-detail card for the two planes behind the focus card. */
function BackCard(): React.ReactElement {
  return (
    <>
      <CardChrome w={190} h={250} rx={20} />
      <rect x={18} y={20} width={26} height={26} rx={9} fill="url(#csvMark)" />
      <path d="M 18 58 H 172" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
      <path
        d="M 18 110 L 36 88 L 52 118 L 68 84 L 84 112 L 100 100 C 116 122, 128 158, 146 167 C 158 173, 165 175, 172 176 L 172 196 L 18 196 Z"
        fill="url(#csvAreaDim)"
      />
      <path
        d="M 18 110 L 36 88 L 52 118 L 68 84 L 84 112 L 100 100 C 116 122, 128 158, 146 167 C 158 173, 165 175, 172 176"
        fill="none"
        stroke="url(#csvLine)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M 18 198 H 172" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
      <circle
        cx={34}
        cy={222}
        r={13}
        fill="rgba(44,193,235,0.12)"
        stroke="rgba(44,193,235,0.5)"
        strokeWidth={1.2}
      />
      <path
        d="M 29 222 L 32.6 225.6 L 39 218.8"
        fill="none"
        stroke="#22e0ff"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x={56} y={218} width={58} height={6} rx={3} fill="rgba(255,255,255,0.14)" />
    </>
  );
}

export function CaseStudiesHeroVisual(): React.ReactElement {
  return (
    <>
      <style>{`
        /* ── Entrance: runs once, then holds. ───────────────────────────── */
        .cs-csv-in {
          animation: cs-csv-in 0.85s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes cs-csv-in {
          from { opacity: 0; transform: translateY(26px) scale(0.965); }
          to   { opacity: 1; transform: none; }
        }

        .cs-csv-fade { animation: cs-csv-fade 0.7s ease-out both; }
        @keyframes cs-csv-fade { from { opacity: 0; } to { opacity: 1; } }

        .cs-csv-draw {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: cs-csv-draw 0.9s cubic-bezier(0.65, 0, 0.35, 1) 0.75s both;
        }
        @keyframes cs-csv-draw { to { stroke-dashoffset: 0; } }

        .cs-csv-wipe {
          animation: cs-csv-wipe 0.9s cubic-bezier(0.65, 0, 0.35, 1) 0.78s both;
          transform-box: fill-box;
          transform-origin: left center;
        }
        @keyframes cs-csv-wipe {
          from { clip-path: inset(0 100% 0 0); }
          to   { clip-path: inset(0 0 0 0); }
        }

        /* Findings clear as the hardened line comes in. */
        .cs-csv-clear { animation: cs-csv-clear 0.75s ease-in both; }
        @keyframes cs-csv-clear {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(-9px) scale(0.4); }
        }

        .cs-csv-ring {
          stroke-dashoffset: 88;
          animation: cs-csv-ring 0.8s cubic-bezier(0.22, 1, 0.36, 1) 1.35s both;
        }
        @keyframes cs-csv-ring { to { stroke-dashoffset: 0; } }

        .cs-csv-sign {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: cs-csv-sign 0.85s cubic-bezier(0.45, 0, 0.2, 1) 1.8s both;
        }
        @keyframes cs-csv-sign { to { stroke-dashoffset: 0; } }

        /* ── Ambient: loops, quietly. ───────────────────────────────────── */
        .cs-csv-drift  { animation: cs-csv-drift 9s ease-in-out 1.2s infinite; }
        .cs-csv-drift--back {
          animation: cs-csv-drift-back 11s ease-in-out 1.2s infinite;
        }
        @keyframes cs-csv-drift {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes cs-csv-drift-back {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-3px); }
        }

        .cs-csv-halo {
          transform-box: fill-box;
          transform-origin: center;
          animation: cs-csv-halo 4.5s ease-out 2.2s infinite;
        }
        @keyframes cs-csv-halo {
          0%       { transform: scale(1);   opacity: 0.5; }
          55%, 100% { transform: scale(3.6); opacity: 0; }
        }

        .cs-csv-breathe { animation: cs-csv-breathe 5.5s ease-in-out 2.2s infinite; }
        @keyframes cs-csv-breathe {
          0%, 100% { stroke-opacity: 0.55; }
          50%      { stroke-opacity: 1; }
        }

        .cs-csv-orbit {
          transform-box: view-box;
          transform-origin: 330px 250px;
          animation: cs-csv-orbit 46s linear infinite;
        }
        @keyframes cs-csv-orbit { to { transform: rotate(360deg); } }

        @media (prefers-reduced-motion: reduce) {
          .cs-csv-in, .cs-csv-fade, .cs-csv-draw, .cs-csv-wipe, .cs-csv-ring,
          .cs-csv-sign, .cs-csv-drift, .cs-csv-drift--back, .cs-csv-halo,
          .cs-csv-breathe, .cs-csv-orbit { animation: none; }
          .cs-csv-draw, .cs-csv-ring, .cs-csv-sign { stroke-dashoffset: 0; }
          .cs-csv-clear { animation: none; opacity: 0; }
          .cs-csv-halo { opacity: 0; }
        }
      `}</style>

      <svg
        role="img"
        aria-label="A CleanStart case study shown as a card: vulnerability volume runs high and erratic before adoption, then drops and stays low afterwards, with the open findings clearing away. The result is stamped with a verification seal and a signature, and two further case studies sit behind it."
        className="cs-csv pointer-events-none select-none"
        viewBox="0 0 640 500"
        width="100%"
        height="100%"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="csvBloom" cx="50%" cy="46%" r="50%">
            <stop offset="0%" stopColor="#9a51ff" stopOpacity="0.4" />
            <stop offset="52%" stopColor="#5b2bd6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#471ec0" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="csvGround" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2cc1eb" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#2cc1eb" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="csvGlass" x1="0.1" y1="0" x2="0.75" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.17" />
            <stop offset="48%" stopColor="#ffffff" stopOpacity="0.075" />
            <stop offset="100%" stopColor="#2cc1eb" stopOpacity="0.06" />
          </linearGradient>
          <linearGradient id="csvEdge" x1="0" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.34" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06" />
          </linearGradient>
          <linearGradient id="csvSheen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="35%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="csvMark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22e0ff" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="csvLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#b98cff" />
            <stop offset="52%" stopColor="#2cc1eb" />
            <stop offset="100%" stopColor="#22e0ff" />
          </linearGradient>
          <linearGradient id="csvBeforeArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a974ff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#a974ff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="csvAfterArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2cc1eb" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#2cc1eb" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="csvAreaDim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c5cf0" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#2cc1eb" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="csvHair" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="20%" stopColor="#ffffff" stopOpacity="0.16" />
            <stop offset="80%" stopColor="#ffffff" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="csvArc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22e0ff" stopOpacity="0" />
            <stop offset="50%" stopColor="#22e0ff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#9a51ff" stopOpacity="0" />
          </linearGradient>
          {/* Depth of field for the two cards behind the focus card. */}
          <filter id="csvSoft" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        </defs>

        {/* Bloom, orbit ring and the light the stack stands on. */}
        <ellipse cx={306} cy={206} rx={286} ry={244} fill="url(#csvBloom)" />
        <g className="cs-csv-orbit">
          <circle
            cx={330}
            cy={250}
            r={218}
            fill="none"
            stroke="rgba(255,255,255,0.085)"
            strokeWidth={1}
            strokeDasharray="2 10"
          />
          <circle
            cx={330}
            cy={250}
            r={218}
            fill="none"
            stroke="url(#csvArc)"
            strokeWidth={1.6}
            pathLength={100}
            strokeDasharray="23 100"
            strokeLinecap="round"
          />
        </g>
        <ellipse cx={330} cy={424} rx={196} ry={24} fill="url(#csvGround)" />

        {/* ── Plane 3 and 2: the rest of the library. ───────────────────── */}
        <g filter="url(#csvSoft)" opacity={0.44}>
          <g className="cs-csv-in" style={{ animationDelay: "0.28s" }}>
            <g className="cs-csv-drift--back">
              <g transform="translate(176 254) rotate(-12) translate(-95 -125)">
                <BackCard />
              </g>
            </g>
          </g>
          <g className="cs-csv-in" style={{ animationDelay: "0.4s" }}>
            <g className="cs-csv-drift--back" style={{ animationDelay: "2.6s" }}>
              <g transform="translate(484 258) rotate(12) translate(-95 -125)">
                <BackCard />
              </g>
            </g>
          </g>
        </g>

        {/* ── Plane 1: the study in focus. ──────────────────────────────── */}
        <g className="cs-csv-in" style={{ animationDelay: "0.05s" }}>
          <g className="cs-csv-drift">
            <g transform="translate(200 86)">
              <CardChrome w={260} h={300} rx={26} />

              {/* Header: customer mark, and the verified score it ended on. */}
              <rect x={24} y={24} width={32} height={32} rx={11} fill="url(#csvMark)" />
              <path
                d="M 40 32.5 L 47 36.5 V 44.5 L 40 48.5 L 33 44.5 V 36.5 Z"
                fill="none"
                stroke="#ffffff"
                strokeWidth={1.4}
                strokeLinejoin="round"
                strokeOpacity={0.92}
              />
              {/* Coverage dial. A 270° sweep with an open foot: a closed ring
                  with a dot at its centre reads as a record button, not a score. */}
              <path
                d={GAUGE_ARC}
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={3.2}
                strokeLinecap="round"
              />
              <path
                className="cs-csv-ring"
                d={GAUGE_ARC}
                fill="none"
                stroke="#22e0ff"
                strokeWidth={3.2}
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray="88 100"
              />
              {/* Leading handle, so the dial reads as a value and not an outline. */}
              <circle
                className="cs-csv-fade"
                style={{ animationDelay: "1.9s" }}
                cx={233}
                cy={41.3}
                r={3.4}
                fill="#22e0ff"
              />
              <path d="M 24 72 H 236" stroke="url(#csvHair)" strokeWidth={1} />

              {/* Chart. */}
              <g>
                {[110, 160, 210].map((y) => (
                  <path
                    key={y}
                    d={`M 24 ${y} H 236`}
                    stroke="rgba(255,255,255,0.075)"
                    strokeWidth={1}
                    strokeDasharray="2 7"
                  />
                ))}

                {/* Inherited run: high, erratic, violet. */}
                <path
                  className="cs-csv-fade"
                  style={{ animationDelay: "0.45s" }}
                  d={`${BEFORE_LINE} L 122 240 L 24 240 Z`}
                  fill="url(#csvBeforeArea)"
                />
                <path
                  className="cs-csv-fade"
                  style={{ animationDelay: "0.45s" }}
                  d={BEFORE_LINE}
                  fill="none"
                  stroke="#b98cff"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity={0.85}
                />
                {FINDINGS.map((f, i) => (
                  <circle
                    key={`${f.x}-${f.y}`}
                    className="cs-csv-clear"
                    style={{
                      animationDelay: `${1.05 + i * 0.055}s`,
                      transformBox: "fill-box",
                      transformOrigin: "center",
                    }}
                    cx={f.x}
                    cy={f.y}
                    r={f.r}
                    fill={f.hot ? "#df9bff" : "#a974ff"}
                    fillOpacity={f.hot ? 0.95 : 0.6}
                  />
                ))}

                {/* Label row. Two words, because an unlabelled chart shape
                    invites the reader to decode data that is not there — and
                    on a page whose argument is evidence, a chart nobody can
                    read works against the page. Axis caption left, adoption
                    marker right, sharing one baseline above the plot. */}
                <text
                  className="cs-csv-fade"
                  style={{ animationDelay: "0.45s" }}
                  x={24}
                  y={88}
                  fill="#ffffff"
                  fillOpacity={0.45}
                  fontFamily="var(--font-sans)"
                  fontSize={8.5}
                  fontWeight={500}
                  // Tracking is tuned, not chosen: at 0.09em the caption runs
                  // into the marker diamond at x=117.5 with no gap.
                  letterSpacing="0.05em"
                >
                  VULNERABILITIES
                </text>

                {/* Adoption marker. */}
                <path
                  className="cs-csv-fade"
                  style={{ animationDelay: "0.7s" }}
                  d="M 122 90 V 240"
                  stroke="#2cc1eb"
                  strokeOpacity={0.4}
                  strokeWidth={1.2}
                  strokeDasharray="3 5"
                />
                <path
                  className="cs-csv-fade"
                  style={{ animationDelay: "0.7s" }}
                  d="M 122 79 L 126.5 84 L 122 89 L 117.5 84 Z"
                  fill="#22e0ff"
                />
                <text
                  className="cs-csv-fade"
                  style={{ animationDelay: "0.7s" }}
                  x={132}
                  y={88}
                  fill="#22e0ff"
                  fontFamily="var(--font-sans)"
                  fontSize={9.5}
                  fontWeight={600}
                  letterSpacing="0.01em"
                >
                  CleanStart
                </text>

                {/* Hardened run: drops, then holds. */}
                <path
                  className="cs-csv-wipe"
                  d={`${AFTER_LINE} L 228 240 L 122 240 Z`}
                  fill="url(#csvAfterArea)"
                />
                {ORDER_TICKS.map((x, i) => (
                  <rect
                    key={x}
                    className="cs-csv-fade"
                    style={{ animationDelay: `${1.45 + i * 0.05}s` }}
                    x={x}
                    y={228}
                    width={2.5}
                    height={8}
                    rx={1.25}
                    fill="#2cc1eb"
                    fillOpacity={0.6}
                  />
                ))}
                <path
                  className="cs-csv-draw"
                  d={AFTER_LINE}
                  fill="none"
                  stroke="url(#csvLine)"
                  strokeWidth={2.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={100}
                />
                <circle
                  className="cs-csv-halo"
                  cx={228}
                  cy={220}
                  r={4.5}
                  fill="#22e0ff"
                />
                <circle
                  className="cs-csv-fade"
                  style={{ animationDelay: "1.6s" }}
                  cx={228}
                  cy={220}
                  r={4.5}
                  fill="#22e0ff"
                />
                <path d="M 24 242 H 236" stroke="rgba(255,255,255,0.11)" strokeWidth={1} />
              </g>

              {/* Attribution: a seal, and a name against it. */}
              <circle
                className="cs-csv-breathe"
                cx={42}
                cy={268}
                r={16}
                fill="rgba(44,193,235,0.14)"
                stroke="#2cc1eb"
                strokeWidth={1.5}
              />
              <path
                className="cs-csv-fade"
                style={{ animationDelay: "1.75s" }}
                d="M 35.5 268.4 L 40 273 L 49 262.6"
                fill="none"
                stroke="#22e0ff"
                strokeWidth={2.1}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                className="cs-csv-sign"
                d={SIGNATURE}
                fill="none"
                stroke="rgba(255,255,255,0.46)"
                strokeWidth={1.7}
                strokeLinecap="round"
                pathLength={100}
              />
            </g>
          </g>
        </g>

        {/* ── Loose artifacts, to break the rectangles. ─────────────────── */}
        <g className="cs-csv-in" style={{ animationDelay: "1.95s" }}>
          <g className="cs-csv-drift" style={{ animationDelay: "3.4s" }}>
            <circle
              cx={86}
              cy={98}
              r={25}
              fill="url(#csvGlass)"
              stroke="url(#csvEdge)"
              strokeWidth={1.4}
            />
            <path
              d="M 86 86 L 95 90 V 99 C 95 105 90.5 109 86 111 C 81.5 109 77 105 77 99 V 90 Z"
              fill="none"
              stroke="#22e0ff"
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
            <path
              d="M 82.5 97.8 L 85.3 100.6 L 90 95"
              fill="none"
              stroke="#22e0ff"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </g>

        {/* Sustained-reduction badge, tucked against the card's lower-right so
            it reads as an annotation on the result rather than loose furniture
            floating under the stack. */}
        <g className="cs-csv-in" style={{ animationDelay: "2.1s" }}>
          <g className="cs-csv-drift" style={{ animationDelay: "4.1s" }}>
            <rect
              x={440}
              y={290}
              width={108}
              height={36}
              rx={18}
              fill="#160f33"
              fillOpacity={0.55}
            />
            <rect
              x={440}
              y={290}
              width={108}
              height={36}
              rx={18}
              fill="url(#csvGlass)"
              stroke="url(#csvEdge)"
              strokeWidth={1.4}
            />
            <path
              d="M 459 300 V 314 M 454 309.5 L 459 315 L 464 309.5"
              fill="none"
              stroke="#22e0ff"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {[
              { x: 476, h: 16 },
              { x: 485, h: 11 },
              { x: 494, h: 7.5 },
              { x: 503, h: 5 },
              { x: 512, h: 4 },
              { x: 521, h: 3.5 },
            ].map((bar) => (
              <rect
                key={bar.x}
                x={bar.x}
                y={315 - bar.h}
                width={4.4}
                height={bar.h}
                rx={2.2}
                fill="#22e0ff"
                fillOpacity={0.62}
              />
            ))}
          </g>
        </g>

      </svg>
    </>
  );
}
