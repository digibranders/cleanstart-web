import { Header } from '@/components/nav/Header';
import { Footer } from '@/components/sections/Footer';
import { BlogDetailCTA } from '@/components/sections/blog/BlogDetailCTA';
import { KnowledgeHubArticleHero } from '@/components/sections/knowledge-hub/KnowledgeHubArticleHero';
import { KnowledgeHubSidebar } from '@/components/sections/knowledge-hub/KnowledgeHubSidebar';
import { FadeUp } from '@/components/ui/FadeUp';
import { getKnowledgeTree } from '@/lib/knowledge-hub';

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
            <div className="mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-16 lg:pt-24 pb-section-cta">
              <div className="grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-16">
                <aside
                  data-lenis-prevent
                  className="lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-3 [scrollbar-width:thin]"
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
