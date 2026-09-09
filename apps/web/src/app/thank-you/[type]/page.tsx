import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { ThankYouContent } from "@/components/sections/thank-you/ThankYouContent";
import { ThankYouTracker } from "@/components/sections/thank-you/ThankYouTracker";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { THANK_YOU_CONTENT } from "@/lib/thank-you/content";
import { THANK_YOU_TYPES, thankYouTypeSchema } from "@/lib/thank-you/types";

/**
 * Post-submission confirmation, one route for every form that redirects.
 *
 * `dynamicParams = false` means an unknown type is a real 404 with no work
 * done, which is the direct-access defence that actually matters and costs one
 * line. The page itself is never gated: a valid type always renders, and only
 * the conversion event is withheld unless the visitor genuinely just submitted.
 *
 * noindex because a thank-you page in the index is the classic own-goal.
 * People land on it from search, and every one of those loads inflates the
 * conversion count the page exists to measure. It is also omitted from
 * STATIC_ROUTES in sitemap.ts and disallowed in robots.ts.
 */
export const dynamicParams = false;

export function generateStaticParams(): { type: string }[] {
  return THANK_YOU_TYPES.map((type) => ({ type }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const parsed = thankYouTypeSchema.safeParse(type);
  if (!parsed.success) return { robots: { index: false, follow: true } };
  const content = THANK_YOU_CONTENT[parsed.data];
  return buildPageMetadata({
    title: content.metaTitle,
    description: content.metaDescription,
    path: `/thank-you/${parsed.data}`,
    noindex: true,
  });
}

export default async function ThankYouPage({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<React.ReactElement> {
  const { type } = await params;
  const parsed = thankYouTypeSchema.safeParse(type);
  if (!parsed.success) notFound();

  return (
    <>
      <Header />
      <main id="main-content">
        <ThankYouTracker type={parsed.data} />
        <ThankYouContent content={THANK_YOU_CONTENT[parsed.data]} />
      </main>
      <Footer />
    </>
  );
}
