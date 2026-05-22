import { Header } from "@/components/sections/Header";
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
  title: "Teams",
  description:
    "Meet the people behind CleanStart — our executive leadership, advisory board, and the team united by a shared commitment to trusted software.",
  path: "/teams",
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
        {/* Hero — dark gradient bg-cs-hero + grid overlay */}
        <div className="bg-cs-hero bg-cs-grid relative overflow-hidden">
          <TeamsHero />
        </div>

        {/* Executive Leadership + Advisory Board */}
        <FadeUp>
          <TeamsLeadership />
        </FadeUp>

        {/* The Hustle Squad — team photo carousel on dark gradient */}
        <FadeUp>
          <TeamsHustleSquad />
        </FadeUp>

        {/* CleanStart Insiders testimonials */}
        <FadeUp>
          <TeamsInsiders />
        </FadeUp>

        {/* How We Work — dark gradient, pb-250 to accommodate CTA overlap */}
        <FadeUp>
          <TeamsHowWeWork />
        </FadeUp>
      </main>

      {/* Footer with Join-the-Team CTA card overlapping TeamsHowWeWork */}
      <Footer cta={<TeamsCTA />} />
    </>
  );
}
