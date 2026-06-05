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
    "Meet the people behind CleanStart, from our executive leadership and advisory board to the team united by a shared commitment to trusted software.",
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
      <main>
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
