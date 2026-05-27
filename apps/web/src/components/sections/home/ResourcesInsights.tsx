import {
  getResourcesInsightsData,
  type ResourceCardsByTab,
  type TabId,
} from "@/lib/resources-insights";

import { ResourcesInsightsClient } from "./ResourcesInsightsClient";

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
 * --- Data flow -----------------------------------------------------
 *
 * This is now a SERVER component. It calls `getResourcesInsightsData()`
 * which fetches the latest 3 published items from each of 6 Payload
 * collections in parallel and caches each response for 5 minutes via
 * Next.js ISR (`fetch(..., { next: { revalidate: 300 } })`).
 *
 * The home page stays statically pre-rendered: we deliberately avoid
 * `lib/cms-fetch` because its `draftMode()` cookie read would force a
 * dynamic render on every request. Visitors get the cached HTML; CMS
 * is only contacted in background revalidation.
 *
 * If CMS is unreachable (cold start, droplet down, network blip) the
 * fetches return empty arrays and the section still renders via the
 * `PLACEHOLDER_ARTICLES_BY_TAB` constants below — the home page never
 * crashes on a CMS failure, and Next.js will keep retrying in the
 * background until the data warms up again.
 *
 * Interactive tab UI lives in `./ResourcesInsightsClient.tsx`.
 */

// =============================================================================
// Placeholder fallbacks — render when a CMS collection returns zero items
// (empty collection, fetch failed, or cold cache). Each fallback is hand-
// curated to be on-brand and slot-pluggable into the same `ResourceCard`
// shape the CMS produces.
// =============================================================================
const PLACEHOLDER_ARTICLES_BY_TAB: ResourceCardsByTab = {
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
      image: "/images/resource-center/cover-poster/datasheet-cover.png",
      title: "CleanStart Whitepaper: A Technical Architecture Overview",
      description:
        "A deep technical dive into how CleanStart's deterministic build pipeline produces hardened, signed container images at scale.",
      href: "#resource-whitepaper",
      isCoverPoster: true,
    },
    {
      image: "/images/resource-center/cover-poster/datasheet-report.png",
      title: "Container Hardening Checklist for Production Workloads",
      description:
        "A practical, vendor-neutral checklist your platform team can use to evaluate the hardening posture of any container image before it ships.",
      href: "#resource-checklist",
      isCoverPoster: true,
    },
    {
      image: "/images/resource-center/cover-poster/architecture-insights.png",
      title: "FIPS 140-3 Compliance Quick-Start Guide",
      description:
        "Step-by-step guidance for organizations adopting FIPS 140-3 cryptographic modules in containerized environments.",
      href: "#resource-fips",
      isCoverPoster: true,
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
};

/**
 * Per-tab merge: real CMS data takes precedence; if the collection
 * returned zero items the tab falls back to its hand-curated placeholders.
 * This keeps the section populated end-to-end while the CMS is still
 * empty for a given collection (or temporarily unreachable).
 */
function mergeWithFallback(cms: ResourceCardsByTab): ResourceCardsByTab {
  const out = {} as ResourceCardsByTab;
  for (const tab of Object.keys(PLACEHOLDER_ARTICLES_BY_TAB) as TabId[]) {
    const live = cms[tab];
    out[tab] = live.length > 0 ? live : PLACEHOLDER_ARTICLES_BY_TAB[tab];
  }
  return out;
}

export async function ResourcesInsights() {
  const cmsData = await getResourcesInsightsData();
  const articlesByTab = mergeWithFallback(cmsData);

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
        {/* Section label — intentionally a <p>, not an <h2>. This is a
            least-priority "discover more" rail at the bottom of the page,
            so no heading-tag in the document outline.
            Matches the Vuln page treatment (VulnBlogsResources). */}
        <p
          id="resources-title"
          className="font-display text-[#111111]"
          style={{
            fontSize: "var(--fs-h2)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            margin: 0,
          }}
        >
          Resources &amp; Insights
        </p>
        <p
          className="mt-4 max-w-[720px]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-lead)",
            fontWeight: 600,
            color: "#555",
            lineHeight: 1.4,
            letterSpacing: "-0.02em",
          }}
        >
          Stay informed with the latest research, threat intelligence reports,
          and expert analysis from our security team.
        </p>

        <ResourcesInsightsClient articlesByTab={articlesByTab} />
      </div>
    </section>
  );
}
