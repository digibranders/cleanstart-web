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
 * /modern-applications
 *
 * URL, title and description are the SEO team's, applied verbatim (the H1 is
 * the client's). The SEO doc puts this page at the top level, not under the
 * /industries segment its sibling financial-services-container-security uses.
 *
 * Renamed from /saas, which never resolved in production (it returned 404
 * there, so no redirect was needed), then from /industries/saas-container-security
 * on 2026-09-02, before the page reached main. That path did resolve publicly
 * (noindex), so it 301s here from next.config alongside the short-path 301.
 * (An intermediate /industries/modern-technology existed on development for
 * an hour and never deployed, so it has no redirect.) The pageRegistry row
 * keys on path; update it to this path or the WebPage node drops out.
 *
 * Launched: the noindex,nofollow pair is dropped, the path is listed in the
 * sitemap's STATIC_ROUTES and the Solutions > By industry nav row is restored.
 * It carries the same breadcrumb + JsonLdGraph pair and pageRegistry row as
 * its sibling, so it emits the full Organization + WebSite + WebPage +
 * BreadcrumbList graph.
 *
 * The breadcrumb is Home > Modern Applications.
 *
 * Band rhythm, in order: dark hero, white, tinted, DARK, white, tinted, DARK.
 * Only one dark run reaches the end of the page. The Footer is itself a dark
 * gradient, so a second dark section before Outcomes would stack three dark
 * blocks into the close; the two light sections are separated by value instead.
 */
export const metadata = buildPageMetadata({
  title: 'Modern Application Security | CleanStart',
  absoluteTitle: true,
  description:
    'Secure modern applications with verified software components, hardened container images, and trusted open-source libraries built for faster, safer software delivery.',
  path: '/modern-applications',
  eyebrow: 'Solutions',
});

export const revalidate = 21600; // 6h ISR fallback — on-demand publish revalidation keeps this fresh

export default async function SaasPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph('/modern-applications', [
    breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Modern Applications' }]),
  ]);
  return (
    <>
      <JsonLdGraph id="modern-applications-jsonld" graph={graph} />
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
