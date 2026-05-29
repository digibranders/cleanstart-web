import { Reveal } from "@/components/ui/Reveal";
import type { Article } from "./articles";
import { ArticleBody } from "./ArticleBody";
import { VexDocumentsBody } from "./VexDocumentsBody";

export function KnowledgeHubArticle({
  article,
}: {
  article: Article;
}): React.ReactElement {
  return (
    <>
      <Reveal header>
        <CategoryBadge>{article.category}</CategoryBadge>

        <h1
          className="font-display font-semibold mt-4"
          style={{
            fontSize: "var(--fs-h2)",
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            color: "#0F1023",
          }}
        >
          {article.title}
        </h1>
      </Reveal>

      <Reveal header delay={0.15} y={20}>
        <p
          className="mt-6 font-medium"
          style={{
            fontSize: "var(--fs-body)",
            lineHeight: 1.5,
            letterSpacing: "-0.01em",
            color: "#3A3F55",
          }}
        >
          {article.lead}
        </p>
      </Reveal>

      <div className="mt-12">
        {article.customBody ? (
          <VexDocumentsBody />
        ) : (
          <ArticleBody blocks={article.blocks} />
        )}
      </div>
    </>
  );
}

function CategoryBadge({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <span
      className="inline-flex items-center font-medium"
      style={{
        fontSize: "var(--fs-body-sm)",
        lineHeight: 1.4,
        letterSpacing: "-0.01em",
        color: "#471EC0",
      }}
    >
      <span style={{ color: "#5A5F75", marginRight: "6px" }}>Category:</span>
      {children}
    </span>
  );
}
