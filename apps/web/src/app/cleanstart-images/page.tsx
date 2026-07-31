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
import { breadcrumbSchema, softwareApplicationSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { getPageGraph } from "@/lib/seo/compose-page";

export const metadata = buildPageMetadata({
  title: "Zero CVE Hardened Container Images | CleanStart",
  absoluteTitle: true,
  description:
    "Source-built, hardened container images with near-zero CVEs and verifiable provenance, up to 80% smaller and continuously rebuilt to stay current with the latest fixes.",
  path: "/cleanstart-images",
  variant: "hero",
  eyebrow: "CleanStart Images",
  ogTitle: "Trusted Container Foundations",
  titleAccent: "Foundations",
});

export const revalidate = 21600; // 6h ISR fallback — on-demand publish revalidation keeps this fresh

export default async function CleanStartImagesPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph("/cleanstart-images", [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "CleanStart Images" },
    ]),
    softwareApplicationSchema({
      name: "CleanStart Images",
      description:
        "Hardened, near-zero-CVE container and virtual machine images. A drop-in replacement for your base image with smaller, faster, FIPS-ready builds.",
      path: "/cleanstart-images",
    }),
  ]);
  return (
    <>
      <JsonLdGraph id="cleanstart-images-jsonld" graph={graph} />
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
