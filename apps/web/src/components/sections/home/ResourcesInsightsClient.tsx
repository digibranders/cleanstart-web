"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import type {
  ResourceCard,
  ResourceCardsByTab,
  TabId,
} from "@/lib/resources-insights";

/**
 * Client component for the Resources & Insights rail. Owns tab-switching
 * state, scroller centering, and content transitions.
 *
 * Transitions are CSS-driven rather than motion-library-driven: the project's
 * strict LazyMotion setup constrained the library too tightly, and plain CSS
 * gets the same smoothness with no runtime cost and no SSR hazards.
 */

const TABS: { id: TabId; label: string }[] = [
  { id: "blogs", label: "Blogs" },
  { id: "resource", label: "Resource" },
  { id: "newsroom", label: "Newsroom" },
  { id: "events", label: "Events" },
];

export function ResourcesInsightsClient({
  articlesByTab,
}: {
  articlesByTab: ResourceCardsByTab;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("blogs");
  const articles = articlesByTab[activeTab];

  // Auto-center the active tab in the horizontal scroller (mobile/tablet).
  // First tab ("blogs") stays at scroll position 0 so the bar reads from
  // the left edge by default; every other tab smoothly scrolls to center.
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (activeTab === "blogs") {
      scroller.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    const btn = scroller.querySelector<HTMLButtonElement>(
      `#tab-${activeTab}`,
    );
    if (!btn) return;
    const target =
      btn.offsetLeft - (scroller.clientWidth - btn.offsetWidth) / 2;
    scroller.scrollTo({
      left: Math.max(0, target),
      behavior: "smooth",
    });
  }, [activeTab]);

  return (
    <>
      <div
        ref={scrollerRef}
        className="mt-12 -mx-6 overflow-x-auto px-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <div
          role="tablist"
          aria-label="Resource categories"
          className="relative inline-flex items-center gap-1"
          style={{
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "100px",
            padding: "4px",
            width: "fit-content",
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="resources-articles"
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className="font-semibold leading-[1.2] tracking-[-0.04em]"
                style={{
                  fontSize: "var(--fs-body)",
                  padding: "8px 24px",
                  borderRadius: "100px",
                  cursor: "pointer",
                  border: "none",
                  background: isActive
                    ? "linear-gradient(180deg, #151021 0%, #131E8F 100%)"
                    : "transparent",
                  color: isActive ? "#fff" : "#555",
                  transition:
                    "background 360ms cubic-bezier(0.34, 1.56, 0.64, 1), color 280ms ease-out",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        id="resources-articles"
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        key={activeTab}
        className="mt-10 -mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto pl-10 pr-6 pb-2 [scrollbar-padding-left:2.5rem] [scroll-padding-left:2.5rem] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-8 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3"
      >
        {articles.map((article, idx) => (
          <div
            key={`${activeTab}:${article.title}`}
            className="shrink-0 basis-[82%] snap-start sm:shrink sm:basis-auto"
            style={{
              animation:
                "cs-tab-card-in 520ms cubic-bezier(0.22, 1, 0.36, 1) both",
              animationDelay: `${idx * 70}ms`,
            }}
          >
            <ArticleCard article={article} />
          </div>
        ))}
      </div>
    </>
  );
}

function ArticleCard({ article }: { article: ResourceCard }) {
  return (
    <a
      href={article.href}
      className="group flex flex-col gap-4 cursor-pointer transition-transform duration-300 ease-out hover:-translate-y-1"
    >
      {article.variant === "newsroom" ? (
        <NewsroomCover article={article} />
      ) : (
        <div
          className="relative h-[231px] w-full overflow-hidden rounded-[40px]"
          style={{ containerType: "inline-size" }}
        >
          <Image
            src={article.image}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {article.isCoverPoster && (
            <CoverTitleOverlay title={article.title} />
          )}
        </div>
      )}
      {/* Intentionally <p>, not <h3>: matches the parent section's
          no-heading-tag decision (least priority). */}
      <p
        className="text-[#1a1a1a] transition-colors duration-200 group-hover:text-[#1B1F4F]"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--fs-lead)",
          fontWeight: 600,
          lineHeight: 1.25,
          letterSpacing: "-0.02em",
          margin: 0,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {article.title}
      </p>
      {/* Abstract clamped to 3 lines so card heights stay reasonable. */}
      <p
        className="text-[#666]"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-body)",
          fontWeight: 400,
          lineHeight: 1.5,
          letterSpacing: "-0.02em",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {article.description}
      </p>
      <span className="inline-flex items-center gap-2 text-base font-bold text-black transition-transform duration-200 group-hover:translate-x-1">
        <span>Explore</span>
        <svg width="8" height="16" viewBox="0 0 8 16" fill="none" aria-hidden>
          <path
            d="M6.71 7.29 2.94 11.06 1.79 9.91l3.16-2.88 1.09-.92-1.09-.93-3.16-2.85L2.94 2 6.71 5.77a1.06 1.06 0 0 1 .31.75 1.06 1.06 0 0 1-.31.77Z"
            fill="currentColor"
          />
        </svg>
      </span>
    </a>
  );
}

/**
 * Cover panel for Newsroom-tab cards. Adopts the `/news` listing card's
 * branded purple gradient panel so the homepage matches the Newsroom page.
 *
 * The art (publisher logo when present, otherwise the hero image) is
 * `object-contain`-ed inside a padded inner box rather than `object-cover`-ed
 * full-bleed. Newsroom hero assets are publisher brand marks (AP, OSV, Cyber
 * Defense Magazine, …) with transparent backgrounds — `object-cover` blew
 * them up and clipped their edges (the bug). Containing them on the gradient
 * keeps every mark whole and centred. Outer geometry (231px tall, 40px
 * radius) is kept so the Newsroom tab stays consistent with the other tabs.
 */
function NewsroomCover({ article }: { article: ResourceCard }) {
  const art = article.logo ?? (article.image || null);
  return (
    <div
      className="relative flex h-[231px] w-full items-center justify-center overflow-hidden"
      style={{
        borderRadius: "40px",
        background:
          "linear-gradient(180deg, #10123e 0%, #131e8f 38%, #421ebc 100%)",
      }}
    >
      {art ? (
        <Image
          src={art}
          alt={article.publisher ?? article.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-contain pointer-events-none select-none transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <span
          className="font-display font-bold text-center text-white"
          style={{
            fontSize: "var(--fs-h3)",
            letterSpacing: "-0.03em",
          }}
        >
          {article.publisher ?? "CleanStart"}
        </span>
      )}
    </div>
  );
}

/**
 * Title overlay rendered on top of a resource cover-poster image.
 * Mirrors the booklet-cover configuration used by `ResourceCard` on the
 * resource-center listing (`/resource-center`): the title sits inside the
 * dark band of the booklet artwork, scales with the card's width via
 * container-query units, and clamps lines for longer titles.
 */
function CoverTitleOverlay({ title }: { title: string }) {
  const titleLen = title.length;
  const fontSize =
    titleLen <= 28
      ? "clamp(0.85rem, 4.2cqw, 1.15rem)"
      : titleLen <= 44
        ? "clamp(0.8rem, 3.7cqw, 1.05rem)"
        : titleLen <= 64
          ? "clamp(0.75rem, 3.2cqw, 0.95rem)"
          : "clamp(0.7rem, 2.9cqw, 0.85rem)";
  const lineClamp = titleLen <= 44 ? 3 : 4;
  return (
    <span
      className="absolute font-display font-semibold text-white overflow-hidden pointer-events-none"
      style={{
        top: "44%",
        left: "22%",
        right: "30%",
        fontSize,
        lineHeight: 1.18,
        letterSpacing: "-0.03em",
        display: "-webkit-box",
        WebkitLineClamp: lineClamp,
        WebkitBoxOrient: "vertical",
        textShadow: "0 1px 2px rgba(0,0,0,0.25)",
        overflowWrap: "anywhere",
      }}
    >
      {title}
    </span>
  );
}
