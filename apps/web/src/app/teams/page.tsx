import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { TeamsHero } from "@/components/sections/teams/TeamsHero";
import { TeamsLeadership } from "@/components/sections/teams/TeamsLeadership";
import { TeamsHustleSquad } from "@/components/sections/teams/TeamsHustleSquad";
import { TeamsHowWeWork } from "@/components/sections/teams/TeamsHowWeWork";
import { TeamsCTA } from "@/components/sections/teams/TeamsCTA";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { getPageGraph } from "@/lib/seo/compose-page";

export const metadata = buildPageMetadata({
  title: "Meet the Team & Leadership",
  description:
    "Meet the CleanStart teams in security, engineering, and compliance who build and deliver trusted, verifiable software from the ground up.",
  path: "/teams",
  eyebrow: "Team",
});

export const revalidate = 21600; // 6h ISR fallback — on-demand publish revalidation keeps this fresh

export default async function TeamsPage(): Promise<React.ReactElement> {
  const graph = await getPageGraph("/teams", [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Company", path: "/about-us" },
      { name: "Teams" },
    ]),
  ]);
  return (
    <>
      <JsonLdGraph id="teams-jsonld" graph={graph} />
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
          <TeamsHowWeWork />
        </FadeUp>
      </main>

      <Footer cta={<TeamsCTA />} />
    </>
  );
}
