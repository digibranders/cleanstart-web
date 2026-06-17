import { NodeHtmlMarkdown } from "node-html-markdown";

/**
 * Markdown content negotiation for agents.
 *
 * Agents that prefer token-efficient input send `Accept: text/markdown`; the
 * proxy rewrites those requests to `/api/markdown`, which fetches the page's
 * HTML and converts it. Browsers never send `text/markdown`, so HTML stays the
 * default. Mirrors Cloudflare's "Markdown for Agents" response contract
 * (`Content-Type: text/markdown` + `x-markdown-tokens`) — we implement it
 * in-app because the zone is DNS-only (grey cloud, see WEB-PRODUCTION.md §3),
 * so Cloudflare response features never run.
 */

export const MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";
export const MARKDOWN_TOKENS_HEADER = "x-markdown-tokens";
/** Set on the converter's internal self-fetch so the proxy never re-rewrites it. */
export const MARKDOWN_INTERNAL_HEADER = "x-agent-markdown-internal";
/**
 * Carries the originally-requested path through the proxy rewrite. A query
 * param on the rewrite URL does not survive into the route handler's
 * `nextUrl`, but request-header overrides set on the forwarded request do.
 */
export const MARKDOWN_PATH_HEADER = "x-agent-markdown-path";

/**
 * True when the Accept header explicitly requests `text/markdown` with a
 * non-zero quality. Deliberately ignores `text/*` and the full wildcard —
 * browser Accept headers end in the wildcard and must keep receiving HTML.
 */
export function acceptsMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  for (const entry of accept.split(",")) {
    const [mediaType, ...params] = entry.trim().split(";");
    if (mediaType?.trim().toLowerCase() !== "text/markdown") continue;
    const qParam = params
      .map((p) => p.trim().toLowerCase())
      .find((p) => p.startsWith("q="));
    if (!qParam) return true;
    const q = Number.parseFloat(qParam.slice(2));
    return Number.isFinite(q) && q > 0;
  }
  return false;
}

const converter = new NodeHtmlMarkdown({
  ignore: ["script", "style", "noscript", "iframe", "svg", "template"],
  keepDataImages: false,
  useLinkReferenceDefinitions: false,
});

/**
 * Convert a full HTML document to markdown. Scopes to `<main>` when present —
 * nav and footer chrome are noise to an agent reading page content — and falls
 * back to `<body>`, then the raw input. The document `<title>` leads as an H1
 * so the markdown is self-describing even when scoped below the page header.
 */
const TITLE_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

function decodeTitleEntities(title: string): string {
  return title.replace(
    /&(?:amp|lt|gt|quot|#39|apos|nbsp);/g,
    (entity) => TITLE_ENTITIES[entity] ?? entity,
  );
}

export function htmlToMarkdown(html: string): string {
  const rawTitle = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const title = rawTitle ? decodeTitleEntities(rawTitle) : undefined;
  const scope =
    html.match(/<main[\s>][\s\S]*?<\/main>/i)?.[0] ??
    html.match(/<body[\s>][\s\S]*?<\/body>/i)?.[0] ??
    html;
  const markdown = converter.translate(scope).trim();
  return title ? `# ${title}\n\n${markdown}\n` : `${markdown}\n`;
}

/**
 * Rough token estimate (~4 chars/token for English prose) for the
 * `x-markdown-tokens` header. Agents use it for budgeting, not billing —
 * an estimate is the documented contract, not an exact tokenizer count.
 */
export function estimateMarkdownTokens(markdown: string): number {
  return Math.ceil(markdown.length / 4);
}
