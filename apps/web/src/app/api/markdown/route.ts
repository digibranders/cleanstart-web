import { NextResponse, type NextRequest } from "next/server";

import {
  MARKDOWN_CONTENT_TYPE,
  MARKDOWN_INTERNAL_HEADER,
  MARKDOWN_PATH_HEADER,
  MARKDOWN_TOKENS_HEADER,
  estimateMarkdownTokens,
  htmlToMarkdown,
} from "@/lib/agent-markdown";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FETCH_TIMEOUT_MS = 10_000;

/**
 * GET /api/markdown?path=/<page>
 *
 * Markdown view of an HTML page, for agents sending `Accept: text/markdown`.
 * The proxy rewrites such page requests here, passing the original path via
 * the `x-agent-markdown-path` request header (query params don't survive the
 * rewrite; `?path=` works for direct calls). The handler self-fetches the
 * page's HTML (with `Accept: text/html` + an internal marker header, so the
 * proxy never re-rewrites the inner request) and converts it.
 *
 * Same-origin only: `path` must be root-relative, so the fetch target is
 * always this deployment — the handler cannot be used to proxy other hosts.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const path =
    req.headers.get(MARKDOWN_PATH_HEADER) ??
    req.nextUrl.searchParams.get("path") ??
    "/";
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return new NextResponse("Invalid path\n", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("host");
  if (!host) {
    return new NextResponse("Missing host\n", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  const target = new URL(path, `${proto}://${host}`);

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      headers: {
        accept: "text/html",
        [MARKDOWN_INTERNAL_HEADER]: "1",
        "user-agent": req.headers.get("user-agent") ?? "agent-markdown",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    return new NextResponse("Upstream fetch failed\n", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  if (!upstream.ok || !contentType.includes("text/html")) {
    return new NextResponse(`No markdown representation (upstream ${upstream.status})\n`, {
      status: upstream.ok ? 406 : upstream.status,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const markdown = htmlToMarkdown(await upstream.text());

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      "Content-Type": MARKDOWN_CONTENT_TYPE,
      [MARKDOWN_TOKENS_HEADER]: String(estimateMarkdownTokens(markdown)),
      "Cache-Control": "public, max-age=300, must-revalidate",
      Vary: "Accept",
    },
  });
}
