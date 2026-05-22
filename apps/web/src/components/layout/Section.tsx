import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Padding = "sm" | "md" | "lg" | "cta" | "none";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  /**
   * Vertical padding (top + bottom).
   * - `sm`  → `py-section-sm`   (48 → 80 px fluid)
   * - `md`  → `py-section-md`   (64 → 120 px fluid) — DEFAULT
   * - `lg`  → `py-section-lg`   (80 → 150 px fluid)
   * - `cta` → `py-section-cta`  (160 → 250 px — CTA overlap reservation)
   * - `none` → no vertical padding (caller controls)
   */
  padding?: Padding;
  /**
   * Optional ARIA label for the `<section>` element.
   */
  ariaLabel?: string;
  children: ReactNode;
}

const paddingClass: Record<Padding, string> = {
  none: "",
  sm: "py-section-sm",
  md: "py-section-md",
  lg: "py-section-lg",
  cta: "py-section-cta",
};

export function Section({
  padding = "md",
  ariaLabel,
  className,
  children,
  ...rest
}: SectionProps) {
  return (
    <section
      aria-label={ariaLabel}
      className={cn("relative w-full", paddingClass[padding], className)}
      {...rest}
    >
      {children}
    </section>
  );
}
