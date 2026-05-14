import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { ResourceDetailHero } from "@/components/sections/resource/ResourceDetailHero";
import { ResourceDetailContent } from "@/components/sections/resource/ResourceDetailContent";
import { ResourceDetailLeadCapture } from "@/components/sections/resource/ResourceDetailLeadCapture";
import { getResourceBySlug } from "@/lib/resources";

interface ResourceDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ResourceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getResourceBySlug(slug).catch(() => null);
  if (!resource) return { title: "Resource | CleanStart" };
  return {
    title: `${resource.title} | CleanStart`,
    description: resource.summary ?? undefined,
  };
}

export default async function ResourceDetailPage({
  params,
}: ResourceDetailPageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  const resource = await getResourceBySlug(slug).catch(() => null);
  if (!resource) notFound();

  return (
    <>
      <Header />
      <main>
        {/* Hero — dark gradient, breadcrumb, title, download button */}
        <ResourceDetailHero resource={resource} />

        {/* Content — cover image + rich-text body */}
        <FadeUp>
          <ResourceDetailContent resource={resource} />
        </FadeUp>

        {/* Lead capture — overlaps footer */}
        <FadeUp className="relative z-10" style={{ marginTop: "80px" }}>
          <ResourceDetailLeadCapture resource={resource} />
        </FadeUp>
      </main>
      <Footer topPadding={225} />
    </>
  );
}
