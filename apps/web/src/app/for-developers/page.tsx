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
import { breadcrumbSchema } from '@/lib/seo/jsonld';
import { JsonLdGraph } from '@/components/JsonLdGraph';
import { getPageGraph } from '@/lib/seo/compose-page';

export const metadata = buildPageMetadata({
  title: 'Hardened Container Images and Libraries For Developers | CleanStart',
  absoluteTitle: true,
  description:
    "Hardened, zero-CVE container images and libraries built for modern developer stacks. Drop-in compatible with your existing CI/CD, minimal, and continuously rebuilt.",
  path: '/for-developers',
  eyebrow: 'Solutions',
});

export const revalidate = 3600;

export default async function ForDevelopersPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph('/for-developers', [
    breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'For Developers' }]),
  ]);
  return (
    <>
      <JsonLdGraph id="for-developers-jsonld" graph={graph} />
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
