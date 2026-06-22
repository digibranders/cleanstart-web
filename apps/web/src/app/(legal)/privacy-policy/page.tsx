import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocHeader } from "@/components/sections/legal/LegalDocHeader";
import { cmsBaseUrl } from "@/lib/cms-fetch";
import { getLegalBySlug, legalEffectiveDate, PRIVACY_POLICY_SLUG } from "@/lib/legal";
import { RenderLexical } from "@/lib/renderLexical";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { resolveCmsSeo } from "@/lib/seo/cms-seo";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { getPageGraph } from "@/lib/seo/compose-page";

/**
 * Privacy Policy. The content lives in the `legalDocuments` CMS collection
 * (slug `privacy-policy`) like every other legal document, but it keeps its
 * pre-migration canonical URL `/privacy-policy` — indexed and linked from the
 * footer, cookie banner, lead-consent forms, and the job application form.
 * `/legal/privacy-policy` permanently redirects here.
 *
 * It sits in the `(legal)` route group, so it shares the persistent legal shell
 * (hero + sidebar + footer) with the `/legal/*` documents: navigating between
 * this page and any `/legal/*` doc only swaps the article — no full reload — and
 * the sidebar entry for it (via `legalHref`) points back to `/privacy-policy`.
 * This page therefore renders only the article body; the surrounding chrome
 * comes from the group `layout.tsx`.
 */

const absolutizeCmsUrl = (url: string | null | undefined): string | undefined =>
  !url ? undefined : url.startsWith("http") ? url : `${cmsBaseUrl()}${url}`;

const FALLBACK_DESCRIPTION =
  "Read CleanStart's Privacy Policy detailing how personal and organizational data is collected, used, stored, and protected across its platform and services.";

export async function generateMetadata(): Promise<Metadata> {
  const doc = await getLegalBySlug(PRIVACY_POLICY_SLUG).catch(() => null);
  if (!doc) {
    return buildPageMetadata({
      title: "Privacy Policy",
      description: FALLBACK_DESCRIPTION,
      path: "/privacy-policy",
    });
  }
  const seo = resolveCmsSeo(doc.seo, { absolutize: absolutizeCmsUrl });
  return buildPageMetadata({
    title: seo.title ?? doc.title,
    description: seo.description ?? FALLBACK_DESCRIPTION,
    path: "/privacy-policy",
    type: "article",
    publishedTime: legalEffectiveDate(doc),
    modifiedTime: doc.updatedAt ?? undefined,
    ...(seo.noindex ? { noindex: true, nofollow: seo.nofollow } : {}),
    ...(seo.canonicalUrl ? { canonicalUrl: seo.canonicalUrl } : {}),
  });
}

export default async function PrivacyPolicyPage(): Promise<React.ReactElement> {
  const doc = await getLegalBySlug(PRIVACY_POLICY_SLUG).catch(() => null);
  if (!doc) notFound();

  const graph = await getPageGraph("/privacy-policy", [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Legal", path: "/legal" },
      { name: doc.title },
    ]),
  ]);

  return (
    <>
      <LegalDocHeader doc={doc} />
      {doc.body ? <RenderLexical content={doc.body} /> : null}
      <JsonLdGraph id="privacy-policy-jsonld" graph={graph} />
    </>
  );
}
