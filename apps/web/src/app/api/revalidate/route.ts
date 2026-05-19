import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/revalidate
 *
 * Cross-process cache invalidation hook called by the CMS when content
 * that affects rendered pages changes (e.g. a Media filename rename).
 * Without this, the apps/web Next.js ISR cache continues to serve old
 * URLs for up to `DEFAULT_REVALIDATE_SECONDS` (60s in `cms-fetch.ts`)
 * which is exactly when stale media URLs would 404 against R2 after a
 * rename moves the underlying object.
 *
 * Auth: shared bearer token in `WEB_REVALIDATE_SECRET`. Set the same
 * value on the CMS and on apps/web. Missing/mismatching → 401.
 *
 * Request body:
 *   { tags?: string[]; paths?: string[] }
 *
 * Both are optional; supplying neither revalidates nothing and returns 200.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
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

  let body: { tags?: unknown; paths?: unknown } | null = null;
  try {
    body = (await req.json()) as { tags?: unknown; paths?: unknown };
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
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
  // revalidatePath's second arg ('page' | 'layout') is technically
  // optional in the type signature but defaults to 'page'; pass
  // 'layout' so nested routes under the path also revalidate.
  for (const path of paths) revalidatePath(path, "layout");

  return NextResponse.json({
    ok: true,
    revalidated: { tags, paths },
  });
}
