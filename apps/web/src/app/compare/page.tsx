import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { breadcrumbSchema, itemListSchema } from "@/lib/seo/jsonld";
import { getPageGraph } from "@/lib/seo/compose-page";
import {
  CompareIndexHero,
  CompareIndexList,
  type CompareIndexCopy,
} from "@/components/sections/compare/CompareIndex";
import type { CompareContent } from "@/components/sections/compare/compare-types";
import { DHI } from "@/components/sections/compare/compare-content-dhi";
import { RED_HAT } from "@/components/sections/compare/compare-content-red-hat";
import { CHAINGUARD } from "@/components/sections/compare/compare-content-chainguard";

const PATH = "/compare";

/**
 * The hub's own copy, which no source document writes.
 *
 * SEO's comparison-page metadata table (2026-09-21) has a row per comparison
 * and none for the hub, so the title, description and the two lines below are
 * written here and want their own row before the page is indexed. They are
 * deliberately descriptive: the hub says what the comparisons cover and does
 * not make a claim of its own that a comparison would then have to support.
 */
const META = {
  title: "Compare CleanStart | Hardened Container Image Comparisons",
  description:
    "Side-by-side capability comparisons of CleanStart and other hardened container image providers, covering image foundations, build process, supply chain verification, and compliance.",
} as const;

const TITLE = "Compare CleanStart";

const COPY: CompareIndexCopy = {
  titleLead: "Compare ",
  titleAccent: "CleanStart",
  standfirst:
    "Side-by-side capability comparisons of CleanStart and other hardened container image providers, covering image foundations, build process, supply chain verification, and compliance.",
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
 * **The footer's "Compare" link is deliberately left pointing at the Docker
 * page** (`Footer.tsx`, Product column). It is a site-wide link on every live
 * page, and repointing it here would aim all of them at a `noindex` URL.
 * Repoint it to `/compare` at launch, with the crumb.
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
        <CompareIndexHero copy={COPY} comparisons={COMPARISONS} />
        <FadeUp>
          <CompareIndexList comparisons={COMPARISONS} />
        </FadeUp>
      </main>
      <Footer />
    </>
  );
}
