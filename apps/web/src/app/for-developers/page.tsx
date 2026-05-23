import type React from 'react';
import { Header } from '@/components/sections/Header';
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
  title: 'For Developers — Trusted Container Foundations',
  description:
    'Build and ship with pre-hardened, verifiable container foundations. Eliminate inherited vulnerabilities, automate SBOMs, and meet compliance requirements without changing your workflow.',
  path: '/for-developers',
});

export default function ForDevelopersPage(): React.ReactElement {
  return (
    <>
      <JsonLd
        id="for-developers-breadcrumbs"
        data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'For Developers' }])}
      />
      <Header />
      <main>
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
