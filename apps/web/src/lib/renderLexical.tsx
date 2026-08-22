import React from "react";
import Image from "next/image";
import Link from "next/link";
import { EMBED_STYLE_SLUGS } from "@cleanstart/types";
import type { LexicalNode, LexicalRoot, LexicalTableNode } from "@/lib/blog";
import { CodeBlock } from "@/components/code/CodeBlock";
import { InlineCtaCard } from "@/components/article/InlineCtaCard";
import { SITE_URL } from "@/lib/seo/canonical";

// Hosts that resolve to THIS marketing site (apps/web). Internal links must
// render same-tab as client-side navigation, never `target="_blank"`. Only the
// apex + `www` belong here — sibling subdomains like `images.`/`cms.` are
// separate apps and stay external. Derived from the canonical origin so an env
// override carries through.
const INTERNAL_HOSTS: ReadonlySet<string> = (() => {
  let host = "www.cleanstart.com";
  try {
    host = new URL(SITE_URL).host.toLowerCase();
  } catch {
    /* fall back to the canonical default */
  }
  const apex = host.replace(/^www\./, "");
  return new Set([host, apex, `www.${apex}`]);
})();

// Invisible characters that Webflow content smuggled into hrefs (zero-width
// space/joiner, BOM, soft hyphen). They URL-encode into the path and 404 the
// link, so strip them defensively before classifying.
const INVISIBLE_CHARS = /\u200B|\u200C|\u200D|\uFEFF|\u00AD/g;

type ResolvedLink = {
  /** Final href: a root-relative path for internal links, the URL as-is otherwise. */
  href: string;
  /** True when the destination is another origin (or a non-web scheme). */
  external: boolean;
  /** Non-http schemes (mailto:, tel:) — external but never opened in a new tab. */
  specialScheme: boolean;
};

export function resolveLexicalLink(raw: string | undefined): ResolvedLink {
  const cleaned = (raw ?? "").replace(INVISIBLE_CHARS, "").trim();
  if (!cleaned) return { href: "#", external: false, specialScheme: false };

  // Already a path, anchor, or query — inherently internal.
  if (
    cleaned.startsWith("/") ||
    cleaned.startsWith("#") ||
    cleaned.startsWith("?")
  ) {
    return { href: cleaned, external: false, specialScheme: false };
  }

  try {
    const url = new URL(cleaned);
    if (url.protocol === "http:" || url.protocol === "https:") {
      if (INTERNAL_HOSTS.has(url.host.toLowerCase())) {
        // Strip the origin so the link navigates within the app (same tab,
        // client-side) instead of triggering a full cross-origin reload.
        const path = `${url.pathname}${url.search}${url.hash}`;
        return { href: path || "/", external: false, specialScheme: false };
      }
      return { href: cleaned, external: true, specialScheme: false };
    }
    // mailto:, tel:, etc.
    return { href: cleaned, external: true, specialScheme: true };
  } catch {
    // Not a parseable absolute URL and not a path — treat as external, as-is.
    return { href: cleaned, external: true, specialScheme: true };
  }
}

// Build the `rel` attribute: preserve a meaningful stored rel (nofollow,
// sponsored, ugc — never the no-op "follow") and always add the
// noopener/noreferrer guard whenever the link opens a new browsing context.
function buildLinkRel(
  storedRel: string | undefined,
  newTab: boolean,
): string | undefined {
  const parts = new Set<string>();
  if (storedRel && storedRel !== "follow") {
    for (const token of storedRel.split(/\s+/)) {
      if (token) parts.add(token);
    }
  }
  if (newTab) {
    parts.add("noopener");
    parts.add("noreferrer");
  }
  return parts.size > 0 ? [...parts].join(" ") : undefined;
}

type LexicalBlockNode = {
  type: "block";
  fields: {
    blockType: string;
    [key: string]: unknown;
  };
  version: number;
  _lines?: string[];
};

type CodeBlockFields = {
  blockType: "codeBlock";
  language?: string | null;
  content?: string | null;
  showLineNumbers?: boolean | null;
  highlightLines?: string | null;
};

type InlineCtaFields = {
  blockType: "inlineCta";
  heading?: string | null;
  buttonLabel?: string | null;
  buttonUrl?: string | null;
  variant?: "soft" | "solid" | null;
};

type LexicalCodeNodeWithLines = Extract<LexicalNode, { type: "code" }> & {
  _lines?: string[];
  _content?: string;
};

// Lexical TEXT_FORMAT bitmask flags.
const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_STRIKETHROUGH = 4;
const FORMAT_UNDERLINE = 8;
const FORMAT_CODE = 16;
const FORMAT_SUBSCRIPT = 32;
const FORMAT_SUPERSCRIPT = 64;

function renderTextNode(node: Extract<LexicalNode, { type: "text" }>, key: string): React.ReactElement {
  const fmt = node.format ?? 0;
  let el: React.ReactNode = node.text;

  if (fmt & FORMAT_CODE) {
    el = <code className="cs-inline-code">{el}</code>;
  }
  if (fmt & FORMAT_BOLD) el = <strong>{el}</strong>;
  if (fmt & FORMAT_ITALIC) el = <em>{el}</em>;
  if (fmt & FORMAT_UNDERLINE) el = <u>{el}</u>;
  if (fmt & FORMAT_STRIKETHROUGH) el = <s>{el}</s>;
  if (fmt & FORMAT_SUBSCRIPT) el = <sub>{el}</sub>;
  if (fmt & FORMAT_SUPERSCRIPT) el = <sup>{el}</sup>;

  return <React.Fragment key={key}>{el}</React.Fragment>;
}

function renderNodes(nodes: LexicalNode[], prefix: string): React.ReactNode[] {
  return nodes.map((node, i) => renderNode(node, `${prefix}-${i}`));
}

function renderNode(node: LexicalNode, key: string): React.ReactNode {
  switch (node.type) {
    case "text":
      return renderTextNode(node as Extract<LexicalNode, { type: "text" }>, key);

    case "linebreak":
      // eslint-disable-next-line no-restricted-syntax -- Shift+Enter inline line break in Lexical editor
      return <br key={key} />;

    case "link":
    case "autolink": {
      const linkNode = node as Extract<LexicalNode, { type: "link" | "autolink" }>;
      const rawHref = linkNode.url ?? linkNode.fields?.url;
      const { href, external, specialScheme } = resolveLexicalLink(rawHref);
      const children = renderNodes(linkNode.children ?? [], key);
      const linkStyle = {
        color: "#4a3bf1",
        textDecoration: "underline",
        textUnderlineOffset: "3px",
      } as const;

      // Internal links navigate in the same tab via the client router. The
      // migrated `newTab` flag is deliberately ignored here: Webflow set it
      // inconsistently across same-site links, and an internal page opening a
      // new tab is virtually never intended.
      if (!external) {
        return (
          <Link
            key={key}
            href={href}
            rel={buildLinkRel(linkNode.fields?.rel, false)}
            style={linkStyle}
          >
            {children}
          </Link>
        );
      }

      // External (and mailto:/tel:) links keep `target="_blank"`, except
      // non-web schemes which should open in place.
      const newTab = !specialScheme;
      return (
        <a
          key={key}
          href={href}
          target={newTab ? "_blank" : undefined}
          rel={buildLinkRel(linkNode.fields?.rel, newTab)}
          style={linkStyle}
        >
          {children}
        </a>
      );
    }

    case "paragraph": {
      const pNode = node as Extract<LexicalNode, { type: "paragraph" }>;
      const children = pNode.children ?? [];
      // Empty Lexical paragraphs are structural spacers preserving authored
      // vertical rhythm, not prose line-breaks, so the no-br rule does not apply.
      if (children.length === 0) {
        // eslint-disable-next-line no-restricted-syntax -- structural editor spacer, not prose
        return <br key={key} />;
      }
      return (
        <p key={key} className="article-paragraph">
          {renderNodes(children, key)}
        </p>
      );
    }

    case "heading": {
      const hNode = node as Extract<LexicalNode, { type: "heading" }>;
      // The page hero owns the single document <h1>; demote any body h1 from
      // the CMS to h2 so the page keeps one top-level heading and a valid
      // outline (some Webflow-imported bodies carry a stray h1).
      const rawTag = hNode.tag ?? "h2";
      const tag = rawTag === "h1" ? "h2" : rawTag;
      const children = renderNodes(hNode.children ?? [], key);
      const textContent = extractText(hNode.children ?? []);
      const id = slugifyText(textContent);
      return React.createElement(tag, { key, id, className: `article-${tag}` }, children);
    }

    case "list": {
      const lNode = node as Extract<LexicalNode, { type: "list" }>;
      const Tag = lNode.listType === "number" ? "ol" : "ul";
      return (
        <Tag key={key} className={`article-${Tag}`}>
          {(lNode.children ?? []).map((item, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Lexical list items have no stable id
            <li key={`${key}-li-${i}`} className="article-li">
              {renderNodes(
                (item as { children?: LexicalNode[] }).children ?? [],
                `${key}-li-${i}`,
              )}
            </li>
          ))}
        </Tag>
      );
    }

    case "listitem": {
      const liNode = node as Extract<LexicalNode, { type: "listitem" }>;
      return (
        <li key={key} className="article-li">
          {renderNodes(liNode.children ?? [], key)}
        </li>
      );
    }

    case "quote": {
      const qNode = node as Extract<LexicalNode, { type: "quote" }>;
      return (
        <blockquote key={key} className="article-blockquote">
          {renderNodes(qNode.children ?? [], key)}
        </blockquote>
      );
    }

    case "code": {
      const cNode = node as LexicalCodeNodeWithLines;
      const codeText = cNode._content ?? extractText(cNode.children ?? []);
      return (
        <CodeBlock
          key={key}
          language={cNode.language ?? "text"}
          content={codeText}
          lines={cNode._lines}
          showLineNumbers={false}
        />
      );
    }

    case "block": {
      const bNode = node as unknown as LexicalBlockNode;
      const fields = bNode.fields;
      if (fields?.blockType === "codeBlock") {
        const cb = fields as CodeBlockFields;
        return (
          <CodeBlock
            key={key}
            language={cb.language}
            content={typeof cb.content === "string" ? cb.content : ""}
            lines={bNode._lines}
            showLineNumbers={cb.showLineNumbers}
            highlightLines={cb.highlightLines}
          />
        );
      }
      if (fields?.blockType === "inlineCta") {
        const cta = fields as InlineCtaFields;
        return (
          <InlineCtaCard
            key={key}
            heading={cta.heading ?? ""}
            buttonLabel={cta.buttonLabel ?? ""}
            buttonUrl={cta.buttonUrl ?? "#"}
            variant={cta.variant ?? "soft"}
          />
        );
      }
      return null;
    }

    case "horizontalrule":
      return <hr key={key} className="article-hr" />;

    case "table": {
      const tNode = node as LexicalTableNode;
      return (
        <div key={key} className="article-table-wrapper">
          <table className="article-table">
            <tbody>
              {(tNode.children ?? []).map((row, ri) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: Lexical table rows have no stable id
                <tr key={`${key}-row-${ri}`}>
                  {(row.children ?? []).map((cell, ci) => {
                    const cellKey = `${key}-cell-${ri}-${ci}`;
                    const content = renderNodes(cell.children ?? [], cellKey);
                    const hs = cell.headerState ?? 0;
                    if (hs === 2) {
                      return <th key={cellKey} className="article-th-col" colSpan={cell.colSpan} rowSpan={cell.rowSpan}>{content}</th>;
                    }
                    if (hs !== 0) {
                      return <th key={cellKey} className="article-th-row" colSpan={cell.colSpan} rowSpan={cell.rowSpan}>{content}</th>;
                    }
                    return <td key={cellKey} colSpan={cell.colSpan} rowSpan={cell.rowSpan}>{content}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case "tablerow":
    case "tablecell":
      return null;

    case "upload": {
      const uNode = node as Extract<LexicalNode, { type: "upload" }>;
      const val = uNode.value as { url?: string; alt?: string; width?: number; height?: number } | undefined;
      if (!val?.url) return null;
      // Webflow CMS rich-text images can be small icons (e.g. 90×90). Cap the
      // display width at the source's intrinsic pixels so they are never
      // upscaled into a blur — larger images still fit the content column.
      // Mirrors Webflow, which renders rich-text images at their natural size.
      const intrinsicWidth = val.width ?? 800;
      const intrinsicHeight = val.height ?? 450;
      return (
        <figure key={key} className="article-figure">
          <Image
            src={val.url}
            alt={val.alt ?? ""}
            width={intrinsicWidth}
            height={intrinsicHeight}
            sizes={`(min-width: 1024px) min(680px, ${intrinsicWidth}px), min(100vw, ${intrinsicWidth}px)`}
            className="rounded-lg h-auto"
            style={{ width: `min(100%, ${intrinsicWidth}px)` }}
          />
        </figure>
      );
    }

    case "embed": {
      // Webflow rich-text embeds (feature grids, callout boxes, …) migrated as
      // EmbedNodes carrying their original markup in `rawHtml`. These flatten
      // badly when unwrapped into prose, so we render the preserved HTML inside
      // a scoped container (see `.article-embed` in globals.css for the ported
      // Webflow layout styles). The HTML is first-party migrated content; we
      // still strip scripts and event handlers defensively.
      const embed = node as { rawHtml?: string; styleSlug?: string };
      const html = sanitizeEmbedHtml(embed.rawHtml ?? "");
      if (!html) return null;
      return (
        <div
          key={key}
          className={`article-embed${embedStyleClass(embed.styleSlug)}`}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: first-party migrated embed markup, sanitized above
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    default: {
      const generic = node as { children?: LexicalNode[] };
      if (generic.children?.length) {
        return (
          <React.Fragment key={key}>
            {renderNodes(generic.children, key)}
          </React.Fragment>
        );
      }
      return null;
    }
  }
}

/**
 * Maps an embed node's `styleSlug` to its preset class (with a leading space,
 * ready for template-literal concatenation). Only slugs present in the shared
 * EMBED_STYLE_PRESETS registry produce a class — anything else (older nodes
 * without the field, hand-edited content, junk) yields '' so stored data can
 * never inject an arbitrary class name. Matching CSS lives in globals.css
 * under `.article-body .article-embed.embed-style-<slug>`.
 */
export function embedStyleClass(styleSlug: unknown): string {
  if (typeof styleSlug !== "string" || styleSlug === "") return "";
  return EMBED_STYLE_SLUGS.has(styleSlug) ? ` embed-style-${styleSlug}` : "";
}

/**
 * Defensive sanitizer for migrated embed markup. The content is first-party
 * (generated by our Webflow migration, never user input), so this only guards
 * against accidental script injection: it removes `<script>`/`<iframe>` tags,
 * inline `on*` event handlers, and `javascript:` URLs.
 */
function sanitizeEmbedHtml(raw: string): string {
  return raw
    .replace(/<\/?(?:script|iframe|object|embed)\b[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*("javascript:[^"]*"|'javascript:[^']*')/gi, "");
}

function extractText(nodes: LexicalNode[]): string {
  return nodes
    .map((n) => {
      if (n.type === "text") return (n as Extract<LexicalNode, { type: "text" }>).text;
      const generic = n as { children?: LexicalNode[] };
      if (generic.children) return extractText(generic.children);
      return "";
    })
    .join("");
}

export function slugifyText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface RenderLexicalProps {
  content: LexicalRoot | null | undefined;
  className?: string;
  /** Defaults to "article-body" (full-article prose styling). Pass
   * "faq-answer-body" for the compact FAQ-answer look. */
  wrapperClassName?: string;
}

export function RenderLexical({
  content,
  className = "",
  wrapperClassName = "article-body",
}: RenderLexicalProps): React.ReactElement | null {
  if (!content?.root?.children?.length) return null;

  return (
    <div className={`${wrapperClassName} ${className}`}>
      {renderNodes(content.root.children, "root")}
    </div>
  );
}

const BLOCK_TYPES = new Set(["paragraph", "listitem", "heading", "quote"]);
const TERMINAL_PUNCTUATION = /[.!?:]["'”’)\s]*$/;

export function lexicalToPlainText(content: LexicalRoot | null | undefined): string {
  if (!content?.root?.children?.length) return "";

  const inlineText = (node: LexicalNode): string => {
    if (node.type === "text") return (node as Extract<LexicalNode, { type: "text" }>).text;
    if (node.type === "linebreak") return " ";
    const generic = node as { children?: LexicalNode[] };
    if (Array.isArray(generic.children)) return generic.children.map(inlineText).join("");
    return "";
  };

  const blockTexts = (nodes: LexicalNode[]): string[] => {
    const out: string[] = [];
    for (const node of nodes) {
      if (node.type === "list") {
        const listNode = node as { children?: LexicalNode[] };
        if (Array.isArray(listNode.children)) {
          out.push(...blockTexts(listNode.children));
          continue;
        }
      }
      if (BLOCK_TYPES.has(node.type)) {
        const text = inlineText(node).trim();
        if (text.length > 0) out.push(text);
        continue;
      }
      const fallback = inlineText(node).trim();
      if (fallback.length > 0) out.push(fallback);
    }
    return out;
  };

  return blockTexts(content.root.children)
    .map((block) => (TERMINAL_PUNCTUATION.test(block) ? block : `${block}.`))
    .join(" ")
    .trim();
}


