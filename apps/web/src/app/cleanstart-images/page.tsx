import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { CleanStartImagesHero } from "@/components/sections/cleanstart-images/CleanStartImagesHero";
import { CleanStartImagesBrowse } from "@/components/sections/cleanstart-images/CleanStartImagesBrowse";
import { CleanStartImagesEasyStart } from "@/components/sections/cleanstart-images/CleanStartImagesEasyStart";
import { CleanStartImagesUVP } from "@/components/sections/cleanstart-images/CleanStartImagesUVP";
import { CleanStartImagesEnvironment } from "@/components/sections/cleanstart-images/CleanStartImagesEnvironment";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "CleanStart Images — CVE-Free Container & VM Images",
  description:
    "Hardened, near-zero-CVE container and virtual machine images. Replace your base image with CleanStart for smaller, faster, FIPS-ready builds — no code changes required.",
  path: "/cleanstart-images",
});

export default function CleanStartImagesPage(): React.ReactElement {
  return (
    <>
      <JsonLd
        id="cleanstart-images-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "CleanStart Images" },
        ])}
      />
      <Header />
      <main>
        <CleanStartImagesHero />
        <FadeUp>
          <CleanStartImagesBrowse />
        </FadeUp>
        <FadeUp>
          <CleanStartImagesEasyStart />
        </FadeUp>
        <FadeUp>
          <CleanStartImagesUVP />
        </FadeUp>
        <FadeUp>
          <CleanStartImagesEnvironment />
        </FadeUp>
      </main>
      <Footer />
    </>
  );
}
