import { type LegalDoc, formatLegalDate, legalEffectiveDate } from "@/lib/legal";

/**
 * Document header for a legal page: the title H1 plus an "Effective" date
 * byline. The date is per-document metadata, so it lives under the title (not
 * in the section hero). Kept as a sibling pair under `.article-body` so the
 * `.article-h1:first-child` margin reset still applies (aligns with the
 * sidebar). Shared by the live route and the CMS preview render.
 */
export function LegalDocHeader({
  doc,
}: {
  doc: Pick<LegalDoc, "title" | "effectiveDate" | "displayPublishedAt" | "publishedAt">;
}): React.ReactElement {
  const effective = formatLegalDate(legalEffectiveDate(doc));
  return (
    <>
      <h1 className="article-h1 legal-doc-title">{doc.title}</h1>
      {effective ? (
        <p
          style={{
            fontSize: "var(--fs-body-sm)",
            color: "#64748B",
            marginTop: "-0.5rem",
            marginBottom: "1.75rem",
          }}
        >
          Effective {effective}
        </p>
      ) : null}
    </>
  );
}
