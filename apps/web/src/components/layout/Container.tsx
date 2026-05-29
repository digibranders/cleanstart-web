import { createElement } from "react";
import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "default" | "wide" | "prose";

type Padding = 4 | 6 | 8 | "none";

interface ContainerProps extends HTMLAttributes<HTMLElement> {
  /**
   * Container width cap.
   * - `default` → 1440 px (`--container-default`) — standard marketing/product sections
   * - `wide`    → 1600 px (`--container-wide`)    — hero / featured / image-breakout
   * - `prose`   → 720 px  (`--container-prose`)   — long-form article body
   */
  variant?: Variant;
  /**
   * Horizontal padding. Default `6` (24 px). Use `none` if the parent
   * already controls horizontal gutter (e.g. Header / Footer with safe-area).
   */
  px?: Padding;
  /**
   * HTML tag to render. Defaults to `div`. Use `section` / `article` /
   * `main` for semantic structure.
   */
  as?: ElementType;
  children: ReactNode;
}

const variantClass: Record<Variant, string> = {
  default: "max-w-[var(--container-default)]",
  wide: "max-w-[var(--container-wide)]",
  prose: "max-w-[var(--container-prose)]",
};

/**
 * Side-gutter map. `px=6` is the default and bumps from 24 → 40 px at
 * ≥sm so every desktop viewport gets a 40 px gutter while narrow phones
 * keep the tighter 24 px. `px=4` and `px=8` stay flat for callers that
 * need a specific value.
 */
const paddingClass: Record<Exclude<Padding, "none">, string> = {
  4: "px-4",
  6: "px-6 sm:px-10",
  8: "px-8",
};

export function Container({
  variant = "default",
  px = 6,
  as: Tag = "div",
  className,
  children,
  ...rest
}: ContainerProps) {
  // `createElement` (not JSX) so the polymorphic `Tag: ElementType` doesn't
  // collapse the intrinsic-attribute props to `never`. Equivalent to `<Tag />`.
  return createElement(
    Tag,
    {
      className: cn(
        "mx-auto w-full",
        variantClass[variant],
        px !== "none" && paddingClass[px],
        className,
      ),
      ...rest,
    },
    children,
  );
}
