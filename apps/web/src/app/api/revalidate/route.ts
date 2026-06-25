import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/revalidate
 *
 * Cross-process cache invalidation hook called by the CMS when content
 * that affects rendered pages changes (e.g. a Media filename rename, or a
 * Payload publish hook popping a nav cache tag).
 *
 * Two auth modes are supported:
 *
 * 1. Bearer token (primary, CMS media + path revalidation):
 *    Authorization: Bearer <WEB_REVALIDATE_SECRET>
 *    Body: { tags?: string[]; paths?: string[] }
 *    Accepts arbitrary tags and paths.
 *
 * 2. Body secret (Payload publish hooks, nav cache tags only):
 *    Body: { secret: <REVALIDATE_SECRET>; tag: string }
 *    Restricted to NAV_CACHE_TAGS allow-list. Single-tag per call.
 *
 * Missing / mismatching credentials → 401. Secret env var unset → 503.
 */

/** Tags that Payload publish hooks are allowed to pop via mode-2. */
const NAV_CACHE_TAGS = new Set([
  "community-images",
  "resources-latest-updates",
  "resources-spotlight",
  "company-spotlight",
  "careers-open-count",
]);

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: {
    tags?: unknown;
    paths?: unknown;
    secret?: unknown;
    tag?: unknown;
  } | null = null;

  try {
    body = (await req.json()) as {
      tags?: unknown;
      paths?: unknown;
      secret?: unknown;
      tag?: unknown;
    };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // Mode 2: body-secret, single nav cache tag (Payload publish hooks).
  if (body?.secret !== undefined) {
    const navSecret = process.env.REVALIDATE_SECRET;
    if (!navSecret) {
      return NextResponse.json(
        { ok: false, error: "revalidation_disabled" },
        { status: 503 },
      );
    }
    if (typeof body.secret !== "string" || body.secret !== navSecret) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 401 });
    }
    const tag = body.tag;
    if (typeof tag !== "string" || !NAV_CACHE_TAGS.has(tag)) {
      return NextResponse.json(
        { ok: false, error: "unknown tag" },
        { status: 400 },
      );
    }
    revalidateTag(tag, "default");
    return NextResponse.json({ ok: true, tag });
  }

  // Mode 1: Bearer token, arbitrary tags + paths (CMS media / content hooks).
  const expected = process.env.WEB_REVALIDATE_SECRET;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "revalidation_disabled" },
      { status: 503 },
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  if (token !== expected) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 401 });
  }

  const tags = Array.isArray(body?.tags)
    ? body.tags.filter((t): t is string => typeof t === "string" && t.length > 0)
    : [];
  const paths = Array.isArray(body?.paths)
    ? body.paths.filter(
        (p): p is string => typeof p === "string" && p.startsWith("/"),
      )
    : [];

  // Next 16 `revalidateTag` requires a cache profile arg. "default"
  // matches the framework's built-in profile and triggers an immediate
  // purge of fetches tagged with this tag on the next request.
  for (const tag of tags) revalidateTag(tag, "default");
  // The CMS publish hooks always send concrete resolved URLs — the listing
  // (e.g. /blogs) and the exact detail URL (e.g. /blogs/my-post), never a
  // bracket route pattern. Call revalidatePath with NO type arg: for a
  // resolved URL that is the documented "revalidate this specific URL" form,
  // which purges both static listings and dynamic [slug] detail pages.
  // Passing "page" alongside a *resolved* dynamic URL silently no-ops —
  // "page" only matches the route pattern (/blogs/[slug]), not the concrete
  // instance — which left every detail page stale until the ISR TTL lapsed.
  for (const path of paths) revalidatePath(path);

  return NextResponse.json({
    ok: true,
    revalidated: { tags, paths },
  });
}
