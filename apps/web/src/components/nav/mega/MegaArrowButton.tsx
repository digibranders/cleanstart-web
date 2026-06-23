type Props = {
  /**
   * `right`    — internal destination, same tab. Nudges 2px right on card/CTA hover.
   * `up-right` — external destination, new tab. Nudges 2px up-right on hover.
   *
   * The parent Link MUST carry `group/card` (cards) or `group/cta` (CTA bar) for
   * the hover nudge to fire; the fill brighten is driven from CSS via the parent
   * `.cs-mega-card` / `.cs-mega-cta` hover.
   */
  direction?: "right" | "up-right";
  /** Circle diameter in px. */
  size?: number;
  className?: string;
};

const NUDGE =
  "transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

export function MegaArrowButton({ direction = "right", size = 36, className = "" }: Props) {
  const glyphSize = Math.round(size * 0.5);
  const glyph =
    direction === "up-right" ? (
      <svg
        width={glyphSize}
        height={glyphSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={`${NUDGE} group-hover/card:-translate-y-0.5 group-hover/card:translate-x-0.5 group-hover/cta:-translate-y-0.5 group-hover/cta:translate-x-0.5`}
      >
        <path d="M7 17 17 7" />
        <path d="M8.5 7H17v8.5" />
      </svg>
    ) : (
      <svg
        width={glyphSize}
        height={glyphSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={`${NUDGE} group-hover/card:translate-x-0.5 group-hover/cta:translate-x-0.5`}
      >
        <path d="M4 12h15" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    );

  return (
    <span
      className={`cs-mega-arrow-btn inline-flex shrink-0 items-center justify-center rounded-full text-white ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {glyph}
    </span>
  );
}
