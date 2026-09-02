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
import { breadcrumbSchema } from '@/lib/seo/jsonld';
import { JsonLdGraph } from '@/components/JsonLdGraph';
import { getPageGraph } from '@/lib/seo/compose-page';

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
 * Launched: the noindex,nofollow pair is dropped, the path is listed in the
 * sitemap's STATIC_ROUTES and the Solutions > By industry nav row is restored.
 * It carries the same breadcrumb + JsonLdGraph pair and pageRegistry row as
 * its sibling, so it emits the full Organization + WebSite + WebPage +
 * BreadcrumbList graph.
 *
 * The breadcrumb is Home > SaaS, with no Industries crumb, because /industries
 * has no page yet and the crumb would link to a 404.
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
});

export const revalidate = 21600; // 6h ISR fallback — on-demand publish revalidation keeps this fresh

export default async function SaasPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph('/industries/saas-container-security', [
    breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'SaaS' }]),
  ]);
  return (
    <>
      <JsonLdGraph id="saas-container-security-jsonld" graph={graph} />
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
