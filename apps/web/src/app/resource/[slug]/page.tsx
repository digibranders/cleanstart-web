import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { ResourceDetailHero } from "@/components/sections/resource/ResourceDetailHero";
import { ResourceDetailContent } from "@/components/sections/resource/ResourceDetailContent";
import { ResourceDetailLeadCapture } from "@/components/sections/resource/ResourceDetailLeadCapture";
import { getResourceBySlug, mediaUrl, resourceTypeLabel } from "@/lib/resources";
import { buildPageMetadata } from "@/lib/seo/canonical";
import {
  JsonLd,
  articleSchema,
  breadcrumbSchema,
} from "@/lib/seo/jsonld";

interface ResourceDetailPageProps {
  params: Promise<{ slug: string }>;
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
      path: `/resource/${slug}`,
      noindex: true,
    });
  }
  const assetAbsolute = mediaUrl(resource.asset?.url);
  return buildPageMetadata({
    title: resource.title,
    description:
      resource.summary ??
      "Whitepapers, reports, datasheets, and case studies from CleanStart.",
    path: `/resource/${resource.slug}`,
    type: "article",
    publishedTime: resource.publishedAt ?? undefined,
    ...(assetAbsolute && resource.asset
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

export default async function ResourceDetailPage({
  params,
}: ResourceDetailPageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  const resource = await getResourceBySlug(slug).catch(() => null);
  if (!resource) notFound();

  const assetAbsolute = mediaUrl(resource.asset?.url);

  return (
    <>
      <JsonLd
        id={`resource-breadcrumbs-${resource.slug}`}
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Resource Center", path: "/resource-center" },
          { name: resource.title },
        ])}
      />
      <JsonLd
        id={`resource-article-${resource.slug}`}
        data={articleSchema({
          title: resource.title,
          description: resource.summary ?? undefined,
          path: `/resource/${resource.slug}`,
          publishedAt: resource.publishedAt ?? undefined,
          imageUrl: assetAbsolute,
          type: resourceTypeLabel(resource.type),
        })}
      />
      <Header />
      <main style={{ background: "#f6f6f6" }}>
        {/* Hero — dark gradient, breadcrumb, title, download button */}
        <ResourceDetailHero resource={resource} />

        {/* Content — cover image + rich-text body */}
        <FadeUp>
          <ResourceDetailContent resource={resource} />
        </FadeUp>

        {/* Lead capture — overlaps footer */}
        <FadeUp className="relative z-10">
          <ResourceDetailLeadCapture resource={resource} />
        </FadeUp>
      </main>
      <Footer topPadding={234} />
    </>
  );
}
