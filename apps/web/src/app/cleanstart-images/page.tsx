import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { CleanStartImagesHero } from "@/components/sections/cleanstart-images/CleanStartImagesHero";
import { CleanStartImagesBrowse } from "@/components/sections/cleanstart-images/CleanStartImagesBrowse";
import { CleanStartImagesEasyStart } from "@/components/sections/cleanstart-images/CleanStartImagesEasyStart";
import { CleanStartImagesUVP } from "@/components/sections/cleanstart-images/CleanStartImagesUVP";
import { CleanStartImagesEnvironment } from "@/components/sections/cleanstart-images/CleanStartImagesEnvironment";
import { CleanStartImagesMeasure } from "@/components/sections/cleanstart-images/CleanStartImagesMeasure";
import { CleanStartImagesCta } from "@/components/sections/cleanstart-images/CleanStartImagesCta";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema, softwareApplicationSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "CleanStart Platform | Secure, Verified Software Foundations",
  absoluteTitle: true,
  description:
    "Explore CleanStart's secure platform for reproducible, SLSA-aligned, and compliance-ready container image creation.",
  path: "/cleanstart-images",
  variant: "hero",
  eyebrow: "CleanStart Images",
  ogTitle: "Trusted Container Foundations",
  titleAccent: "Foundations",
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
      <JsonLd
        id="cleanstart-images-software"
        data={softwareApplicationSchema({
          name: "CleanStart Images",
          description:
            "Hardened, near-zero-CVE container and virtual machine images. A drop-in replacement for your base image with smaller, faster, FIPS-ready builds.",
          path: "/cleanstart-images",
        })}
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
        <FadeUp>
          <CleanStartImagesMeasure />
        </FadeUp>
      </main>
      <Footer cta={<CleanStartImagesCta />} />
    </>
  );
}
