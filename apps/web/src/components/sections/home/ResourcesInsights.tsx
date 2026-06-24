import {
  getResourcesInsightsData,
  type ResourceCardsByTab,
  type TabId,
} from "@/lib/resources-insights";
import { Reveal } from "@/components/ui/Reveal";

import { ResourcesInsightsClient } from "./ResourcesInsightsClient";

/**
 * Server component for the "Resources & Insights" rail.
 *
 * It calls `getResourcesInsightsData()`
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

// Placeholder fallbacks render when a CMS collection returns zero items
// (empty collection, fetch failed, or cold cache).
const PLACEHOLDER_ARTICLES_BY_TAB: ResourceCardsByTab = {
  blogs: [
    {
      image: "/images/resource-1.webp",
      title: "Why SBOMs Alone Do Not Establish Container Trust",
      description:
        "Software Bill of Materials (SBOMs) have become the go-to compliance artifact in container security conversations.",
      href: "#blog-sbom",
    },
    {
      image: "/images/resource-2.webp",
      title:
        "The Hidden Risk Inside Most Container Images: Why BusyBox Still Ships in Production",
      description:
        "When people talk about container security, the discussion usually focuses on vulnerabilities in application dependencies, base image updates,...",
      href: "#blog-busybox",
    },
    {
      image: "/images/resource-3.webp",
      title:
        "Minimal vs Hardened vs Secure Container Images: What's the Difference and Why It Matters",
      description:
        "Container images are the foundation of modern application delivery. Yet most organizations still build on images they did not create,",
      href: "#blog-minimal",
    },
  ],
  resource: [
    {
      image: "/images/resource-center/cover-poster/whitepaper.webp",
      title: "CleanStart Whitepaper: A Technical Architecture Overview",
      description:
        "A deep technical dive into how CleanStart's deterministic build pipeline produces hardened, signed container images at scale.",
      href: "#resource-whitepaper",
      isCoverPoster: true,
    },
    {
      image: "/images/resource-center/cover-poster/datasheet-report.webp",
      title: "Container Hardening Checklist for Production Workloads",
      description:
        "A practical, vendor-neutral checklist your platform team can use to evaluate the hardening posture of any container image before it ships.",
      href: "#resource-checklist",
      isCoverPoster: true,
    },
    {
      image: "/images/resource-center/cover-poster/architecture-insights.webp",
      title: "FIPS 140-3 Compliance Quick-Start Guide",
      description:
        "Step-by-step guidance for organizations adopting FIPS 140-3 cryptographic modules in containerized environments.",
      href: "#resource-fips",
      isCoverPoster: true,
    },
  ],
  newsroom: [
    {
      image: "/images/resource-3.webp",
      title: "CleanStart Announces Series B Funding to Accelerate Adoption",
      description:
        "New investment will fund expansion of the CleanStart catalog and accelerate enterprise rollout across regulated industries.",
      href: "#news-series-b",
    },
    {
      image: "/images/resource-1.webp",
      title: "CleanStart Joins CNCF as Silver Member",
      description:
        "Reinforcing our commitment to the open-source cloud-native ecosystem with new contributions to the SLSA supply-chain framework.",
      href: "#news-cncf",
    },
    {
      image: "/images/resource-2.webp",
      title: "Annual State of Container Security Report Released",
      description:
        "Our 2026 industry report finds 78% of breaches start at the container base image — and how leading teams are fighting back.",
      href: "#news-report",
    },
  ],
  events: [
    {
      image: "/images/resource-1.webp",
      title: "KubeCon + CloudNativeCon NA 2026 — Booth #S42",
      description:
        "Live demos of CleanStart's continuous-rebuild pipeline. Drop by for a one-on-one walkthrough or a CleanStart sticker.",
      href: "#event-kubecon",
      dateLabel: "10 Nov 2026",
      location: "Salt Lake City, UT",
    },
    {
      image: "/images/resource-2.webp",
      title: "Webinar: Eliminating Zero-Days at the Base Image",
      description:
        "Join our security team for a 45-minute deep dive on shifting CVE remediation left to where it belongs — the source.",
      href: "#event-webinar",
      dateLabel: "12 Mar 2026",
      location: "Online",
    },
    {
      image: "/images/resource-3.webp",
      title: "RSA Conference 2026: CleanStart x Eventus AppSec Roundtable",
      description:
        "Closed-door discussion with security leaders from financial services on hardening container supply chains.",
      href: "#event-rsa",
      dateLabel: "27 Apr 2026",
      location: "San Francisco, CA",
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
        {/* Intentionally a <p>, not an <h2>: this is a least-priority
            "discover more" rail, so it stays out of the document outline. */}
        <Reveal header>
          <p
            id="resources-title"
            className="font-display text-[#111111]"
            style={{
              fontSize: "var(--fs-h2)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              margin: 0,
            }}
          >
            Resources &amp; Insights
          </p>
        </Reveal>
        <Reveal header delay={0.15} y={20}>
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
            Research, insights, and perspectives on trusted software delivery,
            software supply chain security, and modern infrastructure.
          </p>
        </Reveal>

        <ResourcesInsightsClient articlesByTab={articlesByTab} />
      </div>
    </section>
  );
}
