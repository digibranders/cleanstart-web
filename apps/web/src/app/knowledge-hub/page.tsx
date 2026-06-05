import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { Section, Container } from "@/components/layout";
import { DetailHero } from "@/components/sections/_shared/DetailHero";
import {
  SIDEBAR_GROUPS,
  getArticle,
} from "@/components/sections/knowledge-hub/articles";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata: Metadata = buildPageMetadata({
  title: "Knowledge Hub: Container Security Guides",
  description:
    "Practical guides on container security, software supply-chain integrity, and compliance: VEX, keyless signing, SLSA provenance, attestation, and runtime evidence.",
  path: "/knowledge-hub",
  eyebrow: "Knowledge Hub",
});

export default function KnowledgeHubPage(): React.ReactElement {
  return (
    <>
      <JsonLd
        id="knowledge-hub-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Knowledge Hub" },
        ])}
      />
      <Header />
      <main>
        <DetailHero
          breadcrumb={[{ label: "Home", href: "/" }, { label: "Knowledge Hub" }]}
          title="Knowledge Hub"
        />

        <FadeUp>
          <Section padding="lg">
            <Container>
              {SIDEBAR_GROUPS.map((group) => (
                <div key={group.label} className="mb-16 last:mb-0">
                  <h2
                    className="mb-6 font-semibold text-cs-text-dark"
                    style={{ fontSize: "var(--fs-h2)" }}
                  >
                    {group.label}
                  </h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((item) => {
                      const article = getArticle(item.slug);
                      if (!article) return null;
                      return (
                        <Link
                          key={item.slug}
                          href={`/knowledge-hub/${item.slug}`}
                          className="group flex flex-col rounded-2xl border border-black/10 bg-white p-6 transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33BAEC]"
                        >
                          <span
                            className="mb-3 font-medium uppercase tracking-[0.08em] text-cs-purple-1"
                            style={{ fontSize: "var(--fs-eyebrow)" }}
                          >
                            {article.category}
                          </span>
                          <h3
                            className="mb-3 font-semibold text-cs-text-dark"
                            style={{ fontSize: "var(--fs-h4)" }}
                          >
                            {article.title}
                          </h3>
                          <p
                            className="text-black/70"
                            style={{ fontSize: "var(--fs-body-sm)" }}
                          >
                            {article.lead}
                          </p>
                          <span
                            className="mt-4 font-medium text-cs-purple-1 transition-transform group-hover:translate-x-0.5"
                            style={{ fontSize: "var(--fs-body-sm)" }}
                          >
                            Read article →
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </Container>
          </Section>
        </FadeUp>
      </main>
      <Footer />
    </>
  );
}
