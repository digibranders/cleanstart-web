import { Container, Section } from '@/components/layout';
import { Header } from '@/components/nav/Header';
import { Footer } from '@/components/sections/Footer';
import { DetailHero } from '@/components/sections/_shared/DetailHero';
import { FadeUp } from '@/components/ui/FadeUp';
import { getKnowledgeLanding } from '@/lib/knowledge-hub';
import { buildPageMetadata } from '@/lib/seo/canonical';
import { JsonLd, breadcrumbSchema } from '@/lib/seo/jsonld';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = buildPageMetadata({
  title: 'Knowledge Hub: Container Security Guides',
  description:
    'Browse the CleanStart Knowledge Hub for expert guides on container security, SBOM attestations, SLSA compliance, vulnerability management, and software supply chain best practices.',
  path: '/knowledge-hub',
  eyebrow: 'Knowledge Hub',
});

export default async function KnowledgeHubPage(): Promise<React.ReactElement> {
  const groups = await getKnowledgeLanding();
  return (
    <>
      <JsonLd
        id="knowledge-hub-breadcrumbs"
        data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Knowledge Hub' }])}
      />
      <Header />
      <main>
        <DetailHero
          breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Knowledge Hub' }]}
          title="Knowledge Hub"
        />

        <FadeUp>
          <Section padding="lg">
            <Container>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {groups.map((group) => {
                  if (!group.href) return null;
                  return (
                    <Link
                      key={group.slug}
                      href={`/knowledge-hub/${group.href}`}
                      className="group flex flex-col rounded-2xl border border-black/10 bg-white p-6 transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33BAEC]"
                    >
                      <span
                        className="mb-3 font-medium uppercase tracking-[0.08em] text-cs-purple-1"
                        style={{ fontSize: 'var(--fs-eyebrow)' }}
                      >
                        {group.count} {group.count === 1 ? 'article' : 'articles'}
                      </span>
                      <h3
                        className="mb-3 font-semibold text-cs-text-dark"
                        style={{ fontSize: 'var(--fs-h4)' }}
                      >
                        {group.name}
                      </h3>
                      <p
                        className="text-black/70 line-clamp-3"
                        style={{ fontSize: 'var(--fs-body-sm)' }}
                      >
                        {group.blurb}
                      </p>
                      <span
                        className="mt-4 font-medium text-cs-purple-1 transition-transform group-hover:translate-x-0.5"
                        style={{ fontSize: 'var(--fs-body-sm)' }}
                      >
                        Browse →
                      </span>
                    </Link>
                  );
                })}
              </div>
            </Container>
          </Section>
        </FadeUp>
      </main>
      <Footer />
    </>
  );
}
