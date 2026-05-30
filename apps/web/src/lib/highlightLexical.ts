import "server-only";

import {
  THEME_NAME,
  getHighlighter,
  normalizeLanguage,
} from "@/components/code/shiki";
import type { LexicalNode, LexicalRoot } from "@/lib/blog";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function extractText(nodes: LexicalNode[] | undefined): string {
  if (!nodes) return "";
  let out = "";
  for (const n of nodes) {
    if (n.type === "text") {
      out += (n as { text?: string }).text ?? "";
      continue;
    }
    const generic = n as { children?: LexicalNode[] };
    if (generic.children) out += extractText(generic.children);
  }
  return out;
}

async function highlightToLines(
  content: string,
  language: string | null | undefined,
): Promise<string[]> {
  const lang = normalizeLanguage(language);
  if (lang === "text") {
    return content.split("\n").map((line) => escapeHtml(line || " "));
  }
  const highlighter = await getHighlighter();
  const result = highlighter.codeToTokens(content, {
    lang,
    theme: THEME_NAME,
  });
  return result.tokens.map((tokens) => {
    if (tokens.length === 0) return " ";
    let html = "";
    for (const token of tokens) {
      const safe = escapeHtml(token.content);
      html += token.color ? `<span style="color:${token.color}">${safe}</span>` : safe;
    }
    return html;
  });
}

type WalkableNode = LexicalNode & {
  children?: LexicalNode[];
  _lines?: string[];
  _content?: string;
};

async function walk(node: WalkableNode): Promise<void> {
  if (node.type === "code") {
    const text = extractText(node.children);
    const lines = await highlightToLines(text, (node as { language?: string }).language);
    node._lines = lines;
    node._content = text;
    return;
  }
  if (node.type === "block") {
    const fields = (node as { fields?: { blockType?: string; content?: string; language?: string } }).fields;
    if (fields?.blockType === "codeBlock" && typeof fields.content === "string") {
      const lines = await highlightToLines(fields.content, fields.language);
      node._lines = lines;
    }
    return;
  }
  if (node.children) {
    for (const child of node.children) {
      await walk(child as WalkableNode);
    }
  }
}

export async function highlightLexical<T extends LexicalRoot | null | undefined>(
  body: T,
): Promise<T> {
  if (!body?.root?.children?.length) return body;
  // Deep clone via JSON round-trip — Lexical content is plain JSON-safe data.
  const cloned = JSON.parse(JSON.stringify(body)) as LexicalRoot;
  for (const child of cloned.root.children) {
    await walk(child as WalkableNode);
  }
  return cloned as T;
}
