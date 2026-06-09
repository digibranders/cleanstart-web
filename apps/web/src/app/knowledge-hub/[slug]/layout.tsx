import { Header } from '@/components/nav/Header';
import { Footer } from '@/components/sections/Footer';
import { BlogDetailCTA } from '@/components/sections/blog/BlogDetailCTA';
import { KnowledgeHubArticleHero } from '@/components/sections/knowledge-hub/KnowledgeHubArticleHero';
import { KnowledgeHubMobileNav } from '@/components/sections/knowledge-hub/KnowledgeHubMobileNav';
import { KnowledgeHubSidebar } from '@/components/sections/knowledge-hub/KnowledgeHubSidebar';
import { FadeUp } from '@/components/ui/FadeUp';
import { getKnowledgeTree } from '@/lib/knowledge-hub';
import { premiumScrollbar } from '@/lib/scrollbar';

export default async function KnowledgeHubLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const groups = await getKnowledgeTree();
  return (
    <>
      <Header />
      <main>
        <KnowledgeHubArticleHero />
        <FadeUp>
          <section className="bg-white">
            {/* flow-root establishes a BFC so the mobile nav bar's negative
                top margin (-mt-7, straddling the hero edge) doesn't collapse
                up and drag this white section's background over the purple
                hero — without it the bar reads as sitting below the edge. */}
            <div className="flow-root mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-0 sm:pt-section-sm pb-section-cta">
              <KnowledgeHubMobileNav groups={groups} />
              <div className="grid gap-10 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-12">
                <aside
                  data-lenis-prevent
                  className={`hidden lg:block lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-3 ${premiumScrollbar}`}
                >
                  <KnowledgeHubSidebar groups={groups} />
                </aside>

                <article className="min-w-0">{children}</article>
              </div>
            </div>
          </section>
        </FadeUp>
      </main>
      <Footer cta={<BlogDetailCTA />} />
    </>
  );
}
