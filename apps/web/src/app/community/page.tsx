import { Header } from '@/components/nav/Header';
import { CommunityHero } from '@/components/sections/community/CommunityHero';
import { CommunityTrustedBy } from '@/components/sections/community/CommunityTrustedBy';
import { CommunitySections } from '@/components/sections/community/CommunitySections';
import { CommunityCTA } from '@/components/sections/community/CommunityCTA';
import { Footer } from '@/components/sections/Footer';
import { FadeUp } from '@/components/ui/FadeUp';
import { buildPageMetadata } from '@/lib/seo/canonical';
import { breadcrumbSchema } from '@/lib/seo/jsonld';
import { JsonLdGraph } from '@/components/JsonLdGraph';
import { getPageGraph } from '@/lib/seo/compose-page';

export const metadata = buildPageMetadata({
  title: 'Developer & Security Community',
  description:
    "Join the CleanStart community of security practitioners, developers, and compliance leaders working together to advance trusted, verified software delivery practices.",
  path: '/community',
});

export const revalidate = 21600; // 6h ISR fallback — on-demand publish revalidation keeps this fresh

export default async function CommunityPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph('/community', [
    breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Community' }]),
  ]);
  return (
    <>
      <JsonLdGraph id="community-jsonld" graph={graph} />
      <Header />
      <main id="main-content">
        <div className="bg-cs-hero bg-cs-grid relative overflow-hidden">
          <CommunityHero />
        </div>

        <FadeUp>
          <CommunityTrustedBy />
        </FadeUp>

        <FadeUp>
          <CommunitySections />
        </FadeUp>
      </main>
      <Footer cta={<CommunityCTA />} />
    </>
  );
}
