import Link from "next/link";
import { cvssRating, type AdvisoryRow, type CvssRating } from "@/lib/advisory-utils";
import { formatBlogDate } from "@/lib/blog-utils";
import { effectivePublishedAt } from "@/lib/published-date";
import { GeneratedGuideCover } from "@/components/sections/_shared/GeneratedGuideCover";

/** Severity colour pairs (text on tint). Semantic, so each rating keeps its own hue. */
const SEVERITY_TONE: Record<CvssRating, { color: string; background: string }> = {
  Critical: { color: "#991B1B", background: "#FEE2E2" },
  High: { color: "#9A3412", background: "#FFEDD5" },
  Medium: { color: "#854D0E", background: "#FEF9C3" },
  Low: { color: "#166534", background: "#DCFCE7" },
  None: { color: "#374151", background: "#EEF0F3" },
};

function Pill({
  tone,
  children,
}: {
  tone: { color: string; background: string };
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <span
      className="inline-block max-w-full truncate whitespace-nowrap font-sans font-medium"
      style={{ padding: "3px 10px", borderRadius: "30px", fontSize: "var(--fs-caption)", ...tone }}
    >
      {children}
    </span>
  );
}

/** One advisory in the listing grid, built like the Guides card: generated cover, meta rule, title, technology and CVSS, then read more at the foot. */
export function AdvisoryCard({ advisory }: { advisory: AdvisoryRow }): React.ReactElement {
  const rating = cvssRating(advisory.cvssScore);
  const [firstCve, ...otherCves] = advisory.cves;
  const published = formatBlogDate(effectivePublishedAt(advisory));

  return (
    <article
      className="group relative flex h-full w-full max-w-[320px] flex-col bg-white overflow-hidden"
      style={{
        borderRadius: "16px",
        boxShadow:
          "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01), 0px 29px 17px 0px rgba(0,0,0,0.01), 0px 52px 21px 0px rgba(0,0,0,0), 0px 81px 23px 0px rgba(0,0,0,0)",
      }}
    >
      <div
        className="relative shrink-0 mx-[14px] mt-[14px] overflow-hidden"
        style={{ aspectRatio: "267 / 140", borderRadius: "8px", background: "#e8e8f0" }}
      >
        <GeneratedGuideCover keyword={advisory.coverTitle?.trim() || advisory.title} label="Advisory" />
      </div>

      <div className="flex flex-1 flex-col px-[14px] pb-[14px] pt-4">
        <div className="flex flex-col" style={{ gap: "6px" }}>
          <div className="flex items-end justify-between w-full gap-3">
            <div className="flex flex-col min-w-0" style={{ gap: "3px", color: "#666" }}>
              <span className="text-xs font-normal leading-normal">CVE ID:</span>
              <span
                className="text-sm font-medium leading-normal truncate"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {firstCve}
                {otherCves.length > 0 && ` +${otherCves.length}`}
              </span>
            </div>
            <span aria-hidden className="shrink-0" style={{ width: "1px", height: "34px", background: "#e5e5e5" }} />
            <div className="flex flex-col shrink-0" style={{ gap: "4px", color: "#666" }}>
              <span className="text-xs font-normal leading-normal">Published:</span>
              <span className="text-sm font-medium leading-normal">{published}</span>
            </div>
          </div>
          <span aria-hidden className="block w-full" style={{ height: "1px", background: "#e5e5e5" }} />
        </div>

        <div className="flex flex-1 flex-col" style={{ gap: "12px", marginTop: "16px" }}>
          <h3
            className="font-display text-card-title-md font-medium leading-[1.3] tracking-[-0.04em] overflow-hidden"
            style={{
              color: "#111",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {advisory.title}
          </h3>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <Pill tone={{ color: "#4a3bf1", background: "#EEECFF" }}>{advisory.technology}</Pill>
            </div>
            <div className="shrink-0">
              <Pill tone={SEVERITY_TONE[rating]}>
                CVSS {advisory.cvssScore.toFixed(1)} {rating}
              </Pill>
            </div>
          </div>

          <Link
            href={`/advisories/${advisory.slug}`}
            className="mt-auto flex items-center after:absolute after:inset-0"
            style={{ gap: "6px" }}
            aria-label={`Read more about ${advisory.title}`}
          >
            <span
              className="text-body-sm font-medium leading-[1.5] text-center whitespace-nowrap"
              style={{ color: "#4a3bf1" }}
            >
              Read more
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/shared/icon-arrow-read-more.svg"
              alt=""
              aria-hidden
              width={18}
              height={18}
              className="pointer-events-none select-none"
              loading="lazy"
              decoding="async"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
