import { Container, Section } from "@/components/layout";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { LegalHero } from "@/components/sections/legal/LegalHero";
import { LegalSidebar } from "@/components/sections/legal/LegalSidebar";
import { FadeUp } from "@/components/ui/FadeUp";

/**
 * Persistent shell for every /legal document. Header, hero, sidebar and footer
 * stay mounted across navigation; only the `{children}` article swaps on
 * client-side route changes, so switching documents is inline with no page
 * reload while each document keeps its own deep-linkable URL. The sidebar
 * self-highlights via `usePathname`.
 */
export default function LegalSectionLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <>
      <Header />
      <main>
        <LegalHero title="Legal" />
        <FadeUp>
          <Section padding="md" className="bg-white">
            <Container variant="default">
              <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10 lg:gap-16">
                <aside>
                  <LegalSidebar />
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
