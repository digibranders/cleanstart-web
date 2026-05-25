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
 * UX (state, scroller centering, smooth content transitions).
 *
 * Transitions are CSS-driven (keyframe + cubic-bezier easing tuned to feel
 * spring-like without overshoot). Motion library was tried but the
 * project's strict `LazyMotion` setup boxed it in too tightly; plain CSS
 * gets the same smoothness with zero runtime cost and no SSR hazards.
 *
 * Layout / typography spec is documented on the parent server file.
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
      {/* Tab bar — matches the Vulnerability-Remediation "Blogs & Resources"
          rail style (`VulnBlogsResourcesClient.tsx`): white bg, 1px hairline
          border, 4px padding, 100px radius, active pill in the dark
          #151021→#131E8F gradient. Padding/height/typography come straight
          from there so the two rails read as one system. */}
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
                className="text-[clamp(0.9375rem,1.04vw,1.25rem)] font-semibold leading-[1.2] tracking-[-0.04em]"
                style={{
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

      {/* Article cards row — remounts on tab change; each card animates in
          via the `cs-tab-card-in` keyframe with a small stagger. */}
      <div
        id="resources-articles"
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        key={activeTab}
        className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
      >
        {articles.map((article, idx) => (
          <div
            key={`${activeTab}:${article.title}`}
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
  // Remote CMS uploads (cdn.cleanstart.com / cms.cleanstart.com / localhost
  // tunnels) are all allow-listed in next.config.ts → safe for next/image.
  return (
    <a
      href={article.href}
      className="group flex flex-col gap-4 cursor-pointer transition-transform duration-300 ease-out hover:-translate-y-1"
    >
      {/* Figma: image card 404×231, corner radius 40 */}
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
      {/* Card title — intentionally <p>, not <h3>: matches the parent
          section's "no heading-tag" decision (least priority). */}
      <p
        className="text-[#1a1a1a] transition-colors duration-200 group-hover:text-[#1B1F4F]"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(18px, 1.7vw, 24px)",
          fontWeight: 600,
          lineHeight: 1.25,
          letterSpacing: "-0.02em",
          margin: 0,
        }}
      >
        {article.title}
      </p>
      <p
        className="text-[#666]"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "clamp(15px, 1.4vw, 20px)",
          fontWeight: 400,
          lineHeight: 1.5,
          letterSpacing: "-0.02em",
        }}
      >
        {article.description}
      </p>
      {/* Figma: "Explore" Sora Bold 16px, color #000, with filled chevron arrow */}
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
