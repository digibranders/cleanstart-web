type Props = {
  /**
   * `right`     — internal link, same tab. Translates 4px right on parent hover.
   * `up-right`  — external link, new tab. Translates 2px right + 2px up on parent hover.
   *
   * Parent link MUST carry the `group/cta` class for the hover animation to fire.
   */
  direction?: "right" | "up-right";
  size?: number;
  className?: string;
};

const BASE =
  "inline-block shrink-0 transition-transform duration-200 motion-reduce:transition-none";

export function ArrowGlyph({ direction = "right", size = 14, className = "" }: Props) {
  if (direction === "up-right") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={`${BASE} group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5 motion-reduce:group-hover/cta:translate-x-0 motion-reduce:group-hover/cta:translate-y-0 ${className}`}
      >
        <path d="M7 17 17 7" />
        <path d="M7 7h10v10" />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${BASE} group-hover/cta:translate-x-1 motion-reduce:group-hover/cta:translate-x-0 ${className}`}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
