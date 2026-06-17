import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { CleanStartImagesHero } from "@/components/sections/cleanstart-images/CleanStartImagesHero";
import { CleanStartImagesBrowse } from "@/components/sections/cleanstart-images/CleanStartImagesBrowse";
import { CleanStartImagesEasyStart } from "@/components/sections/cleanstart-images/CleanStartImagesEasyStart";
import { CleanStartImagesUVP } from "@/components/sections/cleanstart-images/CleanStartImagesUVP";
import { CleanStartImagesEnvironment } from "@/components/sections/cleanstart-images/CleanStartImagesEnvironment";
// Hidden for now (calculator section):
// import { CleanStartImagesMeasure } from "@/components/sections/cleanstart-images/CleanStartImagesMeasure";
import { CleanStartImagesCta } from "@/components/sections/cleanstart-images/CleanStartImagesCta";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema, softwareApplicationSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "Hardened Images Built from Source | CleanStart Images",
  absoluteTitle: true,
  description:
    "Source-built Trusted Hardened Images with reduced attack surface, verifiable provenance, and near-zero CVEs. Reduce inherited software risk with trusted container foundations.",
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
      <main id="main-content">
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
        {/* "Measure the Difference" calculator section — hidden for now.
            Restore by uncommenting this block and its import above; when you do,
            also revert CleanStartImagesEnvironment's paddingBottom back to its
            clamp value, since Measure then becomes the CTA-reserve last section. */}
        {/* <FadeUp>
          <CleanStartImagesMeasure />
        </FadeUp> */}
      </main>
      <Footer cta={<CleanStartImagesCta />} />
    </>
  );
}
