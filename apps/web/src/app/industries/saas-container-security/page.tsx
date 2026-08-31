import type React from 'react';
import { Header } from '@/components/nav/Header';
import { Footer } from '@/components/sections/Footer';
import { FadeUp } from '@/components/ui/FadeUp';
import { SaasHero } from '@/components/sections/saas/SaasHero';
import { SaasDemands } from '@/components/sections/saas/SaasDemands';
import { SaasRisks } from '@/components/sections/saas/SaasRisks';
import { SaasShiftLeft } from '@/components/sections/saas/SaasShiftLeft';
import { SaasFoundation } from '@/components/sections/saas/SaasFoundation';
import { SaasDelivery } from '@/components/sections/saas/SaasDelivery';
import { SaasOutcomes } from '@/components/sections/saas/SaasOutcomes';
import { SaasCTA } from '@/components/sections/saas/SaasCTA';
import { buildPageMetadata } from '@/lib/seo/canonical';

/*
 * /industries/saas-container-security
 *
 * Title, description and H1 are the SEO team's, applied verbatim. Sibling to
 * financial-services-container-security under the /industries segment; see that
 * file for why the segment exists and why /industries itself still 404s.
 *
 * Renamed from /saas, which never resolved in production (it returned 404
 * there, so no redirect is needed — unlike its sibling, which did resolve).
 *
 * Still noindex,nofollow, out of the sitemap and out of the nav pending copy
 * approval. Unlike its sibling it also has no breadcrumb / JsonLdGraph pair and
 * no pageRegistry row; add both when it is approved to ship, so it emits the
 * same graph every other solutions page does.
 *
 * Band rhythm, in order: dark hero, white, tinted, DARK, white, tinted, DARK.
 * Only one dark run reaches the end of the page. The Footer is itself a dark
 * gradient, so a second dark section before Outcomes would stack three dark
 * blocks into the close; the two light sections are separated by value instead.
 */
export const metadata = buildPageMetadata({
  title: 'Container Security for SaaS Companies | CleanStart',
  absoluteTitle: true,
  description:
    'Protect SaaS applications with hardened container images, near-zero CVEs, SBOMs, signed provenance, and continuous software supply chain visibility.',
  path: '/industries/saas-container-security',
  eyebrow: 'Solutions',
  noindex: true,
  nofollow: true,
});

export default function SaasPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main id="main-content">
        <SaasHero />
        <FadeUp>
          <SaasDemands />
        </FadeUp>
        <FadeUp>
          <SaasRisks />
        </FadeUp>
        <FadeUp>
          <SaasShiftLeft />
        </FadeUp>
        <FadeUp>
          <SaasFoundation />
        </FadeUp>
        <FadeUp>
          <SaasDelivery />
        </FadeUp>
        <FadeUp>
          <SaasOutcomes />
        </FadeUp>
      </main>
      <Footer cta={<SaasCTA />} />
    </>
  );
}
