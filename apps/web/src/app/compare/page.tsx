import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { breadcrumbSchema, itemListSchema } from "@/lib/seo/jsonld";
import { getPageGraph } from "@/lib/seo/compose-page";
import {
  CompareIndexGrid,
  CompareIndexMethod,
  type CompareIndexCopy,
} from "@/components/sections/compare/CompareIndex";
import { CompareCTA } from "@/components/sections/compare/CompareCTA";
import type {
  CompareContent,
  CompareCtaContent,
} from "@/components/sections/compare/compare-types";
import { DHI } from "@/components/sections/compare/compare-content-dhi";
import { RED_HAT } from "@/components/sections/compare/compare-content-red-hat";
import { CHAINGUARD } from "@/components/sections/compare/compare-content-chainguard";

const PATH = "/compare";

/**
 * The hub's own copy, which no source document writes.
 *
 * SEO's comparison-page metadata table (2026-09-21) has a row per comparison
 * and none for the hub, so everything below is written here and wants its own
 * row before the page is indexed. `META` is deliberately descriptive: it says
 * what the comparisons cover and makes no claim a comparison would then have
 * to support.
 */
const META = {
  title: "Compare CleanStart | Hardened Container Image Comparisons",
  description:
    "Side-by-side capability comparisons of CleanStart and other hardened container image providers, covering image foundations, build process, supply chain verification, and compliance.",
} as const;

const TITLE = "Compare CleanStart";

/**
 * The page's proposition is the one the comparison tables already open with:
 * most answers are the same, and the differences are specific. The hero says
 * that in one line and makes no claim about any vendor.
 *
 * The method facts restate what every comparison page already carries: the
 * matrix footnote ("each platform's published approach and CleanStart's
 * documented capabilities as of ..."), the table's "show only the differences"
 * switch, and the qualified-cell legend. None of them names a month, so the
 * band does not go stale when a table is re-checked.
 */
const COPY: CompareIndexCopy = {
  titleLead: "Where hardened images ",
  titleAccent: "actually differ",
  standfirst:
    "CleanStart compared with other hardened image providers, one capability at a time. Pick a comparison to see the full table.",
  request: {
    heading: "Evaluating a different vendor?",
    body: "Tell us which hardened image provider is on your shortlist and we will walk you through how CleanStart compares.",
    label: "Contact us",
    href: "/contact-us",
  },
  method: {
    heading: "How these comparisons are made",
    facts: [
      {
        id: "sources",
        icon: "/images/compare/icon-origin.webp",
        title: "Published sources",
        body: "Each table sets the vendor's published approach beside CleanStart's documented capabilities.",
      },
      {
        id: "parity",
        icon: "/images/compare/icon-sbom.webp",
        title: "Matching rows stay in",
        body: "Where both vendors give the same answer, the row is still shown. One switch filters a table down to its differences.",
      },
      {
        id: "dated",
        icon: "/images/compare/icon-signed-artifact.webp",
        title: "Dated and qualified",
        body: "Every table states the month it was checked and notes where behavior varies by image or variant.",
      },
    ],
  },
};

/**
 * The closing card. Same label and destination the comparison heroes use for
 * their primary, so the family carries one label per intent. The body's claims
 * are the ones the comparison pages' own closing cards already make.
 */
const CTA: CompareCtaContent = {
  heading: "Put a verified image in your pipeline",
  body: "CleanStart Images are built from source and ship with SBOMs, software provenance, and cryptographic verification.",
  button: "Explore CleanStart Images",
  href: "/cleanstart-images",
};

/**
 * Order is the one `docs/web/WEB-PAGES.md` lists them in (C1, C2, C3), which
 * is the order they were built. The Docker comparison is also the only one
 * live, so it leads.
 */
const COMPARISONS: readonly CompareContent[] = [DHI, RED_HAT, CHAINGUARD];

export const metadata = buildPageMetadata({
  title: META.title,
  absoluteTitle: true,
  description: META.description,
  path: PATH,
  eyebrow: "Comparison",
  // Held back with the two comparisons it lists. A hub that is indexed while
  // two of its three cards point at `noindex` pages advertises more than the
  // site is ready to show, so this launches when they do.
  noindex: true,
  nofollow: true,
});

export const revalidate = 21600; // 6h ISR fallback, matching the comparison pages

/**
 * `/compare` — the hub for the comparison pages.
 *
 * Until this route existed the comparisons were orphans: no index, no sibling
 * links, and a breadcrumb that stopped at Home because a Compare crumb would
 * have pointed at a 404.
 *
 * **The Compare crumb is deliberately still not added to the comparison
 * pages.** `ComparePage` builds `Home > <page>`, and adding the middle crumb
 * now would change the live Docker page's BreadcrumbList to point at a
 * `noindex` URL. Add it in `ComparePage.tsx` at the same moment this page's
 * `noindex, nofollow` pair comes off, not before.
 *
 * **The footer's "Compare" link points here** (`Footer.tsx`, Product column).
 * It is a site-wide link on every live page, so while this route stays
 * `noindex, nofollow` those links resolve to a URL search engines crawl and
 * drop, and the indexed Docker comparison has no site-wide internal link of
 * its own. Dropping the pair below is what settles that.
 *
 * Each card composes itself from the comparison's own `CompareContent`, so
 * listing a fourth comparison is adding it to `COMPARISONS` above.
 */
export default async function CompareIndexPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph(PATH, [
    breadcrumbSchema([{ name: "Home", path: "/" }, { name: TITLE }]),
    itemListSchema(
      TITLE,
      PATH,
      COMPARISONS.map((content) => ({
        name: content.title,
        path: content.path,
      })),
    ),
  ]);

  return (
    <>
      <JsonLdGraph id="compare-index-jsonld" graph={graph} />
      <Header />
      <main id="main-content">
        {/* The hero and the card grid are one continuous dark frame, and the
            first row of cards sits inside the opening viewport, so the frame
            is not wrapped in `FadeUp`. Its cards reveal themselves. */}
        <CompareIndexGrid copy={COPY} comparisons={COMPARISONS} />
        <FadeUp>
          <CompareIndexMethod method={COPY.method} />
        </FadeUp>
      </main>
      <Footer cta={<CompareCTA content={CTA} />} />
    </>
  );
}
