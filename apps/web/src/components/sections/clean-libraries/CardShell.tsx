import type { ReactNode } from "react";

/**
 * Shared white card chrome for the Clean Libraries cards — mirrors the CISO
 * Enterprise card: cyan-glow border, top purple wash, and a faint grid of
 * horizontal + vertical lines that fills the space between the icon and the
 * copy so the card never reads as empty.
 */
export function CardShell({
  children,
  minHeight,
  className,
}: {
  children: ReactNode;
  minHeight?: string;
  className?: string;
}): React.ReactElement {
  return (
    <div
      className="relative h-full rounded-[40px] p-[3px]"
      style={{
        background:
          "linear-gradient(135deg, rgba(44,193,235,0.45) 0%, rgba(44,193,235,0.12) 60%, rgba(255,255,255,0.5) 100%)",
      }}
    >
      <div
        className={`relative h-full overflow-hidden rounded-[37px] bg-white ${className ?? ""}`}
        style={minHeight ? { minHeight } : undefined}
      >
        {/* Top purple wash. */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-7 h-[153px] w-[263px] -translate-x-1/2 select-none opacity-30"
          style={{ background: "#df9bff", filter: "blur(66.5px)" }}
        />

        {/* Horizontal grid lines. */}
        {[68, 184].map((y) => (
          <div
            key={y}
            aria-hidden
            className="pointer-events-none absolute inset-x-0 h-px select-none opacity-30"
            style={{
              top: `${y}px`,
              background:
                "linear-gradient(90deg, transparent 0%, #fff 50.77%, transparent 100%)",
            }}
          />
        ))}

        {/* Vertical accent lines — positioned proportionally so they scale with card width. */}
        {[16.9, 41.8, 56.6, 81.5].map((x) => (
          <div
            key={x}
            aria-hidden
            className="pointer-events-none absolute top-0 h-[264px] w-px select-none opacity-80"
            style={{
              left: `${x}%`,
              background:
                "linear-gradient(180deg, transparent 0%, #fff 50.77%, transparent 100%)",
            }}
          />
        ))}

        <div className="relative z-10 flex h-full flex-col">{children}</div>
      </div>
    </div>
  );
}
