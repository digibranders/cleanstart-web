import { Header } from '@/components/nav/Header';
import { CommunityHero } from '@/components/sections/community/CommunityHero';
import { CommunityTrustedBy } from '@/components/sections/community/CommunityTrustedBy';
import { CommunitySections } from '@/components/sections/community/CommunitySections';
import { CommunityTestimonials } from '@/components/sections/community/CommunityTestimonials';
import { CommunityCTA } from '@/components/sections/community/CommunityCTA';
import { Footer } from '@/components/sections/Footer';
import { FadeUp } from '@/components/ui/FadeUp';
import { buildPageMetadata } from '@/lib/seo/canonical';
import { JsonLd, breadcrumbSchema } from '@/lib/seo/jsonld';

export const metadata = buildPageMetadata({
  title: 'Developer & Security Community',
  description:
    'Connect with developers and security leaders sharing real-world strategies to reduce risk, secure images, and ship faster with confidence.',
  path: '/community',
});

export default function CommunityPage() {
  return (
    <>
      <JsonLd
        id="community-breadcrumbs"
        data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Community' }])}
      />
      <Header />
      <main>
        <div className="bg-cs-hero bg-cs-grid relative overflow-hidden">
          <CommunityHero />
        </div>

        <FadeUp>
          <CommunityTrustedBy />
        </FadeUp>

        <FadeUp>
          <CommunitySections />
        </FadeUp>

        <FadeUp>
          <CommunityTestimonials />
        </FadeUp>
      </main>
      <Footer cta={<CommunityCTA />} />
    </>
  );
}
