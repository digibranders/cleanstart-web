import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocHeader } from "@/components/sections/legal/LegalDocHeader";
import { RenderLexical } from "@/lib/renderLexical";
import {
  getLegalBySlug,
  getLegalBySlugDraft,
  getLegalList,
  legalEffectiveDate,
} from "@/lib/legal";
import { cmsBaseUrl } from "@/lib/cms-fetch";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { resolveCmsSeo } from "@/lib/seo/cms-seo";

const absolutizeCmsUrl = (url: string | null | undefined): string | undefined =>
  !url ? undefined : url.startsWith("http") ? url : `${cmsBaseUrl()}${url}`;
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

interface LegalPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const docs = await getLegalList().catch(() => []);
  return docs.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: LegalPageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getLegalBySlug(slug).catch(() => null);
  if (!doc) {
    return buildPageMetadata({
      title: "Legal",
      description: "CleanStart legal documents.",
      path: `/legal/${slug}`,
      noindex: true,
    });
  }
  const seo = resolveCmsSeo(doc.seo, { absolutize: absolutizeCmsUrl });
  return buildPageMetadata({
    title: seo.title ?? doc.title,
    description: seo.description ?? `${doc.title} — CleanStart legal documents.`,
    path: `/legal/${doc.slug}`,
    type: "article",
    publishedTime: legalEffectiveDate(doc),
    modifiedTime: doc.updatedAt ?? undefined,
    ...(seo.noindex ? { noindex: true } : {}),
    ...(seo.canonicalUrl ? { canonicalUrl: seo.canonicalUrl } : {}),
  });
}

export default async function LegalDocumentPage({
  params,
}: LegalPageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  const doc = await getLegalBySlug(slug).catch(() => null);
  if (!doc) notFound();

  // `<h1>` is kept as the FIRST child so the `.article-body > .article-h1:first-child`
  // margin-top reset applies (aligning it with the sidebar). JsonLd renders a
  // <script>, so placing it last keeps it out of the first-child slot.
  return (
    <>
      <LegalDocHeader doc={doc} />
      {doc.body ? <RenderLexical content={doc.body} /> : null}
      <JsonLd
        id={`legal-breadcrumbs-${doc.slug}`}
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Legal", path: "/legal" },
          { name: doc.title },
        ])}
      />
    </>
  );
}

/**
 * Self-contained render for the draft preview route (no segment-layout chrome).
 * Registered in the preview `renderers` map under the `legalDocuments` key.
 */
export async function renderLegalDetail({
  slug,
  draft = false,
}: {
  slug: string;
  draft?: boolean;
}): Promise<React.ReactElement> {
  const doc = draft
    ? await getLegalBySlugDraft(slug).catch(() => null)
    : await getLegalBySlug(slug).catch(() => null);
  if (!doc) notFound();

  return (
    <article className="article-body mx-auto max-w-[var(--container-prose)] px-6 sm:px-10 py-12">
      <LegalDocHeader doc={doc} />
      {doc.body ? <RenderLexical content={doc.body} /> : null}
    </article>
  );
}
