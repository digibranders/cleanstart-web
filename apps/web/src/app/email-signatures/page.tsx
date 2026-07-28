import type React from "react";

import { Container, Section } from "@/components/layout";
import { Header } from "@/components/nav/Header";
import { SignatureCard } from "@/components/sections/email-signatures/SignatureCard";
import { Footer } from "@/components/sections/Footer";
import { getEmailSignatures, groupSignatures } from "@/lib/email-signatures";
import { buildPageMetadata } from "@/lib/seo/canonical";

/**
 * Internal directory of employee email signatures.
 *
 * Carries the site Header/Footer like every other page; the dark surface is
 * local to `main`, which sits between the (dark, glass) nav and the Footer
 * whose gradient already starts at #151021 — so the three read as one page.
 *
 * Kept out of search: `noindex, nofollow` here, a `Disallow` in robots.txt, and
 * an `X-Robots-Tag` on the bare signature route. Absent from nav and sitemap.
 */
export const metadata = buildPageMetadata({
  title: "Email Signatures | CleanStart",
  absoluteTitle: true,
  description:
    "Internal directory of CleanStart employee email signatures. Copy your signature and paste it into your mail client.",
  path: "/email-signatures",
  noindex: true,
  nofollow: true,
});

export const revalidate = 300;

export default async function EmailSignaturesPage(): Promise<React.ReactElement> {
  const signatures = await getEmailSignatures();
  const groups = groupSignatures(signatures);

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-[#151021] text-white">
        <Section padding="md">
          <Container>
            <h1 className="text-[length:var(--text-hero-utility)] font-semibold">
              Email Signatures Directory
            </h1>

            {groups.length === 0 ? (
              <p className="mt-10 text-[length:var(--fs-body)] text-white/50">
                No signatures have been published yet.
              </p>
            ) : (
              <div className="mt-10 space-y-11">
                {groups.map(({ group, people }) => (
                  <section key={group}>
                    {/* Quiet label + hairline rather than a display heading:
                        this is a directory people scan, so the groups should
                        organise the grid without competing with the names. */}
                    <div className="flex items-center gap-4">
                      <h2 className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                        {group}
                      </h2>
                      <span aria-hidden="true" className="h-px flex-1 bg-white/10" />
                    </div>
                    <div className="mt-5 grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
                      {people.map((person) => (
                        <SignatureCard key={person.slug} person={person} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
