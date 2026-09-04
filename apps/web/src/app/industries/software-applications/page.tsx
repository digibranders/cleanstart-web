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
 * /industries/software-applications
 *
 * Renamed from /industries/modern-applications on 2026-09-04, on request,
 * together with the H1 ("Applications" to "Software") and the nav label. This
 * one was live: indexable, sitemap-listed and nav-linked, so its 301 is
 * load-bearing and ships in next.config.ts alongside the route move.
 *
 * Title, description and breadcrumb were rewritten with it rather than left
 * behind. The URL, H1 and nav anchor all now say software and SaaS; leaving
 * "Modern Application Security" in the title and "Modern Applications" in the
 * breadcrumb would have pointed the page's strongest relevance signals at a
 * term it no longer uses anywhere a visitor can see. The title follows the
 * sibling's proven shape ("Container Security for Financial Services"), which
 * matters more than usual here: the H1 is a slogan carrying no keyword, so the
 * title tag is the only place the head term still lives. Sibling to financial-services under the
 * /industries segment; see that file for why the segment exists and why
 * /industries itself still 404s.
 *
 * Built as /saas, then /industries/saas-container-security, and settled here
 * on 2026-09-02 before ever being indexed or linked, so the earlier paths
 * carry no redirects. The pageRegistry row keys on path; update it to this
 * path or the WebPage node drops out of the graph.
 *
 * Launched: the noindex,nofollow pair is dropped, the path is listed in the
 * sitemap's STATIC_ROUTES and the Solutions > By industry nav row is restored.
 * It carries the same breadcrumb + JsonLdGraph pair and pageRegistry row as
 * its sibling, so it emits the full Organization + WebSite + WebPage +
 * BreadcrumbList graph.
 *
 * The breadcrumb is Home > Software and SaaS, with no Industries crumb,
 * because /industries has no page and the crumb would link to a 404.
 *
 * Band rhythm, in order: dark hero, white, tinted, DARK, white, tinted, DARK.
 * Only one dark run reaches the end of the page. The Footer is itself a dark
 * gradient, so a second dark section before Outcomes would stack three dark
 * blocks into the close; the two light sections are separated by value instead.
 */
export const metadata = buildPageMetadata({
  title: 'Container Security for SaaS and Software | CleanStart',
  absoluteTitle: true,
  description:
    'Secure SaaS and software applications with verified software components, hardened container images, and trusted open-source libraries built for faster, safer software delivery.',
  path: '/industries/software-applications',
  eyebrow: 'Solutions',
});

export const revalidate = 21600; // 6h ISR fallback — on-demand publish revalidation keeps this fresh

export default async function SaasPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph('/industries/software-applications', [
    breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Software and SaaS' }]),
  ]);
  return (
    <>
      <JsonLdGraph id="software-applications-jsonld" graph={graph} />
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
