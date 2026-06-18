import type React from 'react';
import { Header } from '@/components/nav/Header';
import { Footer } from '@/components/sections/Footer';
import { FadeUp } from '@/components/ui/FadeUp';
import { DeveloperHero } from '@/components/sections/for-developers/DeveloperHero';
import { DeveloperWhyItMatters } from '@/components/sections/for-developers/DeveloperWhyItMatters';
import { DeveloperTrustedArtifacts } from '@/components/sections/for-developers/DeveloperTrustedArtifacts';
import { DeveloperSecureFoundations } from '@/components/sections/for-developers/DeveloperSecureFoundations';
import { DeveloperCTA } from '@/components/sections/for-developers/DeveloperCTA';
import { buildPageMetadata } from '@/lib/seo/canonical';
import { JsonLd, breadcrumbSchema } from '@/lib/seo/jsonld';

export const metadata = buildPageMetadata({
  title: 'Hardened Container Images and Libraries For Developers | Cleanstart',
  absoluteTitle: true,
  description:
    "Hardened, zero-CVE container images and libraries built for modern developer stacks. Drop-in compatible with your existing CI/CD, minimal, and continuously rebuilt.",
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
        <DeveloperTrustedArtifacts />
        <FadeUp>
          <DeveloperSecureFoundations />
        </FadeUp>
      </main>
      <Footer cta={<DeveloperCTA />} />
    </>
  );
}
