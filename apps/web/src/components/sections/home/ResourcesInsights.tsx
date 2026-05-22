"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * Section: "Resources & Insights"
 * Figma title 108:8526 + tab bar 108:8529 (929×64) + 3 article cards
 *
 * - Title: Manrope Bold 62px, color #111111
 * - Description: Sora Regular 21px, color #333333
 * - Tab bar: 6 tabs ("Blogs" active by default), white bg, 30px corner radius, 64h
 *   - Active tab: gradient pill #2B97D1→#3960F9 with white text + small white dot underneath
 *   - Inactive tabs: gray text #666
 * - 3 article cards: image 404×231, then title (Bold 22px) + description (Regular 16px) + Explore link
 *
 * Interactive:
 * - Click any tab to switch (state-driven)
 * - Cards swap content per tab (placeholder content per category)
 * - Hover: card subtle lift + shadow
 * - Keyboard: Tab to focus, Enter/Space to activate
 */

type TabId = "blogs" | "resource" | "newsroom" | "knowledgehub" | "events" | "podcast";

const TABS: { id: TabId; label: string }[] = [
  { id: "blogs", label: "Blogs" },
  { id: "resource", label: "Resource" },
  { id: "newsroom", label: "Newsroom" },
  { id: "knowledgehub", label: "Knowledgehub" },
  { id: "events", label: "Events" },
  { id: "podcast", label: "Podcast" },
];

interface Article {
  image: string;
  title: string;
  description: string;
  href: string;
}

const ARTICLES_BY_TAB: Record<TabId, Article[]> = {
  blogs: [
    {
      image: "/images/resource-1.png",
      title: "Why SBOMs Alone Do Not Establish Container Trust",
      description:
        "Software Bill of Materials (SBOMs) have become the go-to compliance artifact in container security conversations.",
      href: "#blog-sbom",
    },
    {
      image: "/images/resource-2.png",
      title:
        "The Hidden Risk Inside Most Container Images: Why BusyBox Still Ships in Production",
      description:
        "When people talk about container security, the discussion usually focuses on vulnerabilities in application dependencies, base image updates,...",
      href: "#blog-busybox",
    },
    {
      image: "/images/resource-3.png",
      title:
        "Minimal vs Hardened vs Secure Container Images: What's the Difference and Why It Matters",
      description:
        "Container images are the foundation of modern application delivery. Yet most organizations still build on images they did not create,",
      href: "#blog-minimal",
    },
  ],
  resource: [
    {
      image: "/images/resource-1.png",
      title: "CleanStart Whitepaper: A Technical Architecture Overview",
      description:
        "A deep technical dive into how CleanStart's deterministic build pipeline produces hardened, signed container images at scale.",
      href: "#resource-whitepaper",
    },
    {
      image: "/images/resource-2.png",
      title: "Container Hardening Checklist for Production Workloads",
      description:
        "A practical, vendor-neutral checklist your platform team can use to evaluate the hardening posture of any container image before it ships.",
      href: "#resource-checklist",
    },
    {
      image: "/images/resource-3.png",
      title: "FIPS 140-3 Compliance Quick-Start Guide",
      description:
        "Step-by-step guidance for organizations adopting FIPS 140-3 cryptographic modules in containerized environments.",
      href: "#resource-fips",
    },
  ],
  newsroom: [
    {
      image: "/images/resource-3.png",
      title: "CleanStart Announces Series B Funding to Accelerate Adoption",
      description:
        "New investment will fund expansion of the CleanStart catalog and accelerate enterprise rollout across regulated industries.",
      href: "#news-series-b",
    },
    {
      image: "/images/resource-1.png",
      title: "CleanStart Joins CNCF as Silver Member",
      description:
        "Reinforcing our commitment to the open-source cloud-native ecosystem with new contributions to the SLSA supply-chain framework.",
      href: "#news-cncf",
    },
    {
      image: "/images/resource-2.png",
      title: "Annual State of Container Security Report Released",
      description:
        "Our 2026 industry report finds 78% of breaches start at the container base image — and how leading teams are fighting back.",
      href: "#news-report",
    },
  ],
  knowledgehub: [
    {
      image: "/images/resource-2.png",
      title: "Understanding Image Provenance and Attestation",
      description:
        "How cryptographic provenance gives you a verifiable chain-of-custody from source code to deployed container image.",
      href: "#kb-provenance",
    },
    {
      image: "/images/resource-1.png",
      title: "Sigstore + Cosign: Verifying Signed Images in CI/CD",
      description:
        "Practical guide to integrating image signature verification into your GitHub Actions, GitLab, or Argo CD workflow.",
      href: "#kb-cosign",
    },
    {
      image: "/images/resource-3.png",
      title: "Reducing Attack Surface with Distroless Patterns",
      description:
        "When and why to use distroless base images, and what tradeoffs you accept by removing the shell from production images.",
      href: "#kb-distroless",
    },
  ],
  events: [
    {
      image: "/images/resource-1.png",
      title: "KubeCon + CloudNativeCon NA 2026 — Booth #S42",
      description:
        "Live demos of CleanStart's continuous-rebuild pipeline. Drop by for a one-on-one walkthrough or a CleanStart sticker.",
      href: "#event-kubecon",
    },
    {
      image: "/images/resource-2.png",
      title: "Webinar: Eliminating Zero-Days at the Base Image",
      description:
        "Join our security team for a 45-minute deep dive on shifting CVE remediation left to where it belongs — the source.",
      href: "#event-webinar",
    },
    {
      image: "/images/resource-3.png",
      title: "RSA Conference 2026: CleanStart x Eventus AppSec Roundtable",
      description:
        "Closed-door discussion with security leaders from financial services on hardening container supply chains.",
      href: "#event-rsa",
    },
  ],
  podcast: [
    {
      image: "/images/resource-3.png",
      title: "Ep 12: Inside CleanStart's Continuous-Rebuild Pipeline",
      description:
        "How we rebuild thousands of images per day in response to upstream CVE disclosures — and why that's the future of base images.",
      href: "#podcast-12",
    },
    {
      image: "/images/resource-1.png",
      title: "Ep 11: A Conversation with the SLSA Working Group",
      description:
        "Maintainers from the SLSA framework join us to discuss provenance levels, build platforms, and the hard parts of supply-chain security.",
      href: "#podcast-11",
    },
    {
      image: "/images/resource-2.png",
      title: "Ep 10: From SBOM to Trust — The Verification Gap",
      description:
        "Why an SBOM alone doesn't tell you whether you can trust an image, and what a complete verification stack looks like in practice.",
      href: "#podcast-10",
    },
  ],
};

export function ResourcesInsights() {
  const [activeTab, setActiveTab] = useState<TabId>("blogs");
  const articles = ARTICLES_BY_TAB[activeTab];

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
    <section
      className="relative w-full pt-20 lg:pt-24"
      aria-labelledby="resources-title"
    >
      {/* Figma 108:7625 — soft purple radial bleed off the bottom-left edge (10% opacity, 1101×1101) */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "-343px",
          bottom: "-300px",
          width: "1100px",
          height: "1100px",
          background:
            "radial-gradient(circle, rgba(100,13,251,0.10) 0%, rgba(100,13,251,0) 70%)",
        }}
      />
      {/* Figma 108:8524 — soft purple radial bleed off the top-right edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          right: "-300px",
          top: "-450px",
          width: "1100px",
          height: "1100px",
          background:
            "radial-gradient(circle, rgba(100,13,251,0.10) 0%, rgba(100,13,251,0) 70%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10">
        {/* Title + description (stacked, left-aligned) */}
        <h2
          id="resources-title"
          className="font-display font-bold text-[#111111]"
          style={{
            fontSize: "var(--text-t-display-2)",
            letterSpacing: "var(--text-t-display-2-ls)",
            lineHeight: "var(--text-t-display-2-lh)",
          }}
        >
          Resources &amp; Insights
        </h2>
        <p
          className="mt-5 max-w-[622px] font-normal text-[#333333]"
          style={{
            fontSize: "var(--text-t-subhead)",
            lineHeight: "var(--text-t-subhead-lh)",
            letterSpacing: "var(--text-t-subhead-ls)",
          }}
        >
          Stay informed with the latest research, threat intelligence reports,
          and expert analysis from our security team.
        </p>

        {/* Tab bar — Figma 108:8529: 929×64, padding 8, gap 12, white bg, radius 30.
            Horizontal scroller; clicking a tab smoothly centers it (handled by
            the useEffect above; first tab "Blogs" stays at scrollLeft 0). */}
        <div
          ref={scrollerRef}
          className="mt-12 -mx-6 overflow-x-auto px-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
        <div
          role="tablist"
          aria-label="Resource categories"
          className="inline-flex items-center gap-2 rounded-full bg-white p-1.5"
          style={{
            boxShadow:
              "0 1px 0 rgba(0,0,0,0.04), 0 24px 48px -24px rgba(60,30,150,0.06)",
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
                className={`relative flex h-10 cursor-pointer items-center justify-center rounded-full px-6 text-base font-semibold leading-[1] tracking-[-0.04em] transition-colors duration-200 ease-out ${
                  isActive
                    ? "text-white"
                    : "text-[#666666] hover:text-[#111111]"
                }`}
                style={{
                  background: isActive
                    ? "linear-gradient(180deg, #2B97D1 0%, #3960F9 100%)"
                    : "transparent",
                  boxShadow: isActive
                    ? "0 6px 16px -6px rgba(57,96,249,0.45)"
                    : "none",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        </div>

        {/* Article cards row */}
        <div
          id="resources-articles"
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
          key={activeTab}
        >
          {articles.map((article) => (
            <ArticleCard key={article.title} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <a
      href={article.href}
      className="group flex flex-col gap-4 transition-transform duration-200 cursor-pointer hover:-translate-y-1"
      style={{ animation: "cs-fade-slide-in 280ms ease-out both" }}
    >
      {/* Figma: image card 404×231, corner radius 40 */}
      <div className="relative h-[231px] w-full overflow-hidden rounded-[40px]">
        <Image
          src={article.image}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <h3
        className="font-display font-bold text-black transition-colors duration-200 group-hover:text-[#1B1F4F]"
        style={{
          fontSize: "var(--text-t-heading-md)",
          lineHeight: "var(--text-t-heading-md-lh)",
          letterSpacing: "var(--text-t-heading-md-ls)",
        }}
      >
        {article.title}
      </h3>
      <p
        className="font-normal text-[#333333]"
        style={{
          fontSize: "var(--text-t-body-md)",
          lineHeight: "var(--text-t-body-md-lh)",
          letterSpacing: "var(--text-t-body-md-ls)",
        }}
      >
        {article.description}
      </p>
      {/* Figma: "Explore" Sora Bold 16px, color #000, with filled chevron arrow */}
      <span className="inline-flex items-center gap-2 text-base font-bold text-black transition-transform duration-200 group-hover:translate-x-1">
        <span>Explore</span>
        <svg
          width="8"
          height="16"
          viewBox="0 0 8 16"
          fill="none"
          aria-hidden
        >
          <path
            d="M6.71 7.29 2.94 11.06 1.79 9.91l3.16-2.88 1.09-.92-1.09-.93-3.16-2.85L2.94 2 6.71 5.77a1.06 1.06 0 0 1 .31.75 1.06 1.06 0 0 1-.31.77Z"
            fill="currentColor"
          />
        </svg>
      </span>
    </a>
  );
}
