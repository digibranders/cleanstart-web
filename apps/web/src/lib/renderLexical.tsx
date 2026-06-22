import React from "react";
import Image from "next/image";
import type { LexicalNode, LexicalRoot, LexicalTableNode } from "@/lib/blog";
import { CodeBlock } from "@/components/code/CodeBlock";
import { InlineCtaCard } from "@/components/article/InlineCtaCard";

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
    el = (
      <code
        className="rounded px-1 py-0.5 text-[0.875em]"
        style={{
          background: "rgba(17,17,17,0.08)",
          fontFamily: "var(--font-mono), ui-monospace, monospace",
        }}
      >
        {el}
      </code>
    );
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

    case "link":
    case "autolink": {
      const linkNode = node as Extract<LexicalNode, { type: "link" | "autolink" }>;
      const href = linkNode.url ?? (linkNode.fields as { url?: string } | undefined)?.url ?? "#";
      const isExternal = href.startsWith("http");
      return (
        <a
          key={key}
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          style={{ color: "#4a3bf1", textDecoration: "underline", textUnderlineOffset: "3px" }}
        >
          {renderNodes(linkNode.children ?? [], key)}
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
      const embed = node as { rawHtml?: string };
      const html = sanitizeEmbedHtml(embed.rawHtml ?? "");
      if (!html) return null;
      return (
        // biome-ignore lint/security/noDangerouslySetInnerHtml: first-party migrated embed markup, sanitized above
        <div key={key} className="article-embed" dangerouslySetInnerHTML={{ __html: html }} />
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
}

export function RenderLexical({ content, className = "" }: RenderLexicalProps): React.ReactElement | null {
  if (!content?.root?.children?.length) return null;

  return (
    <div className={`article-body ${className}`}>
      {renderNodes(content.root.children, "root")}
    </div>
  );
}
