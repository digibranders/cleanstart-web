import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

/**
 * GET /api/preview/disable[?redirect=/some/path]
 *
 * Clears the draft-mode cookie and redirects. Used by the
 * PreviewBanner "Exit" link.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  const target = url.searchParams.get("redirect") ?? "/";
  const safeTarget = target.startsWith("/") && !target.startsWith("//") ? target : "/";

  const dm = await draftMode();
  dm.disable();

  redirect(safeTarget);
}
