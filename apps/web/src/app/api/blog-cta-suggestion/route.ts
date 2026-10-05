import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getBlogBySlugDraft } from "@/lib/blog";
import { getBlogCtas } from "@/lib/blog-cta/resolve";
import { toSuggestion } from "@/lib/blog-cta/suggestion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const slugSchema = z.string().regex(/^[a-z0-9][a-z0-9-]*$/).max(160);

const NO_STORE = { "Cache-Control": "no-store" } as const;

function tokenMatches(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * GET /api/blog-cta-suggestion?slug=<blog slug>
 *
 * What the blog sidebar would show for this post with no editor picks: the
 * catalog image and the resource the page would choose by itself. Called by
 * the CMS admin (server to server) so an editor can see the automatic pick
 * under the override fields. Uses the draft when there is one, so it reflects
 * what the editor is working on.
 *
 * Same bearer secret as /api/revalidate. Secret unset is 503, a wrong or
 * missing token is 401.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const expected = process.env.WEB_REVALIDATE_SECRET;
  if (!expected) {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 503, headers: NO_STORE });
  }
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  if (!tokenMatches(token, expected)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 401, headers: NO_STORE });
  }

  const slug = slugSchema.safeParse(new URL(req.url).searchParams.get("slug"));
  if (!slug.success) {
    return NextResponse.json({ ok: false, error: "invalid_slug" }, { status: 400, headers: NO_STORE });
  }

  const post = await getBlogBySlugDraft(slug.data);
  if (!post) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404, headers: NO_STORE });
  }

  // Picks cleared: this is the automatic match, whatever the editor has set.
  const ctas = await getBlogCtas({ ...post, ctaResource: null, ctaImage: null });
  return NextResponse.json({ ok: true, ...toSuggestion(ctas) }, { headers: NO_STORE });
}
