import type { Metadata } from "next";

import { renderBlogDetail } from "@/app/blog/[slug]/page";
import { renderEventDetail } from "@/app/events/[slug]/page";
import { renderNewsDetail } from "@/app/news/[slug]/page";
import { renderResourceDetail } from "@/app/resource/[slug]/page";
import { cmsBaseUrl } from "@/lib/cms-fetch";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview · CleanStart",
  robots: { index: false, follow: false, nocache: true },
};

interface PreviewPageProps {
  params: Promise<{ collection: string; slug: string }>;
  searchParams: Promise<{ token?: string }>;
}

interface VerifyResponse {
  ok: boolean;
  collection?: string;
  docId?: string;
  path?: string;
  error?: string;
}

/**
 * Server-side token validation. We always re-validate against the CMS so
 * `revokedAt` takes effect immediately — no cookie or local cache to
 * invalidate.
 */
async function verifyToken(token: string): Promise<VerifyResponse> {
  try {
    const res = await fetch(`${cmsBaseUrl()}/api/preview/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
    });
    const body = (await res.json()) as VerifyResponse;
    if (!res.ok) return { ok: false, error: body.error ?? "verify_failed" };
    return body;
  } catch {
    return { ok: false, error: "cms_unreachable" };
  }
}

const reasonToMessage = (reason: string | undefined): string => {
  switch (reason) {
    case "expired":
      return "This preview link has expired.";
    case "revoked":
      return "This preview link has been revoked by an editor.";
    case "bad_signature":
    case "malformed":
    case "bad_payload":
      return "This preview link is invalid.";
    case "doc_missing":
      return "The draft this link points to has been removed.";
    case "audit_row_missing":
      return "This preview link is no longer recognised.";
    case "cms_unreachable":
      return "Could not reach the CMS to verify this link.";
    case "audit_mismatch":
      return "This token does not match the requested page.";
    default:
      return "This preview link cannot be opened.";
  }
};

const renderers: Record<string, (args: { slug: string; draft?: boolean }) => Promise<React.ReactElement>> = {
  blogs: renderBlogDetail,
  news: renderNewsDetail,
  events: renderEventDetail,
  resources: renderResourceDetail,
};

function ErrorPage({ message }: { message: string }): React.ReactElement {
  return (
    <main
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "calc(100vh - 48px)",
        padding: "2rem",
        background: "#fafafa",
        color: "#111",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "28rem",
          textAlign: "center",
          padding: "2rem",
          borderRadius: 12,
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ fontSize: "var(--fs-h5)", margin: "0 0 0.5rem" }}>Preview unavailable</h1>
        <p style={{ margin: "0 0 1rem", opacity: 0.8 }}>{message}</p>
        <a
          href="/"
          style={{
            display: "inline-block",
            padding: "0.5rem 1rem",
            borderRadius: 6,
            background: "#111",
            color: "#fff",
            textDecoration: "none",
            fontSize: "var(--fs-body-sm)",
          }}
        >
          Go to homepage
        </a>
      </div>
    </main>
  );
}

export default async function PreviewPage({
  params,
  searchParams,
}: PreviewPageProps): Promise<React.ReactElement> {
  const { collection, slug } = await params;
  const { token } = await searchParams;

  if (!token || token.length === 0) {
    return <ErrorPage message="Missing preview token." />;
  }

  const verified = await verifyToken(token);
  if (!verified.ok) {
    return <ErrorPage message={reasonToMessage(verified.error)} />;
  }

  // Token must authorize the exact collection the URL claims.
  if (verified.collection !== collection) {
    return <ErrorPage message="This token does not authorize this collection." />;
  }

  const render = renderers[collection];
  if (!render) {
    return (
      <ErrorPage
        message={`The "${collection}" collection does not have a public preview view yet.`}
      />
    );
  }

  // If the doc's slug has changed since mint-time, prefer the URL slug —
  // the live page will 404 if no draft matches, which is the right
  // behaviour (editor needs to re-mint with the new slug).
  return render({ slug, draft: true });
}
