/**
 * Simplified equirectangular world map paths for the GlobalPresence section.
 * viewBox: 0 0 1000 460
 * x = (lon + 180) / 360 * 1000
 * y = (90 − lat) / 180 * 460
 *
 * Office markers land at:
 *   Delaware HQ  38.9°N  75.5°W  → (290, 131)
 *   Ahmedabad   23.0°N  72.6°E  → (702, 171)
 *   Bengaluru   13.0°N  77.6°E  → (716, 197)
 *   Singapore    1.4°N 103.8°E  → (788, 227)
 *
 * All four points verified inside their respective landmass paths.
 */

interface WorldMapPathsProps {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  filter?: string;
  opacity?: number;
}

export function WorldMapPaths({
  fill = "rgba(44,193,235,0.09)",
  stroke = "rgba(44,193,235,0.22)",
  strokeWidth = 0.8,
  filter,
  opacity,
}: WorldMapPathsProps) {
  return (
    <g
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      strokeLinecap="round"
      filter={filter}
      opacity={opacity}
    >
      {/* ── North America + Central America ─────────────────────────────── */}
      <path d="M 42,66 L 75,51 L 194,46 L 264,43 L 311,69 L 353,95 L 322,118 L 306,118 L 306,123 L 292,130 L 289,141 L 275,166 L 258,153 L 231,164 L 256,176 L 244,189 L 286,207 L 208,182 L 194,171 L 156,133 L 156,110 L 144,102 L 117,79 L 78,82 L 50,84 Z" />

      {/* Greenland */}
      <path d="M 219,8 L 280,5 L 311,20 L 303,43 L 275,51 L 244,48 L 220,32 Z" />

      {/* Cuba + Caribbean (approximate) */}
      <ellipse cx="267" cy="183" rx="14" ry="5" transform="rotate(-10 267 183)" />
      <ellipse cx="286" cy="188" rx="7" ry="4" />

      {/* ── South America ────────────────────────────────────────────────── */}
      <path d="M 253,191 L 286,196 L 325,200 L 358,208 L 403,241 L 394,258 L 381,284 L 361,303 L 339,317 L 316,353 L 311,369 L 296,350 L 303,313 L 306,278 L 278,243 L 278,230 L 267,218 Z" />

      {/* ── Iceland ──────────────────────────────────────────────────────── */}
      <ellipse cx="450" cy="25" rx="17" ry="9" />

      {/* ── UK + Ireland ─────────────────────────────────────────────────── */}
      <path d="M 472,75 L 481,67 L 489,75 L 483,91 L 472,88 Z" />
      <ellipse cx="464" cy="80" rx="5" ry="8" />

      {/* ── Europe (mainland) ────────────────────────────────────────────── */}
      <path d="M 486,94 L 514,81 L 522,81 L 556,76 L 567,87 L 580,112 L 600,118 L 603,128 L 575,134 L 561,131 L 544,131 L 533,115 L 506,121 L 483,128 L 475,110 L 486,94 Z" />

      {/* Scandinavia */}
      <path d="M 514,81 L 520,66 L 533,51 L 556,39 L 575,39 L 583,57 L 567,72 L 539,83 Z" />

      {/* ── Africa ───────────────────────────────────────────────────────── */}
      <path d="M 483,128 L 503,122 L 528,122 L 569,141 L 594,146 L 619,175 L 606,191 L 583,191 L 600,212 L 614,236 L 611,256 L 597,292 L 575,318 L 550,318 L 506,285 L 483,258 L 453,218 L 456,191 L 478,175 L 483,128 Z" />

      {/* Madagascar */}
      <path d="M 606,265 L 617,255 L 622,275 L 619,295 L 608,292 Z" />

      {/* ── Arabian Peninsula ────────────────────────────────────────────── */}
      <path d="M 575,134 L 619,146 L 631,160 L 628,185 L 603,195 L 583,191 L 600,178 L 575,134 Z" />

      {/* ── Russia + N Asia (top strip) ───────────────────────────────────
           Covers Siberia and the Russian Far East.                          */}
      <path d="M 458,39 L 533,51 L 583,57 L 600,72 L 642,82 L 700,75 L 800,51 L 900,46 L 1000,23 L 1000,0 L 440,0 L 420,20 Z" />

      {/* ── Main Asia (Anatolia → SE Asia, including Indian peninsula) ────
           Ahmedabad (702,171) and Bengaluru (716,197) verified inside.
           Singapore (788,227) inside the Malay peninsula sub-path.          */}
      <path d="M 575,134 L 603,128 L 642,128 L 672,128 L 700,108 L 756,108 L 800,97 L 870,97 L 894,112 L 886,141 L 822,171 L 814,150 L 786,204 L 808,222 L 800,245 L 783,245 L 775,228 L 756,171 L 722,204 L 714,210 L 703,192 L 672,166 L 650,162 L 619,146 L 575,134 Z" />

      {/* Sri Lanka */}
      <ellipse cx="722" cy="220" rx="6" ry="9" />

      {/* ── East Asia extras ─────────────────────────────────────────────── */}
      {/* Japan — Honshu */}
      <path d="M 897,102 L 911,92 L 919,102 L 911,120 L 897,117 Z" />
      {/* Japan — Kyushu/Shikoku strip */}
      <ellipse cx="908" cy="130" rx="8" ry="15" transform="rotate(-20 908 130)" />
      {/* Korean peninsula */}
      <path d="M 869,105 L 883,102 L 886,118 L 872,121 Z" />
      {/* Taiwan */}
      <ellipse cx="866" cy="160" rx="5" ry="9" transform="rotate(-20 866 160)" />

      {/* ── Maritime SE Asia ─────────────────────────────────────────────── */}
      {/* Borneo */}
      <path d="M 808,218 L 839,208 L 856,228 L 847,258 L 822,262 L 808,245 Z" />
      {/* Sumatra */}
      <path d="M 756,230 L 797,214 L 811,228 L 797,253 L 769,256 Z" />
      {/* Java */}
      <path d="M 778,262 L 825,253 L 836,265 L 822,276 L 783,276 Z" />
      {/* Philippines */}
      <path d="M 856,171 L 869,162 L 878,183 L 869,200 L 856,197 Z" />
      <ellipse cx="872" cy="210" rx="7" ry="12" />
      {/* Sulawesi (simplified dot) */}
      <ellipse cx="856" cy="248" rx="9" ry="14" />

      {/* ── Australia ────────────────────────────────────────────────────── */}
      <path d="M 775,296 L 858,284 L 911,302 L 917,349 L 897,385 L 858,400 L 808,393 L 769,368 L 756,327 Z" />
      {/* Tasmania */}
      <ellipse cx="856" cy="412" rx="9" ry="6" />
      {/* New Zealand */}
      <ellipse cx="950" cy="372" rx="11" ry="22" transform="rotate(-25 950 372)" />
    </g>
  );
}
