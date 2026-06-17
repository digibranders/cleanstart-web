import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { TeamsHero } from "@/components/sections/teams/TeamsHero";
import { TeamsLeadership } from "@/components/sections/teams/TeamsLeadership";
import { TeamsHustleSquad } from "@/components/sections/teams/TeamsHustleSquad";
import { TeamsInsiders } from "@/components/sections/teams/TeamsInsiders";
import { TeamsHowWeWork } from "@/components/sections/teams/TeamsHowWeWork";
import { TeamsCTA } from "@/components/sections/teams/TeamsCTA";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "Meet the Team & Leadership",
  description:
    "Explore CleanStart's expert teams in security, engineering, and compliance, united by a shared mission to build and deliver trusted, verifiable software from the ground up.",
  path: "/teams",
  eyebrow: "Team",
});

export default function TeamsPage() {
  return (
    <>
      <JsonLd
        id="teams-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Company", path: "/about-us" },
          { name: "Teams" },
        ])}
      />
      <Header />
      <main id="main-content">
        <div className="bg-cs-hero bg-cs-grid relative overflow-hidden">
          <TeamsHero />
        </div>

        <FadeUp>
          <TeamsLeadership />
        </FadeUp>

        <FadeUp>
          <TeamsHustleSquad />
        </FadeUp>

        <FadeUp>
          <TeamsInsiders />
        </FadeUp>

        <FadeUp>
          <TeamsHowWeWork />
        </FadeUp>
      </main>

      <Footer cta={<TeamsCTA />} />
    </>
  );
}
