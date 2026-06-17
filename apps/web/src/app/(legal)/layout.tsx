import { Container, Section } from '@/components/layout';
import { Header } from '@/components/nav/Header';
import { Footer } from '@/components/sections/Footer';
import { LegalHero } from '@/components/sections/legal/LegalHero';
import { LegalMobileNav } from '@/components/sections/legal/LegalMobileNav';
import { LegalSidebar } from '@/components/sections/legal/LegalSidebar';
import { FadeUp } from '@/components/ui/FadeUp';
import { getLegalList, legalHref } from '@/lib/legal';

/**
 * Persistent shell for every /legal document. Header, hero, sidebar and footer
 * stay mounted across navigation; only the `{children}` article swaps on
 * client-side route changes, so switching documents is inline with no page
 * reload while each document keeps its own deep-linkable URL. The sidebar and
 * hero date are built from the `legalDocuments` CMS collection.
 */
export default async function LegalSectionLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  // Degrade to an empty sidebar if the legalDocuments collection is
  // unreachable (e.g. before the collection's migration + seed have been
  // deployed to the CMS) so the section still prerenders. Matches the
  // `.catch` fallback used by the index and [slug] routes.
  const docs = await getLegalList().catch(() => []);
  const navItems = docs.map((d) => ({
    label: d.title,
    href: legalHref(d.slug),
    icon: d.icon,
  }));

  return (
    <>
      <Header />
      <main id="main-content">
        <LegalHero title="Legal" />
        <FadeUp>
          <Section padding="none" className="bg-white pb-section-sm pt-0 sm:pt-section-sm">
            {/* flow-root establishes a BFC so the mobile nav bar's negative
                top margin (-mt-7, straddling the hero edge) doesn't collapse
                up through this container and drag the white section's
                background over the purple hero — without it the bar reads as
                sitting below the edge instead of centred on it. */}
            <Container variant="default" className="flow-root">
              <LegalMobileNav items={navItems} />
              <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10 lg:gap-16">
                <aside className="hidden lg:block">
                  <LegalSidebar items={navItems} />
                </aside>
                <article className="article-body min-w-0">{children}</article>
              </div>
            </Container>
          </Section>
        </FadeUp>
      </main>
      <Footer />
    </>
  );
}
