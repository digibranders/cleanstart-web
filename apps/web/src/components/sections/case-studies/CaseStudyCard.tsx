import Image from "next/image";
import type { CaseStudy } from "@/lib/case-studies";
import { formatFileMeta, mediaUrl, resolveIndustryLabel } from "@/lib/case-studies-utils";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { CardCoverFallback } from "@/components/ui/CardCoverFallback";

interface CaseStudyCardProps {
  caseStudy: CaseStudy;
}

function CompanyIcon(): React.ReactElement {
  // Neutral fallback when a case study has no companyLogo upload.
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="2.5" y="3.5" width="13" height="11" rx="2" stroke="#4a3bf1" strokeWidth="1.4" />
      <path d="M6.5 7h5M6.5 10h3" stroke="#4a3bf1" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function DownloadIcon(): React.ReactElement {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4v10m0 0l-4-4m4 4l4-4M5 18h14"
        stroke="#4a3bf1"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CaseStudyCard({ caseStudy }: CaseStudyCardProps): React.ReactElement {
  const coverSrc = mediaUrl(caseStudy.coverImage?.url);
  const logoSrc = mediaUrl(caseStudy.companyLogo?.url);
  const downloadHref = mediaUrl(caseStudy.asset?.url);
  const fileMeta = formatFileMeta(caseStudy.asset);
  const tag = resolveIndustryLabel(caseStudy);

  return (
    <article
      // Anchor target for the per-entry `#slug` URL emitted in the page's
      // ItemList JSON-LD. Without it those fragments would resolve to nothing.
      id={caseStudy.slug ?? undefined}
      className="relative flex w-full max-w-[404px] flex-col bg-white overflow-hidden"
      style={{
        minHeight: "clamp(440px, 38vw, 528px)",
        borderRadius: "32px",
        containerType: "inline-size",
        // Keeps the card clear of the fixed header when arrived at via #slug.
        scrollMarginTop: "96px",
        boxShadow:
          "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01), 0px 29px 17px 0px rgba(0,0,0,0.01), 0px 52px 21px 0px rgba(0,0,0,0), 0px 81px 23px 0px rgba(0,0,0,0)",
      }}
    >
      {/* Outer wrapper keeps overflow visible so the industry badge (bottom: -12px)
          spills below the image; the inner div clips the cover to rounded corners. */}
      <div className="relative shrink-0 m-3" style={{ aspectRatio: "380 / 200" }}>
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ borderRadius: "20px", background: "#e8e8f0" }}
        >
          {coverSrc ? (
            <Image
              src={coverSrc}
              alt={caseStudy.coverImage?.alt ?? caseStudy.title}
              fill
              className="object-cover"
              sizes="(min-width: 1280px) 380px, (min-width: 768px) 45vw, 90vw"
            />
          ) : (
            <CardCoverFallback />
          )}
        </div>

        {tag && (
          <div className="absolute" style={{ left: "20px", bottom: "-12px", zIndex: 1 }}>
            <CategoryBadge label={tag} />
          </div>
        )}
      </div>

      <div className="relative flex flex-1 flex-col justify-between pt-9 pb-8 px-8">
        <div className="flex flex-col" style={{ gap: "12px" }}>
          <div className="flex items-center" style={{ gap: "4px" }}>
            {logoSrc ? (
              <Image
                src={logoSrc}
                alt={caseStudy.company}
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
              className="font-display text-card-title-md font-medium leading-[1.3] tracking-[-0.05em] overflow-hidden"
              style={{
                color: "#111",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
            >
              {caseStudy.title}
            </h3>
            {caseStudy.summary && (
              <p
                className="text-body-md font-normal leading-[1.3] overflow-hidden"
                style={{
                  color: "rgba(17,17,17,0.54)",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                }}
              >
                {caseStudy.summary}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between" style={{ gap: "12px" }}>
          {fileMeta && (
            <span
              className="text-body-md font-medium leading-[1.5] whitespace-nowrap"
              style={{ color: "#111" }}
            >
              {fileMeta}
            </span>
          )}
          {downloadHref && (
            <a
              href={downloadHref}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
              style={{ gap: "8px" }}
              aria-label={`Download ${caseStudy.title} (${fileMeta ?? "file"})`}
            >
              <span
                className="text-body-md font-medium leading-[1.5] whitespace-nowrap"
                style={{ color: "#4a3bf1" }}
              >
                Download
              </span>
              <DownloadIcon />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
