

/**
 * Animated Container Supply Chain & Provenance Comparison Engine.
 *
 * Visualizing the core architectural difference between:
 * - Docker Hardened Images (Surface Hardening / SLSA Level 3)
 * - CleanStart Verified Images (Deterministic Hermetic Pipeline / SLSA Level 4 / AI BOM)
 *
 * Pure SVG + CSS animation system.
 */
export function CompareHeroArtifact(): React.ReactElement {
  return (
    <div
      aria-hidden
      className="cmp-artifact pointer-events-none relative mx-auto w-full max-w-[480px] select-none"
    >
      <style>{`
        @keyframes cmp-float-gentle {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-10px); }
        }
        @keyframes cmp-float-offset {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-14px); }
        }
        @keyframes cmp-scan-beam {
          0%   { transform: translateY(-20px); opacity: 0.2; }
          50%  { opacity: 0.95; }
          100% { transform: translateY(110px); opacity: 0.2; }
        }
        @keyframes cmp-pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(0.98); }
          50%      { opacity: 0.85; transform: scale(1.03); }
        }
        @keyframes cmp-dash-flow {
          0%   { stroke-dashoffset: 40; }
          100% { stroke-dashoffset: 0; }
        }
        
        .cmp-node-left { animation: cmp-float-gentle 8s ease-in-out infinite; }
        .cmp-node-right { animation: cmp-float-offset 7s ease-in-out infinite 0.5s; }
        .cmp-laser-beam { animation: cmp-scan-beam 4s ease-in-out infinite; }
        .cmp-glow-ring { animation: cmp-pulse-glow 3s ease-in-out infinite; }
        .cmp-flow-path { stroke-dasharray: 6 6; animation: cmp-dash-flow 2s linear infinite; }

        @media (prefers-reduced-motion: reduce) {
          .cmp-node-left, .cmp-node-right, .cmp-laser-beam, .cmp-glow-ring { animation: none !important; }
        }
      `}</style>

      <svg
        viewBox="0 0 520 440"
        fill="none"
        className="h-auto w-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
        role="presentation"
      >
        <defs>
          {/* Ambient Pools */}
          <radialGradient id="cmp-pool-dhi" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="cmp-pool-cs" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#9a51ff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#9a51ff" stopOpacity="0" />
          </radialGradient>

          {/* Core Gradients */}
          <linearGradient id="cmp-cs-seal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c9a6ff" />
            <stop offset="100%" stopColor="#6A3DF0" />
          </linearGradient>
          <linearGradient id="cmp-scan-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9a51ff" stopOpacity="0" />
            <stop offset="50%" stopColor="#c9a6ff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#9a51ff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Ambient Ground Pools */}
        <ellipse cx="140" cy="380" rx="110" ry="32" fill="url(#cmp-pool-dhi)" />
        <ellipse cx="370" cy="370" rx="130" ry="38" fill="url(#cmp-pool-cs)" />

        {/* Connection Link Between Platforms */}
        <path
          d="M 170 240 Q 255 200 320 230"
          stroke="rgba(169, 116, 255, 0.4)"
          strokeWidth="2"
          strokeDasharray="4 4"
        />

        {/* LEFT NODE: Docker Hardened Images */}
        <g className="cmp-node-left">
          {/* Base Container Slabs */}
          <polygon
            points="140,230 210,265 140,300 70,265"
            fill="rgba(15, 23, 42, 0.7)"
            stroke="#334155"
            strokeWidth="1.2"
          />
          <polygon
            points="70,265 140,300 140,312 70,277"
            fill="rgba(30, 41, 59, 0.8)"
          />
          <polygon
            points="210,265 140,300 140,312 210,277"
            fill="rgba(15, 23, 42, 0.9)"
          />

          <polygon
            points="140,195 210,230 140,265 70,230"
            fill="rgba(30, 41, 59, 0.6)"
            stroke="#475569"
            strokeWidth="1.2"
          />
          <polygon
            points="70,230 140,265 140,277 70,242"
            fill="rgba(15, 23, 42, 0.8)"
          />
          <polygon
            points="210,230 140,265 140,277 210,242"
            fill="rgba(30, 41, 59, 0.9)"
          />

          {/* DHI Shield Header */}
          <circle cx="140" cy="195" r="22" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
          <path
            d="M 140 183 L 150 188 V 197 C 150 203 140 208 140 208 C 140 208 130 203 130 197 V 188 Z"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Left Label Chip */}
          <g transform="translate(60, 320)">
            <rect x="0" y="0" width="160" height="26" rx="13" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(100, 116, 139, 0.4)" />
            <text x="80" y="17" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="var(--font-sans)" fontWeight="500">
              Docker Hardened Images
            </text>
          </g>
        </g>

        {/* RIGHT NODE: CleanStart Verified Platform (Hero Core) */}
        <g className="cmp-node-right">
          {/* Active Scanner Line Beam */}
          <g className="cmp-laser-beam">
            <ellipse cx="370" cy="200" rx="100" ry="24" fill="url(#cmp-scan-grad)" />
          </g>

          {/* Layer 1 (Bottom) */}
          <polygon points="370,270 460,310 370,350 280,310" fill="rgba(106, 61, 240, 0.15)" stroke="#6A3DF0" strokeWidth="1.2" />
          <polygon points="280,310 370,350 370,362 280,322" fill="rgba(44, 34, 153, 0.4)" />
          <polygon points="460,310 370,350 370,362 460,322" fill="rgba(26, 20, 82, 0.6)" />

          {/* Layer 2 (Middle) */}
          <polygon points="370,225 460,265 370,305 280,265" fill="rgba(154, 81, 255, 0.2)" stroke="#9A51FF" strokeWidth="1.4" />
          <polygon points="280,265 370,305 370,317 280,277" fill="rgba(67, 56, 202, 0.5)" />
          <polygon points="460,265 370,305 370,317 460,277" fill="rgba(30, 27, 75, 0.7)" />

          {/* Layer 3 (Top Verified Crown) */}
          <polygon points="370,180 460,220 370,260 280,220" fill="rgba(201, 166, 255, 0.35)" stroke="#C9A6FF" strokeWidth="1.8" />
          <polygon points="280,220 370,260 370,272 280,232" fill="rgba(106, 61, 240, 0.6)" />
          <polygon points="460,220 370,260 370,272 460,232" fill="rgba(44, 34, 153, 0.8)" />

          {/* Glowing Aura Ring */}
          <ellipse cx="370" cy="180" rx="42" ry="20" fill="none" stroke="rgba(201, 166, 255, 0.6)" strokeWidth="1.5" className="cmp-glow-ring" />

          {/* Top Verification Seal */}
          <g transform="translate(370, 180)">
            <circle cx="0" cy="0" r="28" fill="url(#cmp-cs-seal)" stroke="#ffffff" strokeWidth="2" />
            <path d="M -9 0 L -2 7 L 11 -6" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          {/* Floating Feature Micro-Chips */}
          {/*
           * Chip wording is verbatim from the source document. "aligned" is
           * load-bearing: the document gives Docker an attained "SLSA Build
           * Level 3" and CleanStart "SLSA Level 4 aligned", which is not a
           * claim of certification. Do not shorten it to "SLSA Level 4".
           */}
          <g transform="translate(408, 130)">
            <rect x="0" y="0" width="112" height="22" rx="11" fill="rgba(106, 61, 240, 0.9)" stroke="rgba(255, 255, 255, 0.4)" />
            <text x="56" y="15" textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="var(--font-sans)" fontWeight="700">
              SLSA Level 3 aligned
            </text>
          </g>

          <g transform="translate(235, 160)">
            <rect x="0" y="0" width="72" height="22" rx="11" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(154, 81, 255, 0.6)" />
            <text x="36" y="15" textAnchor="middle" fill="#c9a6ff" fontSize="10" fontFamily="var(--font-sans)" fontWeight="600">
              AI BOM
            </text>
          </g>

          {/* Bottom CleanStart Label */}
          <g transform="translate(285, 335)">
            <rect x="0" y="0" width="170" height="28" rx="14" fill="rgba(106, 61, 240, 0.95)" stroke="rgba(201, 166, 255, 0.5)" />
            <text x="85" y="18" textAnchor="middle" fill="#ffffff" fontSize="11" fontFamily="var(--font-sans)" fontWeight="700">
              CleanStart Verified Images
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}
