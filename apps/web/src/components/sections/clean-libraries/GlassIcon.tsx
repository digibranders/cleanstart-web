/**
 * A glossy 3D-glass icon tile — an accent-coloured "gem" with a bright top
 * reflection, inner rim-light + depth shadow, a soft floating coloured shadow,
 * and a white glyph. Built entirely in CSS (no raster) to give the two light
 * sections a premium rendered-icon feel consistent with the page's other coded
 * 3D scenes. Pass the card's `accent` and the line-icon glyph as children.
 */
export function GlassIcon({
  accent,
  size = 52,
  children,
}: {
  accent: string;
  size?: number;
  children: React.ReactNode;
}): React.ReactElement {
  const radius = Math.round(size * 0.3);
  return (
    <div
      className="relative flex shrink-0 items-center justify-center overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `linear-gradient(145deg, color-mix(in srgb, ${accent} 70%, #ffffff) 0%, ${accent} 44%, color-mix(in srgb, ${accent} 58%, #17101f) 100%)`,
        boxShadow: `0 9px 20px -7px ${accent}, inset 0 1.5px 1px rgba(255,255,255,0.72), inset 0 -7px 13px rgba(0,0,0,0.32)`,
      }}
    >
      {/* Glossy top reflection — a soft white ellipse clipped by the tile. */}
      <span
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{
          top: `-${Math.round(size * 0.3)}px`,
          left: `-${Math.round(size * 0.12)}px`,
          width: `${Math.round(size * 1.24)}px`,
          height: `${Math.round(size * 0.88)}px`,
          borderRadius: "50%",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0) 72%)",
          opacity: 0.75,
        }}
      />
      {/* Glyph — inherits white via currentColor, lifted with a soft shadow. */}
      <span
        className="relative text-white"
        style={{ filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.38))" }}
      >
        {children}
      </span>
    </div>
  );
}
