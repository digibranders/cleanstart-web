import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { CommunityHero } from "@/components/sections/community/CommunityHero";
import { CommunityTrustedBy } from "@/components/sections/community/CommunityTrustedBy";
import { CommunityResources } from "@/components/sections/community/CommunityResources";
import { CommunityTestimonials } from "@/components/sections/community/CommunityTestimonials";
import { CommunityCTA } from "@/components/sections/community/CommunityCTA";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "Community",
  description:
    "Connect with developers and security leaders sharing real-world strategies to reduce risk, secure images, and ship faster with confidence.",
  path: "/community",
});

export default function CommunityPage() {
  return (
    <>
      <JsonLd
        id="community-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Company", path: "/about-us" },
          { name: "Community" },
        ])}
      />
      <Header />
      <main>
        <CommunityHero />

        <FadeUp>
          <CommunityTrustedBy />
        </FadeUp>

        <FadeUp>
          <CommunityResources />
        </FadeUp>

        <FadeUp>
          {/* Last bg-painting section before footer — pads 250px so the
              CTA card overlap lands on the lavender section bg, not on
              empty body white. The lavender gradient is mirrored on the
              wrapper so the overlap zone paints the same colour. */}
          <div
            className="relative pb-[250px]"
            style={{
              background:
                "linear-gradient(180deg, #ECE7FE 0%, #E6E1FF 100%)",
            }}
          >
            <CommunityTestimonials />
          </div>
        </FadeUp>
      </main>

      <Footer cta={<CommunityCTA />} />
    </>
  );
}
