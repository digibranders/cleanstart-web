import type React from 'react';
import { Header } from '@/components/nav/Header';
import { Footer } from '@/components/sections/Footer';
import { FadeUp } from '@/components/ui/FadeUp';
import { PqcHero } from '@/components/sections/pqc/PqcHero';
import { PqcChallenge } from '@/components/sections/pqc/PqcChallenge';
import { PqcHowItWorks } from '@/components/sections/pqc/PqcHowItWorks';
import { PqcCapabilities } from '@/components/sections/pqc/PqcCapabilities';
import { PqcIndustries } from '@/components/sections/pqc/PqcIndustries';
import { PqcCTA } from '@/components/sections/pqc/PqcCTA';
import { buildPageMetadata } from '@/lib/seo/canonical';
import { breadcrumbSchema } from '@/lib/seo/jsonld';
import { JsonLdGraph } from '@/components/JsonLdGraph';
import { getPageGraph } from '@/lib/seo/compose-page';

/*
 * /post-quantum-cryptography
 *
 * Landing page built from the client's "PQC LP" brief. DRAFT: noindex and
 * nofollow, absent from the sitemap and from the nav, and linked from nowhere,
 * until the copy and the claims in the capability cards are signed off. Title
 * and description are ours, pending SEO review. To launch: drop `noindex` and
 * `nofollow`, add the route to the sitemap's STATIC_ROUTES, link it from the
 * nav, and seed its pageRegistry row in prod.
 *
 * Band rhythm: dark hero, white, tinted, white, DARK, so only one dark run
 * reaches the footer's CTA card (the same shape as the telecom page).
 */
export const metadata = buildPageMetadata({
  title: 'Post-Quantum Cryptography Software Foundations | CleanStart',
  absoluteTitle: true,
  description:
    'Build on hardened, verifiable software foundations for post-quantum cryptography: validated libraries, ML-KEM, ML-DSA and SLH-DSA support, SBOMs and CBOMs.',
  path: '/post-quantum-cryptography',
  eyebrow: 'Solutions',
  noindex: true,
  nofollow: true,
});

export const revalidate = 21600; // 6h ISR fallback; on-demand publish revalidation keeps this fresh

export default async function PostQuantumCryptographyPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph('/post-quantum-cryptography', [
    breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Post-Quantum Cryptography' }]),
  ]);
  return (
    <>
      <JsonLdGraph id="pqc-jsonld" graph={graph} />
      <Header />
      <main id="main-content">
        <PqcHero />
        <FadeUp>
          <PqcChallenge />
        </FadeUp>
        <FadeUp>
          <PqcHowItWorks />
        </FadeUp>
        <FadeUp>
          <PqcCapabilities />
        </FadeUp>
        <FadeUp>
          <PqcIndustries />
        </FadeUp>
      </main>
      <Footer cta={<PqcCTA />} />
    </>
  );
}
