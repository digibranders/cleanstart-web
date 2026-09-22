import type React from "react";
import Image from "next/image";
import Link from "next/link";
import type { CaseStudy } from "@/lib/case-studies";
import {
  caseStudyPath,
  formatFileMeta,
  mediaUrl,
  resolveIndustryLabel,
  summaryLead,
} from "@/lib/case-studies-utils";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { CardCoverFallback } from "@/components/ui/CardCoverFallback";
import { ArrowRightIcon, CompanyIcon, DownloadIcon } from "./CaseStudyIcons";

export type CaseStudyCardVariant = "default" | "compact";

interface CaseStudyCardProps {
  caseStudy: CaseStudy;
  /**
   * `default` is the listing tile, where the cards are the content.
   * `compact` is for rails on other pages, where they are a way out: shorter
   * cover, no summary, tighter type. A related rail that repeats the listing
   * tile at full size competes with the page the reader is already on.
   */
  variant?: CaseStudyCardVariant;
}

/**
 * Grid card for the /case-studies listing.
 *
 * The card's primary action is the story, not the file: the title is a
 * stretched link covering the whole tile, and the PDF sits beside it as a
 * deliberate second choice on its own raised layer. Reading first, downloading
 * second, matches how people actually evaluate a vendor, and it keeps a real
 * indexable page in the click path instead of sending every visitor straight
 * to a CDN asset.
 */
export function CaseStudyCard({
  caseStudy,
  variant = "default",
}: CaseStudyCardProps): React.ReactElement {
  const compact = variant === "compact";
  const coverSrc = mediaUrl(caseStudy.coverImage?.url);
  const logoSrc = mediaUrl(caseStudy.companyLogo?.url);
  const downloadHref = mediaUrl(caseStudy.asset?.url);
  const fileMeta = formatFileMeta(caseStudy.asset);
  const tag = resolveIndustryLabel(caseStudy);
  const lead = summaryLead(caseStudy.summary);

  return (
    <article
      // Anchor target for the per-entry `#slug` URL emitted in the page's
      // ItemList JSON-LD. Without it those fragments would resolve to nothing.
      id={caseStudy.slug ?? undefined}
      className={`group relative flex w-full flex-col overflow-hidden bg-white transition-[transform,box-shadow] duration-300 hover:-translate-y-1 focus-within:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none ${
        compact ? "max-w-[380px]" : "max-w-[404px]"
      }`}
      style={{
        minHeight: compact ? "clamp(276px, 22vw, 316px)" : "clamp(440px, 38vw, 528px)",
        borderRadius: compact ? "24px" : "32px",
        containerType: "inline-size",
        // Keeps the card clear of the fixed header when arrived at via #slug.
        scrollMarginTop: "96px",
        boxShadow:
          "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01), 0px 29px 17px 0px rgba(0,0,0,0.01), 0px 52px 21px 0px rgba(0,0,0,0), 0px 81px 23px 0px rgba(0,0,0,0)",
      }}
    >
      {/* Outer wrapper keeps overflow visible so the industry badge (bottom: -12px)
          spills below the image; the inner div clips the cover to rounded corners. */}
      <div
        className="relative m-3 shrink-0"
        style={{ aspectRatio: compact ? "380 / 124" : "380 / 200" }}
      >
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ borderRadius: compact ? "16px" : "20px", background: "#e8e8f0" }}
        >
          {coverSrc ? (
            <Image
              src={coverSrc}
              alt={caseStudy.coverImage?.alt ?? caseStudy.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none"
              sizes={
                compact
                  ? "(min-width: 1024px) 380px, (min-width: 640px) 45vw, 90vw"
                  : "(min-width: 1280px) 380px, (min-width: 768px) 45vw, 90vw"
              }
            />
          ) : (
            <CardCoverFallback />
          )}
        </div>

        {tag && (
          <div className="absolute" style={{ left: "20px", bottom: "-12px", zIndex: 2 }}>
            <CategoryBadge label={tag} />
          </div>
        )}
      </div>

      <div
        className={`relative flex flex-1 flex-col justify-between ${
          compact ? "px-6 pb-6 pt-7" : "px-8 pb-8 pt-9"
        }`}
      >
        <div className="flex flex-col" style={{ gap: "12px" }}>
          <div className="flex items-center" style={{ gap: "6px" }}>
            {logoSrc ? (
              <Image
                src={logoSrc}
                alt=""
                width={20}
                height={20}
                sizes="20px"
                className="object-contain"
                style={{ height: "20px", width: "auto", maxWidth: "28px" }}
              />
            ) : (
              <CompanyIcon />
            )}
            <span className="text-sm font-medium leading-normal" style={{ color: "#666" }}>
              {caseStudy.company}
            </span>
          </div>

          <div className="flex flex-col" style={{ gap: "8px" }}>
            <h3
              className="overflow-hidden font-display text-card-title-md font-medium leading-[1.3] tracking-[-0.05em]"
              style={{
                color: "#111",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
            >
              {/* Stretched link: the whole card opens the story, while the
                  download below stays a separate target on a raised layer. */}
              <Link
                href={caseStudyPath(caseStudy.slug)}
                className="before:absolute before:inset-0 before:z-[1] before:content-[''] focus-visible:outline-none focus-visible:[&::before]:outline focus-visible:[&::before]:outline-2 focus-visible:[&::before]:outline-offset-[-2px] focus-visible:[&::before]:outline-[#33BAEC]"
              >
                {caseStudy.title}
              </Link>
            </h3>
            {!compact && lead && (
              <p
                className="overflow-hidden text-body-md font-normal leading-[1.3]"
                style={{
                  color: "rgba(17,17,17,0.54)",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                }}
              >
                {lead}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between" style={{ gap: "12px" }}>
          <span
            aria-hidden
            className="inline-flex items-center gap-2 whitespace-nowrap text-body-md font-medium leading-[1.5]"
            style={{ color: "#4a3bf1" }}
          >
            Read the story
            <span className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none">
              <ArrowRightIcon />
            </span>
          </span>

          {downloadHref && (
            <a
              href={downloadHref}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-[2] inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[#666] transition-colors hover:text-[#4a3bf1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33BAEC]"
              aria-label={`Download ${caseStudy.title} (${fileMeta ?? "file"})`}
            >
              <DownloadIcon size={18} />
              {fileMeta && (
                <span
                  className="whitespace-nowrap font-medium leading-[1.5]"
                  style={{ fontSize: "var(--fs-caption)" }}
                >
                  {fileMeta}
                </span>
              )}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
