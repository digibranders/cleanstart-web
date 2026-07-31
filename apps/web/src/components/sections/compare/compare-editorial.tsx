import type { ReactNode } from "react";
import { Section, Container } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";

/**
 * Editorial primitives for the comparison page.
 *
 * The source copy is a 14-section article, so the page is typeset as one. The
 * structural device throughout is the hairline rule and the text measure — not
 * the card. There is deliberately no bordered-box primitive in this file: a
 * heading, a rule, and a controlled measure carry the hierarchy, which is what
 * keeps fourteen consecutive sections from reading as a stack of slabs.
 *
 * `RULE` is the single hairline value. One token, used everywhere, so the page
 * has exactly one weight of structural line.
 */

export const RULE = "1px solid rgba(17, 17, 17, 0.11)";
export const RULE_INVERSE = "1px solid rgba(255, 255, 255, 0.16)";

/** Reading measure for body prose — the `--prose-column-max` band, in ch. */
const MEASURE = "68ch";

/**
 * Section heading. Sits above a full-width rule so section starts are marked by
 * a line rather than a container edge, and carries no eyebrow: fourteen tracked
 * uppercase kickers is the exact scaffolding tell we are removing.
 */
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
      <div
        aria-hidden
        style={{ borderTop: inverse ? RULE_INVERSE : RULE }}
        className="mb-7 w-full md:mb-9"
      />
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

/**
 * List rendered as rule-separated rows across the full column, not as bullets
 * inside a card. Wraps to two or three columns on wide viewports so a
 * four-to-seven item list does not become a thin ragged strip.
 */
export function RuleList({
  items,
  columns = 2,
  inverse = false,
  strike = false,
  numbered = false,
}: {
  items: readonly string[];
  columns?: 1 | 2 | 3;
  inverse?: boolean;
  /** Renders items as struck-through prohibitions (the "cannot" list). */
  strike?: boolean;
  numbered?: boolean;
}): React.ReactElement {
  const colClass =
    columns === 3
      ? "sm:grid-cols-2 lg:grid-cols-3"
      : columns === 2
        ? "sm:grid-cols-2"
        : "";
  const Tag = numbered ? "ol" : "ul";
  return (
    <Reveal>
      <Tag className={cn("grid grid-cols-1 gap-x-10", colClass)}>
        {items.map((item, index) => (
          <li
            key={item}
            className="flex items-baseline gap-4"
            style={{
              borderTop: inverse ? RULE_INVERSE : RULE,
              paddingTop: "clamp(10px, 0.9vw, 14px)",
              paddingBottom: "clamp(10px, 0.9vw, 14px)",
            }}
          >
            {numbered && (
              <span
                aria-hidden
                className="shrink-0 tabular-nums"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-body-sm)",
                  fontWeight: 500,
                  color: inverse ? "rgba(255,255,255,0.56)" : "#6B6B6B",
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
            )}
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-body)",
                fontWeight: 400,
                lineHeight: 1.45,
                letterSpacing: "-0.01em",
                color: strike
                  ? inverse
                    ? "rgba(255,255,255,0.5)"
                    : "#6B6B6B"
                  : inverse
                    ? "rgba(255,255,255,0.9)"
                    : "#222222",
                ...(strike
                  ? {
                      textDecoration: "line-through",
                      textDecorationColor: inverse
                        ? "rgba(255,255,255,0.35)"
                        : "rgba(17,17,17,0.3)",
                    }
                  : {}),
              }}
            >
              {item}
            </span>
          </li>
        ))}
      </Tag>
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

/**
 * Display-scale quotation of a sentence from the article. No quote marks, no
 * box, no rule — the size shift alone marks it, which is why it can be used
 * more than once without becoming a pattern.
 */
export function PullQuote({
  children,
  inverse = false,
}: {
  children: ReactNode;
  inverse?: boolean;
}): React.ReactElement {
  return (
    <Reveal header>
      <p
        className={cn("font-display", inverse ? "text-white" : "text-[#111111]")}
        style={{
          fontSize: "var(--fs-h3)",
          fontWeight: 600,
          letterSpacing: "var(--fs-h3-ls)",
          lineHeight: 1.3,
          maxWidth: "34ch",
          textWrap: "balance",
        }}
      >
        {children}
      </p>
    </Reveal>
  );
}

/**
 * Article section wrapper. Every section shares one vertical rhythm and one
 * left-aligned column origin, so variation between sections comes from the
 * content's own shape rather than from alternating background slabs.
 */
export function ArticleSection({
  children,
  label,
  name,
  className,
  padding = "md",
}: {
  children: ReactNode;
  /** Accessible label target — the id of the section's heading. */
  label?: string;
  /** `data-section` value, matching the convention used across apps/web. */
  name?: string;
  className?: string;
  padding?: "sm" | "md" | "lg";
}): React.ReactElement {
  return (
    <Section
      padding={padding}
      className={cn("bg-white", className)}
      {...(name ? { "data-section": name } : {})}
      {...(label ? { "aria-labelledby": label } : {})}
    >
      <Container>
        <div className="flex flex-col gap-6 md:gap-7">{children}</div>
      </Container>
    </Section>
  );
}

/**
 * Two-column split for the passages where the article genuinely contrasts the
 * two vendors. Columns are separated by a vertical rule, not by two card edges,
 * and the two sides are allowed to differ in length — the article gives Docker
 * a bullet list and CleanStart running prose, and forcing those into matching
 * boxes is what produced the symmetry problem in the first place.
 */
export function VendorSplit({
  left,
  right,
  inverse = false,
}: {
  left: ReactNode;
  right: ReactNode;
  inverse?: boolean;
}): React.ReactElement {
  const ruleColor = inverse ? "border-white/[0.16]" : "border-[#111111]/[0.11]";
  return (
    <div className="grid gap-10 md:grid-cols-2 md:gap-0">
      <div className="md:pr-12 lg:pr-16">{left}</div>
      {/* Horizontal rule when stacked, vertical rule when side by side. */}
      <div
        className={cn(
          "border-t pt-8 md:border-l md:border-t-0 md:pl-12 md:pt-0 lg:pl-16",
          ruleColor,
        )}
      >
        {right}
      </div>
    </div>
  );
}

/**
 * Renders one article section — heading, body, optional list, closing
 * paragraphs — in the document's own order. `columns` and `numbered` are the
 * per-section art direction: a four-item list and a seven-item list should not
 * be set the same way.
 */
export function DocBlock({
  section,
  columns = 2,
  numbered = false,
  strike = false,
}: {
  section: {
    id: string;
    heading: string;
    body: readonly string[];
    listLead?: string;
    items?: readonly string[];
    after?: readonly string[];
  };
  columns?: 1 | 2 | 3;
  numbered?: boolean;
  strike?: boolean;
}): React.ReactElement {
  const headingId = `compare-${section.id}-title`;
  return (
    <ArticleSection label={headingId} name={`Compare-${section.id}`}>
      <SectionHeading id={headingId}>{section.heading}</SectionHeading>
      <Prose paragraphs={section.body} />
      {section.listLead && <ListLead>{section.listLead}</ListLead>}
      {section.items && (
        <RuleList
          items={section.items}
          columns={columns}
          numbered={numbered}
          strike={strike}
        />
      )}
      {section.after && <Prose paragraphs={section.after} />}
    </ArticleSection>
  );
}

/** Vendor name as a column header inside a split. */
export function VendorName({
  children,
  inverse = false,
}: {
  children: ReactNode;
  inverse?: boolean;
}): React.ReactElement {
  return (
    <h3
      className={cn("font-display", inverse ? "text-white" : "text-[#111111]")}
      style={{
        fontSize: "var(--fs-h4)",
        fontWeight: 600,
        letterSpacing: "var(--fs-h4-ls)",
        lineHeight: "var(--fs-h4-lh)",
        marginBottom: "clamp(12px, 1.2vw, 18px)",
      }}
    >
      {children}
    </h3>
  );
}
