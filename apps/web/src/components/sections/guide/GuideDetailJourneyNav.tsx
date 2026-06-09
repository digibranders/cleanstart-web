import type React from "react";
import Link from "next/link";

export interface GuideJourneyNavTarget {
  slug: string;
  title: string;
}

interface GuideDetailJourneyNavProps {
  previous?: GuideJourneyNavTarget | null;
  next?: GuideJourneyNavTarget | null;
}

const LABEL_COLOR_PREV = "#E91E76";
const LABEL_COLOR_NEXT = "#9A51FF";
const RULE_COLOR = "rgba(17,17,17,0.12)";

export function GuideDetailJourneyNav({
  previous,
  next,
}: GuideDetailJourneyNavProps): React.ReactElement | null {
  if (!previous && !next) return null;

  const onlyOne = !previous || !next;

  return (
    <section
      className="relative w-full bg-white"
      data-section="GuideDetailJourneyNav"
      aria-label="Guide navigation"
    >
      <div className="relative mx-auto max-w-[1120px] px-6">
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-y-6 md:gap-x-12 py-6 md:py-8"
          style={{
            borderTop: `1px solid ${RULE_COLOR}`,
            borderBottom: `1px solid ${RULE_COLOR}`,
          }}
        >
          {previous ? (
            <JourneyCell
              label="Previous Guide:"
              labelColor={LABEL_COLOR_PREV}
              target={previous}
              rel="prev"
              align="left"
              fullWidth={onlyOne}
            />
          ) : (
            <div aria-hidden className="hidden md:block" />
          )}
          {next ? (
            <JourneyCell
              label="Next Guide:"
              labelColor={LABEL_COLOR_NEXT}
              target={next}
              rel="next"
              align="right"
              fullWidth={onlyOne}
            />
          ) : (
            <div aria-hidden className="hidden md:block" />
          )}
        </div>
      </div>
    </section>
  );
}

interface JourneyCellProps {
  label: string;
  labelColor: string;
  target: GuideJourneyNavTarget;
  rel: "prev" | "next";
  align: "left" | "right";
  fullWidth: boolean;
}

function JourneyCell({
  label,
  labelColor,
  target,
  rel,
  align,
  fullWidth,
}: JourneyCellProps): React.ReactElement {
  return (
    <Link
      href={`/guide/${target.slug}`}
      rel={rel}
      aria-label={`${label} ${target.title}`}
      className={[
        "group flex flex-col gap-2 min-w-0",
        align === "right" ? "md:text-right md:items-end" : "md:text-left md:items-start",
        fullWidth ? "md:col-span-2" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className="text-xs md:text-sm font-medium leading-none tracking-tight"
        style={{ color: labelColor }}
      >
        {label}
      </span>
      <span
        className="text-body-md font-normal leading-[1.4] line-clamp-2 text-balance group-hover:underline"
        style={{ color: "#111" }}
      >
        {target.title}
      </span>
    </Link>
  );
}
