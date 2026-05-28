import type { Metadata } from "next";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { BlogDetailCTA } from "@/components/sections/blog/BlogDetailCTA";
import { KnowledgeHubArticleHero } from "@/components/sections/knowledge-hub/KnowledgeHubArticleHero";
import { KnowledgeHubArticle } from "@/components/sections/knowledge-hub/KnowledgeHubArticle";
import { FadeUp } from "@/components/ui/FadeUp";
import { buildPageMetadata } from "@/lib/seo/canonical";

const TITLE =
  "How to Use VEX Documents to Suppress Non-Exploitable CVEs in Your Pipeline";
const DESCRIPTION =
  "CleanStart addresses several critical challenges that plague traditional container security approaches.";

export const metadata: Metadata = buildPageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/knowledge-hub/vex-documents",
  type: "article",
});

export default function KnowledgeHubVexDocumentsPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main>
        <KnowledgeHubArticleHero />
        <FadeUp>
          <KnowledgeHubArticle />
        </FadeUp>
      </main>
      <Footer cta={<BlogDetailCTA />} />
    </>
  );
}
