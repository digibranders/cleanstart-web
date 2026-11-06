import type React from 'react';
import { Header } from '@/components/nav/Header';
import { Footer } from '@/components/sections/Footer';
import { FadeUp } from '@/components/ui/FadeUp';
import { TelecomHero } from '@/components/sections/telecom/TelecomHero';
import { TelecomNetwork } from '@/components/sections/telecom/TelecomNetwork';
import { TelecomRisks } from '@/components/sections/telecom/TelecomRisks';
import { TelecomFoundation } from '@/components/sections/telecom/TelecomFoundation';
import { TelecomJourney } from '@/components/sections/telecom/TelecomJourney';
import { TelecomPillars } from '@/components/sections/telecom/TelecomPillars';
import { TelecomOutcomes } from '@/components/sections/telecom/TelecomOutcomes';
import { TelecomCTA } from '@/components/sections/telecom/TelecomCTA';
import { buildPageMetadata } from '@/lib/seo/canonical';
import { breadcrumbSchema } from '@/lib/seo/jsonld';
import { JsonLdGraph } from '@/components/JsonLdGraph';
import { getPageGraph } from '@/lib/seo/compose-page';

/*
 * /industries/telecom
 *
 * Third page under /industries, built from the client's Telecom brief. The H1
 * is the brief's slogan and carries "Telecom" but not the head term, so the
 * title follows the siblings' shape ("Container Security for ...") and holds
 * the keyword for the SERP. Title and description are ours, not the SEO team's:
 * get them signed off before launch.
 *
 * DRAFT: noindex, absent from the sitemap's STATIC_ROUTES and from the
 * Solutions > By industry nav. The pageRegistry row exists already (it gates
 * CI). To launch: drop `noindex`, add the path to STATIC_ROUTES and add the
 * nav item in nav-config.ts.
 *
 * Breadcrumb is Home > Telecom with no Industries crumb, because /industries
 * has no page (see financial-services/page.tsx).
 *
 * Band rhythm: dark hero, white, tinted, DARK, white, tinted, DARK, the same
 * as the software-applications page, so only one dark run reaches the footer.
 */
export const metadata = buildPageMetadata({
  title: 'Container Security for Telecom Networks | CleanStart',
  absoluteTitle: true,
  description:
    'Secure cloud-native telecom networks with hardened container images, verified open source libraries, SBOMs, SLSA Level 3 provenance and FIPS 140-3 support.',
  path: '/industries/telecom',
  eyebrow: 'Solutions',
  noindex: true,
});

export const revalidate = 21600; // 6h ISR fallback; on-demand publish revalidation keeps this fresh

export default async function TelecomPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph('/industries/telecom', [
    breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Telecom' }]),
  ]);
  return (
    <>
      <JsonLdGraph id="telecom-jsonld" graph={graph} />
      <Header />
      <main id="main-content">
        <TelecomHero />
        <FadeUp>
          <TelecomNetwork />
        </FadeUp>
        <FadeUp>
          <TelecomRisks />
        </FadeUp>
        <FadeUp>
          <TelecomFoundation />
        </FadeUp>
        <FadeUp>
          <TelecomJourney />
        </FadeUp>
        <FadeUp>
          <TelecomPillars />
        </FadeUp>
        <FadeUp>
          <TelecomOutcomes />
        </FadeUp>
      </main>
      <Footer cta={<TelecomCTA />} />
    </>
  );
}
