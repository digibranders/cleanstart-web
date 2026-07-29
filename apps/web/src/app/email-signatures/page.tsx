import type React from "react";

import { Container, Section } from "@/components/layout";
import { Header } from "@/components/nav/Header";
import { SignatureDirectory } from "@/components/sections/email-signatures/SignatureDirectory";
import { Footer } from "@/components/sections/Footer";
import { getEmailSignatures } from "@/lib/email-signatures";
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

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-[#151021] text-white">
        <Section padding="md">
          <Container>
            <h1 className="text-[length:var(--text-hero-utility)] font-semibold">
              Email Signatures Directory
            </h1>

            <SignatureDirectory signatures={signatures} />
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
