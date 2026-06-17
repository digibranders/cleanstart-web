import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { LibrariesHero } from "@/components/sections/clean-libraries/LibrariesHero";
import { LibrariesRisk } from "@/components/sections/clean-libraries/LibrariesRisk";
import { LibrariesPipeline } from "@/components/sections/clean-libraries/LibrariesPipeline";
import { LibrariesWorkflow } from "@/components/sections/clean-libraries/LibrariesWorkflow";
import { LibrariesCTA } from "@/components/sections/clean-libraries/LibrariesCTA";
import { buildPageMetadata } from "@/lib/seo/canonical";
import {
  JsonLd,
  breadcrumbSchema,
  softwareApplicationSchema,
} from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "Clean Libraries",
  description:
    "Continuously discover, validate, and govern software dependencies across your development lifecycle — including libraries introduced by AI coding assistants — with CleanStart Clean Libraries.",
  path: "/clean-libraries",
  variant: "hero",
  eyebrow: "Products",
});

export default function CleanLibrariesPage(): React.ReactElement {
  return (
    <>
      <JsonLd
        id="clean-libraries-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Clean Libraries" },
        ])}
      />
      <JsonLd
        id="clean-libraries-software"
        data={softwareApplicationSchema({
          name: "Clean Libraries",
          description:
            "Discover, validate, and govern every software dependency — including AI-introduced libraries — across the development lifecycle, with policy enforcement built into existing CI/CD and registries.",
          path: "/clean-libraries",
        })}
      />
      <Header />
      <main id="main-content">
        <LibrariesHero />
        <FadeUp>
          <LibrariesRisk />
        </FadeUp>
        <FadeUp>
          <LibrariesPipeline />
        </FadeUp>
        <FadeUp>
          <LibrariesWorkflow />
        </FadeUp>
      </main>
      <Footer cta={<LibrariesCTA />} />
    </>
  );
}
