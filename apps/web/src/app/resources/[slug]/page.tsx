import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { ResourceDetailHero } from "@/components/sections/resource/ResourceDetailHero";
import { ResourceDetailContent } from "@/components/sections/resource/ResourceDetailContent";
import { ResourceDetailLeadCapture } from "@/components/sections/resource/ResourceDetailLeadCapture";
import {
  getResourceBySlug,
  getResourceBySlugDraft,
  getResourceSlugs,
  mediaUrl,
  resourceTypeLabel,
} from "@/lib/resources";
import { highlightLexical } from "@/lib/highlightLexical";
import { getFormById, type Form } from "@/lib/forms";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { resolveCmsSeo } from "@/lib/seo/cms-seo";
import { effectivePublishedAt } from "@/lib/published-date";
import {
  articleSchema,
  breadcrumbSchema,
} from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { buildPageGraph, seoOverride } from "@/lib/seo/compose-page";

interface ResourceDetailPageProps {
  params: Promise<{ slug: string }>;
}

// Slugs not returned here still render on first request, then cache (ISR).
export const dynamicParams = true;

/** Pre-render every published resource; degrade to on-demand if CMS is down at build. */
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const slugs = await getResourceSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: ResourceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getResourceBySlug(slug).catch(() => null);
  if (!resource) {
    return buildPageMetadata({
      title: "Resource",
      description: "CleanStart resource.",
      path: `/resources/${slug}`,
      noindex: true,
    });
  }
  const assetAbsolute = mediaUrl(resource.asset?.url);
  const seo = resolveCmsSeo(resource.seo, { absolutize: mediaUrl });
  return buildPageMetadata({
    title: seo.title ?? resource.title,
    description:
      seo.description ??
      resource.summary ??
      "Whitepapers, reports, datasheets, and case studies from CleanStart.",
    path: `/resources/${resource.slug}`,
    eyebrow: resource.type ? resourceTypeLabel(resource.type) : "Resource",
    type: "article",
    publishedTime: effectivePublishedAt(resource) ?? resource.publishedAt ?? undefined,
    ...(seo.noindex ? { noindex: true, nofollow: seo.nofollow } : {}),
    ...(seo.canonicalUrl ? { canonicalUrl: seo.canonicalUrl } : {}),
    ...(seo.image
      ? { image: seo.image }
      : assetAbsolute && resource.asset
        ? {
            image: {
              url: assetAbsolute,
              width: resource.asset.width,
              height: resource.asset.height,
              alt: resource.asset.alt ?? resource.title,
            },
          }
        : {}),
  });
}

export async function renderResourceDetail({
  slug,
  draft = false,
}: {
  slug: string;
  draft?: boolean;
}): Promise<React.ReactElement> {
  const resource = draft
    ? await getResourceBySlugDraft(slug).catch(() => null)
    : await getResourceBySlug(slug).catch(() => null);
  if (!resource) notFound();

  const assetAbsolute = mediaUrl(resource.asset?.url);

  const highlightedBody = await highlightLexical(resource.body ?? null);
  const resourceWithHighlighted = { ...resource, body: highlightedBody ?? null };

  let gateForm: Form | null = null;
  if (resource.gated === true && resource.gateForm != null) {
    const gateFormId =
      typeof resource.gateForm === "object"
        ? resource.gateForm.id
        : resource.gateForm;
    if (gateFormId != null) {
      gateForm = await getFormById(gateFormId);
    }
  }

  return (
    <>
      <JsonLdGraph
        id={`resource-jsonld-${resource.slug}`}
        graph={buildPageGraph({
          nodes: [
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Resource Center", path: "/resource-center" },
              { name: resource.title },
            ]),
            articleSchema({
              title: resource.title,
              description: resource.summary ?? undefined,
              path: `/resources/${resource.slug}`,
              publishedAt: effectivePublishedAt(resource) ?? resource.publishedAt ?? undefined,
              imageUrl: assetAbsolute,
              type: resourceTypeLabel(resource.type),
            }),
          ],
          override: seoOverride(resource.seo),
        })}
      />
      <Header />
      <main
        id="main-content"
        style={{
          background:
            "linear-gradient(180deg, #151021 0%, #10123E 22%, #131E8F 48%, #471EC0 72%, #471FC3 100%)",
        }}
      >
        <ResourceDetailHero resource={resource} gateForm={gateForm} />

        <FadeUp>
          <ResourceDetailContent resource={resourceWithHighlighted} />
        </FadeUp>

      </main>
      <Footer cta={<ResourceDetailLeadCapture resource={resource} />} />
    </>
  );
}

export default async function ResourceDetailPage({
  params,
}: ResourceDetailPageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  return renderResourceDetail({ slug });
}
