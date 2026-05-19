import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { WebinarsHero } from "@/components/sections/webinars/WebinarsHero";
import { WebinarsGrid } from "@/components/sections/webinars/WebinarsGrid";
import { WebinarsCTA } from "@/components/sections/webinars/WebinarsCTA";
import { FadeUp } from "@/components/ui/FadeUp";
import {
  getWebinars,
  parseRegionParam,
  parseTypeParam,
} from "@/lib/webinars";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

const TITLE = "CleanStart Webinar";
const DESCRIPTION =
  "Live and on-demand webinars on hardened container images, software supply-chain security, and CleanStart product deep-dives.";

interface WebinarsPageProps {
  searchParams: Promise<{
    page?: string;
    type?: string;
    region?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: WebinarsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10));
  return buildPageMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/webinars",
    noindex: page >= 6,
  });
}

export default async function WebinarsPage({
  searchParams,
}: WebinarsPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10));
  const activeType = parseTypeParam(params.type);
  const activeRegion = parseRegionParam(params.region);

  const data = await getWebinars({
    page,
    ...(activeType ? { type: activeType } : {}),
    ...(activeRegion ? { region: activeRegion } : {}),
  }).catch(() => ({
    docs: [],
    hasNextPage: false,
    hasPrevPage: false,
    page: 1,
    totalDocs: 0,
    totalPages: 1,
  }));

  return (
    <>
      <JsonLd
        id="webinars-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Webinars" },
        ])}
      />
      <Header />
      <main style={{ background: "#F6F6F6" }}>
        <div className="relative overflow-hidden">
          <WebinarsHero />
        </div>

        <FadeUp>
          <WebinarsGrid
            items={data.docs}
            currentPage={data.page}
            totalPages={data.totalPages}
            activeType={activeType}
            activeRegion={activeRegion}
          />
        </FadeUp>

      </main>
      <Footer cta={<WebinarsCTA />} />
    </>
  );
}
