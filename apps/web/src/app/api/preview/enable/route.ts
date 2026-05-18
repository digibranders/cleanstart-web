import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { isPreviewableCollection } from "@/lib/preview/paths";

/**
 * GET /api/preview/enable?secret=...&collection=...&path=...&docId=...
 *
 * Called by Payload's Live Preview iframe. Validates the shared
 * `LIVE_PREVIEW_SECRET`, enables Next.js draft mode (sets the
 * `__prerender_bypass` cookie), and redirects the iframe to the
 * actual public path. From there, every CMS fetch the page makes
 * runs through `cms-fetch.ts` which honours `draftMode()`.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  const collection = url.searchParams.get("collection") ?? "";
  const path = url.searchParams.get("path") ?? "/";

  const expected = process.env.LIVE_PREVIEW_SECRET;
  if (!expected || expected.length === 0) {
    return new Response("Preview misconfigured: LIVE_PREVIEW_SECRET unset", {
      status: 500,
    });
  }
  if (secret !== expected) {
    return new Response("Invalid preview secret", { status: 401 });
  }

  if (collection.length > 0 && !isPreviewableCollection(collection)) {
    return new Response(`Collection "${collection}" is not previewable`, {
      status: 400,
    });
  }

  // Only allow same-origin paths to prevent open redirect.
  const safePath = path.startsWith("/") && !path.startsWith("//") ? path : "/";

  const dm = await draftMode();
  dm.enable();

  redirect(safePath);
}
