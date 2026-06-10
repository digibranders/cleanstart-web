import type React from 'react';
import { Header } from '@/components/nav/Header';
import { Footer } from '@/components/sections/Footer';
import { FadeUp } from '@/components/ui/FadeUp';
import { DeveloperHero } from '@/components/sections/for-developers/DeveloperHero';
import { DeveloperWhyItMatters } from '@/components/sections/for-developers/DeveloperWhyItMatters';
import { DeveloperSecureFoundations } from '@/components/sections/for-developers/DeveloperSecureFoundations';
import { DeveloperWorkflows } from '@/components/sections/for-developers/DeveloperWorkflows';
import { DeveloperEliminateRisk } from '@/components/sections/for-developers/DeveloperEliminateRisk';
import { DeveloperCTA } from '@/components/sections/for-developers/DeveloperCTA';
import { buildPageMetadata } from '@/lib/seo/canonical';
import { JsonLd, breadcrumbSchema } from '@/lib/seo/jsonld';

export const metadata = buildPageMetadata({
  title: 'For Developers',
  description:
    "See how CleanStart integrates seamlessly into CI/CD pipelines so developers can ship faster using pre hardened, zero vulnerability container images without changing their workflow.",
  path: '/for-developers',
  eyebrow: 'Solutions',
});

export default function ForDevelopersPage(): React.ReactElement {
  return (
    <>
      <JsonLd
        id="for-developers-breadcrumbs"
        data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'For Developers' }])}
      />
      <Header />
      <main id="main-content">
        <DeveloperHero />
        <FadeUp>
          <DeveloperWhyItMatters />
        </FadeUp>
        <FadeUp>
          <DeveloperSecureFoundations />
        </FadeUp>
        <FadeUp>
          <DeveloperWorkflows />
        </FadeUp>
        <FadeUp>
          <DeveloperEliminateRisk />
        </FadeUp>
      </main>
      <Footer cta={<DeveloperCTA />} />
    </>
  );
}
