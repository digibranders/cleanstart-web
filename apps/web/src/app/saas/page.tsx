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
 * /saas — first draft.
 *
 * Unlinked and noindex,nofollow on purpose, same as /financial-services: not in
 * nav-config, not in the sitemap, no JSON-LD graph yet — reachable only by
 * direct URL. Drop the `noindex`/`nofollow` flags, add the breadcrumb and
 * JsonLdGraph pair the other solutions pages use, and register the route in
 * nav-config + docs/web/WEB-PAGES.md when it is approved to ship.
 *
 * The slug is cheap to change while the page is unindexed and unlinked, and
 * expensive afterwards — renaming a route segment post-launch breaks every
 * indexed URL. Settle it before the noindex flags come off.
 *
 * Band rhythm, in order: dark hero, white, tinted, DARK, white, tinted, DARK.
 * Only one dark run reaches the end of the page. The Footer is itself a dark
 * gradient, so a second dark section before Outcomes would stack three dark
 * blocks into the close; the two light sections are separated by value instead.
 */
/*
 * Title and description are assembled from the proposal's own lines rather than
 * written fresh, so the page claims nothing in a search result that it does not
 * claim on the page itself.
 */
export const metadata = buildPageMetadata({
  title: 'CleanStart for SaaS | Modern Applications Move Faster',
  absoluteTitle: true,
  description:
    'Start development with verified components built for secure delivery. Enable secure development practices without slowing engineering velocity.',
  path: '/saas',
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
