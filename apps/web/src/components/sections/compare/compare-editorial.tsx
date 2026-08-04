import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";
import { RULE_LIGHT } from "./compare-visuals";

/**
 * Typographic primitives for the comparison page.
 *
 * These own text only — measure, weight and rhythm. Every surface, colour and
 * decoration lives in `compare-visuals`, so there is exactly one place to change
 * how the page looks and one place to change how it reads.
 *
 * `RULE` is re-exported from `compare-visuals` so the page has a single
 * hairline value rather than two that drift apart.
 */

export const RULE = RULE_LIGHT;

/** Reading measure for body prose — the `--prose-column-max` band, in ch. */
const MEASURE = "68ch";

/** Section heading. Carries no eyebrow: fourteen tracked uppercase kickers is
 *  the exact scaffolding tell this page is removing. */
export function SectionHeading({
  children,
  id,
  inverse = false,
  size = "h2",
}: {
  children: ReactNode;
  id?: string;
  inverse?: boolean;
  size?: "h2" | "h3";
}): React.ReactElement {
  const Tag = size === "h2" ? "h2" : "h3";
  return (
    <Reveal header>
      <Tag
        {...(id ? { id } : {})}
        className={cn("font-display", inverse ? "text-white" : "text-[#111111]")}
        style={{
          fontSize: size === "h2" ? "var(--fs-h2)" : "var(--fs-h3)",
          fontWeight: 600,
          letterSpacing: size === "h2" ? "var(--fs-h2-ls)" : "var(--fs-h3-ls)",
          lineHeight: size === "h2" ? "var(--fs-h2-lh)" : "var(--fs-h3-lh)",
          maxWidth: "24ch",
          textWrap: "balance",
        }}
      >
        {children}
      </Tag>
    </Reveal>
  );
}

/** Body paragraph at the reading measure. */
export function P({
  children,
  inverse = false,
  lead = false,
  className,
}: {
  children: ReactNode;
  inverse?: boolean;
  /** Slightly larger, for a section's opening paragraph. */
  lead?: boolean;
  className?: string;
}): React.ReactElement {
  return (
    <p
      className={className}
      style={{
        fontFamily: "var(--font-sans)",
        fontSize: lead ? "var(--fs-lead-sm)" : "var(--fs-body)",
        fontWeight: 400,
        lineHeight: lead ? 1.5 : 1.65,
        letterSpacing: "-0.01em",
        color: inverse ? "rgba(255,255,255,0.78)" : "#3A3A3A",
        maxWidth: MEASURE,
        textWrap: "pretty",
      }}
    >
      {children}
    </p>
  );
}

/** Stack of paragraphs with consistent leading between them. */
export function Prose({
  paragraphs,
  inverse = false,
  lead = false,
  className,
}: {
  paragraphs: readonly string[];
  inverse?: boolean;
  lead?: boolean;
  className?: string;
}): React.ReactElement {
  return (
    <Reveal className={cn("flex flex-col gap-4", className)}>
      {paragraphs.map((text) => (
        <P key={text} inverse={inverse} lead={lead}>
          {text}
        </P>
      ))}
    </Reveal>
  );
}

/** Short lead-in line that introduces a list. Not a kicker — a full sentence. */
export function ListLead({
  children,
  inverse = false,
}: {
  children: ReactNode;
  inverse?: boolean;
}): React.ReactElement {
  return (
    <Reveal>
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-body)",
          fontWeight: 500,
          lineHeight: 1.5,
          letterSpacing: "-0.01em",
          color: inverse ? "rgba(255,255,255,0.92)" : "#111111",
          maxWidth: MEASURE,
        }}
      >
        {children}
      </p>
    </Reveal>
  );
}
