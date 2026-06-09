/**
 * Webflow HTML → Payload Lexical JSON serializer.
 *
 * Webflow CMS rich-text fields export as semantic HTML strings. Payload
 * stores rich-text as Lexical's serialized JSON. This converter walks
 * the parsed HTML tree and emits the JSON shape Payload expects for the
 * editor features enabled in `editor-config.ts`:
 *
 *   paragraph | heading (h1–h4) | quote | list / listitem
 *   horizontalrule | link | text with inline marks (bold/italic/
 *   underline/strikethrough/inline-code/sub/sup)
 *
 * Webflow `.artcileCtaBox` inline CTAs are promoted to `inlineCta` block
 * nodes (see ./cta-cards) rather than left as flattened headings.
 *
 * Images (`<img>`) are intentionally NOT serialized as Lexical upload
 * nodes here — those need a resolved Media doc ID, which the import
 * step assigns post-asset-upload. The migration's body-url rewriter
 * (H4) keeps the `<img>` src pointing at R2 so a follow-up pass can
 * replace them with upload nodes if needed; for v1, inline images stay
 * as text-flow links to the R2 asset.
 */

import { parseFragment } from 'parse5';

import {
  type InlineCtaBlockNode,
  extractCtaFromHeading,
  isCtaHeading,
  makeInlineCtaBlock,
} from './cta-cards';

// Lexical text-format bitflags. Match
// `@lexical/code` / `@lexical/rich-text` constants.
const FORMAT = {
  BOLD: 1,
  ITALIC: 2,
  STRIKETHROUGH: 4,
  UNDERLINE: 8,
  CODE: 16,
  SUBSCRIPT: 32,
  SUPERSCRIPT: 64,
} as const;

interface LexicalTextNode {
  readonly type: 'text';
  readonly text: string;
  readonly format: number;
  readonly style: string;
  readonly mode: 'normal';
  readonly detail: number;
  readonly version: 1;
}

interface LexicalLinebreakNode {
  readonly type: 'linebreak';
  readonly version: 1;
}

interface LexicalLinkNode {
  readonly type: 'link';
  readonly version: 3;
  readonly format: '';
  readonly indent: 0;
  readonly direction: 'ltr';
  readonly fields: {
    readonly url: string;
    readonly newTab: boolean;
    readonly linkType: 'custom';
    readonly rel: 'follow';
  };
  readonly children: readonly LexicalInlineNode[];
}

type LexicalInlineNode = LexicalTextNode | LexicalLinebreakNode | LexicalLinkNode;

interface LexicalParagraphNode {
  readonly type: 'paragraph';
  readonly version: 1;
  readonly format: '';
  readonly indent: 0;
  readonly direction: 'ltr';
  readonly textFormat: 0;
  readonly textStyle: '';
  readonly children: readonly LexicalInlineNode[];
}

interface LexicalHeadingNode {
  readonly type: 'heading';
  readonly version: 1;
  readonly tag: 'h1' | 'h2' | 'h3' | 'h4';
  readonly format: '';
  readonly indent: 0;
  readonly direction: 'ltr';
  readonly children: readonly LexicalInlineNode[];
}

interface LexicalQuoteNode {
  readonly type: 'quote';
  readonly version: 1;
  readonly format: '';
  readonly indent: 0;
  readonly direction: 'ltr';
  readonly children: readonly LexicalInlineNode[];
}

interface LexicalListItemNode {
  readonly type: 'listitem';
  readonly version: 1;
  readonly value: number;
  readonly format: '';
  readonly indent: 0;
  readonly direction: 'ltr';
  readonly children: readonly LexicalInlineNode[];
}

interface LexicalListNode {
  readonly type: 'list';
  readonly version: 1;
  readonly listType: 'bullet' | 'number';
  readonly tag: 'ul' | 'ol';
  readonly start: 1;
  readonly format: '';
  readonly indent: 0;
  readonly direction: 'ltr';
  readonly children: readonly LexicalListItemNode[];
}

interface LexicalHorizontalRuleNode {
  readonly type: 'horizontalrule';
  readonly version: 1;
}

// @lexical/table serialized shapes (all extend SerializedElementNode).
// `headerState`: 0 = body cell, 1 = row header, 2 = column header.
interface LexicalTableCellNode {
  readonly type: 'tablecell';
  readonly version: 1;
  readonly headerState: 0 | 1 | 2;
  readonly colSpan: 1;
  readonly rowSpan: 1;
  readonly format: '';
  readonly indent: 0;
  readonly direction: 'ltr';
  readonly children: readonly LexicalParagraphNode[];
}

interface LexicalTableRowNode {
  readonly type: 'tablerow';
  readonly version: 1;
  readonly format: '';
  readonly indent: 0;
  readonly direction: 'ltr';
  readonly children: readonly LexicalTableCellNode[];
}

interface LexicalTableNode {
  readonly type: 'table';
  readonly version: 1;
  readonly format: '';
  readonly indent: 0;
  readonly direction: 'ltr';
  readonly children: readonly LexicalTableRowNode[];
}

// The CodeBlock Payload block (editor-config.ts), serialized as a Lexical
// `block` node — the same wrapper shape as InlineCtaBlockNode. Mirrors the
// `codeBlock` field schema in payload/blocks/CodeBlock.ts.
interface LexicalCodeBlockNode {
  readonly type: 'block';
  readonly version: 2;
  readonly format: '';
  readonly fields: {
    readonly blockType: 'codeBlock';
    readonly blockName: string;
    readonly id: string;
    readonly language: string;
    readonly content: string;
    readonly showLineNumbers: boolean;
  };
}

type LexicalBlockNode =
  | LexicalParagraphNode
  | LexicalHeadingNode
  | LexicalQuoteNode
  | LexicalListNode
  | LexicalHorizontalRuleNode
  | LexicalTableNode
  | LexicalCodeBlockNode
  | InlineCtaBlockNode;

export interface LexicalRoot {
  readonly root: {
    readonly type: 'root';
    readonly version: 1;
    readonly format: '';
    readonly indent: 0;
    readonly direction: 'ltr';
    readonly children: readonly LexicalBlockNode[];
  };
}

// parse5 node types we touch.
interface ParseElement {
  nodeName: string;
  tagName?: string;
  attrs?: { name: string; value: string }[];
  childNodes?: ParseNode[];
}
interface ParseTextNode {
  nodeName: '#text';
  value: string;
}
type ParseNode = ParseElement | ParseTextNode;

const isElement = (n: ParseNode): n is ParseElement => n.nodeName !== '#text';
const isText = (n: ParseNode): n is ParseTextNode => n.nodeName === '#text';

const getAttr = (el: ParseElement, name: string): string | undefined =>
  el.attrs?.find((a) => a.name === name)?.value;

const textNode = (text: string, format = 0): LexicalTextNode => ({
  type: 'text',
  text,
  format,
  style: '',
  mode: 'normal',
  detail: 0,
  version: 1,
});

const linebreakNode = (): LexicalLinebreakNode => ({ type: 'linebreak', version: 1 });

/**
 * Collect inline children from an element, applying the cumulative
 * format bitmask through nested inline marks.
 */
const collectInline = (
  nodes: readonly ParseNode[] | undefined,
  format: number,
): LexicalInlineNode[] => {
  if (!nodes || nodes.length === 0) return [];
  const out: LexicalInlineNode[] = [];
  for (const n of nodes) {
    if (isText(n)) {
      if (n.value.length === 0) continue;
      // Collapse internal whitespace but preserve single spaces.
      const collapsed = n.value.replace(/\s+/g, ' ');
      if (collapsed === ' ' && out.length === 0) continue;
      out.push(textNode(collapsed, format));
      continue;
    }
    if (!isElement(n)) continue;
    const tag = n.tagName ?? n.nodeName;
    switch (tag) {
      case 'br':
        out.push(linebreakNode());
        break;
      case 'strong':
      case 'b':
        out.push(...collectInline(n.childNodes, format | FORMAT.BOLD));
        break;
      case 'em':
      case 'i':
        out.push(...collectInline(n.childNodes, format | FORMAT.ITALIC));
        break;
      case 'u':
        out.push(...collectInline(n.childNodes, format | FORMAT.UNDERLINE));
        break;
      case 's':
      case 'strike':
      case 'del':
        out.push(...collectInline(n.childNodes, format | FORMAT.STRIKETHROUGH));
        break;
      case 'code':
        out.push(...collectInline(n.childNodes, format | FORMAT.CODE));
        break;
      case 'sub':
        out.push(...collectInline(n.childNodes, format | FORMAT.SUBSCRIPT));
        break;
      case 'sup':
        out.push(...collectInline(n.childNodes, format | FORMAT.SUPERSCRIPT));
        break;
      case 'a': {
        const href = getAttr(n, 'href');
        if (!href) {
          out.push(...collectInline(n.childNodes, format));
          break;
        }
        const newTab = (getAttr(n, 'target') ?? '') === '_blank';
        out.push({
          type: 'link',
          version: 3,
          format: '',
          indent: 0,
          direction: 'ltr',
          fields: { url: href, newTab, linkType: 'custom', rel: 'follow' },
          children: collectInline(n.childNodes, format),
        });
        break;
      }
      case 'span':
      case 'font':
      case 'small':
      case 'mark':
        // Unwrap — Webflow / Word HTML uses these for styling we drop.
        out.push(...collectInline(n.childNodes, format));
        break;
      case 'img': {
        // Image inside inline run — emit alt-text as a fallback so we
        // keep the descriptive content; URL is preserved by the body-url
        // rewriter at H4 if the asset is moved to R2.
        const alt = getAttr(n, 'alt');
        if (alt && alt.trim().length > 0) {
          out.push(textNode(alt, format));
        }
        break;
      }
      default:
        // Unknown inline tag — best-effort: take its text.
        out.push(...collectInline(n.childNodes, format));
        break;
    }
  }
  return out;
};

/** Trim leading/trailing whitespace-only text nodes from an inline run. */
const trimEdges = (children: LexicalInlineNode[]): LexicalInlineNode[] => {
  const out = [...children];
  while (out.length > 0) {
    const head = out[0];
    if (head && head.type === 'text' && head.text.trim().length === 0) out.shift();
    else break;
  }
  while (out.length > 0) {
    const tail = out[out.length - 1];
    if (tail && tail.type === 'text' && tail.text.trim().length === 0) out.pop();
    else break;
  }
  return out;
};

const paragraph = (children: LexicalInlineNode[]): LexicalParagraphNode => ({
  type: 'paragraph',
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  textFormat: 0,
  textStyle: '',
  children,
});

const heading = (
  tag: 'h1' | 'h2' | 'h3' | 'h4',
  children: LexicalInlineNode[],
): LexicalHeadingNode => ({
  type: 'heading',
  version: 1,
  tag,
  format: '',
  indent: 0,
  direction: 'ltr',
  children,
});

const quote = (children: LexicalInlineNode[]): LexicalQuoteNode => ({
  type: 'quote',
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  children,
});

const hr = (): LexicalHorizontalRuleNode => ({ type: 'horizontalrule', version: 1 });

const listItem = (children: LexicalInlineNode[]): LexicalListItemNode => ({
  type: 'listitem',
  version: 1,
  value: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  children,
});

const list = (ordered: boolean, items: LexicalListItemNode[]): LexicalListNode => ({
  type: 'list',
  version: 1,
  listType: ordered ? 'number' : 'bullet',
  tag: ordered ? 'ol' : 'ul',
  start: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  children: items,
});

const tableCell = (
  headerState: 0 | 1 | 2,
  children: LexicalInlineNode[],
): LexicalTableCellNode => ({
  type: 'tablecell',
  version: 1,
  headerState,
  colSpan: 1,
  rowSpan: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  // A Lexical table cell holds block children, not raw inline runs.
  children: [paragraph(children)],
});

const tableRow = (cells: LexicalTableCellNode[]): LexicalTableRowNode => ({
  type: 'tablerow',
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  children: cells,
});

const tableNode = (rows: LexicalTableRowNode[]): LexicalTableNode => ({
  type: 'table',
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  children: rows,
});

/** ObjectId-shaped 24-hex id (matches Payload row-id format), for block nodes. */
const makeBlockId = (): string => {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

// Languages the CodeBlock select accepts (payload/blocks/CodeBlock.ts).
const CODE_LANGUAGES = new Set([
  'bash',
  'dockerfile',
  'yaml',
  'json',
  'typescript',
  'javascript',
  'python',
  'go',
  'rust',
  'sql',
  'hcl',
  'text',
]);

const LANGUAGE_ALIASES: Record<string, string> = {
  sh: 'bash',
  shell: 'bash',
  console: 'bash',
  zsh: 'bash',
  docker: 'dockerfile',
  yml: 'yaml',
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  golang: 'go',
  rs: 'rust',
  terraform: 'hcl',
  tf: 'hcl',
  plaintext: 'text',
  txt: 'text',
  plain: 'text',
};

/** Resolve a raw language hint to a CodeBlock select value, defaulting to `text`. */
const resolveLanguage = (raw: string | undefined): string => {
  const lower = (raw ?? '').trim().toLowerCase();
  if (CODE_LANGUAGES.has(lower)) return lower;
  const aliased = LANGUAGE_ALIASES[lower];
  return aliased ?? 'text';
};

/** Concatenate descendant text verbatim — preserves whitespace for code. */
const rawText = (nodes: readonly ParseNode[] | undefined): string => {
  if (!nodes) return '';
  let out = '';
  for (const n of nodes) {
    if (isText(n)) out += n.value;
    else if (isElement(n)) out += rawText(n.childNodes);
  }
  return out;
};

const codeBlock = (language: string, content: string): LexicalCodeBlockNode => ({
  type: 'block',
  version: 2,
  format: '',
  fields: {
    blockType: 'codeBlock',
    blockName: '',
    id: makeBlockId(),
    language,
    content,
    showLineNumbers: false,
  },
});

/** Heading tag clamp: h5/h6 fall back to h4 (editor only enables h1–h4). */
const headingTag = (raw: string): 'h1' | 'h2' | 'h3' | 'h4' => {
  if (raw === 'h1' || raw === 'h2' || raw === 'h3' || raw === 'h4') return raw;
  return 'h4';
};

/** Collect `<tr>` rows from a table section (thead/tbody/tfoot) or a bare table. */
const collectTableRows = (parent: ParseElement, columnHeaders: boolean): LexicalTableRowNode[] => {
  const rows: LexicalTableRowNode[] = [];
  for (const tr of parent.childNodes ?? []) {
    if (!isElement(tr) || (tr.tagName ?? tr.nodeName) !== 'tr') continue;
    const cells: LexicalTableCellNode[] = [];
    for (const cell of tr.childNodes ?? []) {
      if (!isElement(cell)) continue;
      const cellTag = cell.tagName ?? cell.nodeName;
      if (cellTag !== 'td' && cellTag !== 'th') continue;
      const headerState: 0 | 1 | 2 = cellTag === 'th' ? (columnHeaders ? 2 : 1) : 0;
      cells.push(tableCell(headerState, trimEdges(collectInline(cell.childNodes, 0))));
    }
    if (cells.length > 0) rows.push(tableRow(cells));
  }
  return rows;
};

/**
 * Convert one parse5 block-level element to one or more Lexical block
 * nodes. Returns an empty array if the element produces no content.
 */
const convertBlock = (el: ParseElement): LexicalBlockNode[] => {
  const tag = el.tagName ?? el.nodeName;
  switch (tag) {
    case 'p': {
      const inline = trimEdges(collectInline(el.childNodes, 0));
      if (inline.length === 0) return [];
      return [paragraph(inline)];
    }
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6': {
      const inline = trimEdges(collectInline(el.childNodes, 0));
      if (inline.length === 0) return [];
      return [heading(headingTag(tag), inline)];
    }
    case 'blockquote': {
      // Blockquotes can wrap multiple paragraphs. Flatten their inline
      // content into a single quote node (Lexical's quote takes inline
      // children, not block children).
      const inline = trimEdges(collectInline(el.childNodes, 0));
      if (inline.length === 0) return [];
      return [quote(inline)];
    }
    case 'ul':
    case 'ol': {
      const items: LexicalListItemNode[] = [];
      for (const child of el.childNodes ?? []) {
        if (!isElement(child)) continue;
        if ((child.tagName ?? child.nodeName) !== 'li') continue;
        const inline = trimEdges(collectInline(child.childNodes, 0));
        if (inline.length === 0) continue;
        items.push(listItem(inline));
      }
      if (items.length === 0) return [];
      return [list(tag === 'ol', items)];
    }
    case 'hr':
      return [hr()];
    case 'figure':
    case 'div':
    case 'section':
    case 'article': {
      // Unwrap and convert children as blocks.
      const out: LexicalBlockNode[] = [];
      for (const child of el.childNodes ?? []) {
        if (!isElement(child)) continue;
        out.push(...convertBlock(child));
      }
      // Webflow inline CTA: `<div class="artcileCtaBox"><h3>prompt <a>label</a></h3></div>`.
      // Once unwrapped it is a heading-with-link; promote it to an `inlineCta`
      // block so it renders as a card instead of a stray heading. Gated on the
      // class so only genuine CTA boxes are rewritten.
      const className = getAttr(el, 'class') ?? '';
      if (className.includes('artcileCtaBox')) {
        return out.map((block) => {
          if (!isCtaHeading(block)) return block;
          const cta = extractCtaFromHeading(block);
          // Defer mid-sentence-link CTAs (leave as a heading) — same rule as the
          // DB backfill: the prompt + button fragment don't split cleanly.
          if (!cta || cta.midSentence) return block;
          return makeInlineCtaBlock({
            heading: cta.heading,
            buttonLabel: cta.buttonLabel,
            buttonUrl: cta.buttonUrl,
          });
        });
      }
      return out;
    }
    case 'table': {
      const rows: LexicalTableRowNode[] = [];
      let sawSection = false;
      for (const section of el.childNodes ?? []) {
        if (!isElement(section)) continue;
        const sectionTag = section.tagName ?? section.nodeName;
        if (sectionTag === 'thead') {
          sawSection = true;
          rows.push(...collectTableRows(section, true));
        } else if (sectionTag === 'tbody' || sectionTag === 'tfoot') {
          sawSection = true;
          rows.push(...collectTableRows(section, false));
        }
      }
      // Tables whose `<tr>` sit directly under `<table>` (no thead/tbody).
      if (!sawSection) rows.push(...collectTableRows(el, false));
      if (rows.length === 0) return [];
      return [tableNode(rows)];
    }
    case 'pre': {
      // Real code block. Language hint comes from the `data-lang` attribute
      // (set by the Academy extractor) or a `language-xxx` class; falls back
      // to `text`. Text is taken verbatim to preserve indentation/newlines.
      const langAttr =
        getAttr(el, 'data-lang') ??
        (getAttr(el, 'class') ?? '').match(/language-([a-z0-9+#]+)/i)?.[1] ??
        (() => {
          const codeChild = (el.childNodes ?? []).find(
            (c): c is ParseElement => isElement(c) && (c.tagName ?? c.nodeName) === 'code',
          );
          return codeChild
            ? (getAttr(codeChild, 'class') ?? '').match(/language-([a-z0-9+#]+)/i)?.[1]
            : undefined;
        })();
      const content = rawText(el.childNodes).replace(/\r/g, '').replace(/\s+$/, '');
      if (content.trim().length === 0) return [];
      return [codeBlock(resolveLanguage(langAttr), content)];
    }
    default: {
      // Anything else: treat as paragraph fallback if it has inline
      // text, otherwise drop.
      const inline = trimEdges(collectInline(el.childNodes, 0));
      if (inline.length === 0) return [];
      return [paragraph(inline)];
    }
  }
};

const EMPTY_ROOT: LexicalRoot = {
  root: {
    type: 'root',
    version: 1,
    format: '',
    indent: 0,
    direction: 'ltr',
    children: [paragraph([])],
  },
};

/**
 * Convert a Webflow HTML string to Payload-compatible Lexical JSON.
 * Returns the empty root shape for null/empty inputs so callers can
 * assign it unconditionally to a richText field.
 */
export const htmlToLexical = (html: unknown): LexicalRoot => {
  if (typeof html !== 'string' || html.trim().length === 0) return EMPTY_ROOT;

  const fragment = parseFragment(html) as { childNodes?: ParseNode[] };
  const children: LexicalBlockNode[] = [];

  // Track loose inline content that appears outside block tags (rare in
  // Webflow output, but seen in fragments) so we can wrap it in a
  // paragraph rather than dropping it.
  let looseInline: LexicalInlineNode[] = [];
  const flushLoose = (): void => {
    const trimmed = trimEdges(looseInline);
    if (trimmed.length > 0) children.push(paragraph(trimmed));
    looseInline = [];
  };

  const BLOCK_TAGS = new Set([
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'blockquote',
    'hr',
    'figure',
    'div',
    'section',
    'article',
    'pre',
    'table',
  ]);

  for (const node of fragment.childNodes ?? []) {
    if (isText(node)) {
      if (node.value.trim().length === 0) continue;
      looseInline.push(textNode(node.value.replace(/\s+/g, ' '), 0));
      continue;
    }
    if (!isElement(node)) continue;
    const tag = node.tagName ?? node.nodeName;
    if (BLOCK_TAGS.has(tag)) {
      flushLoose();
      children.push(...convertBlock(node));
    } else {
      looseInline.push(...collectInline([node], 0));
    }
  }
  flushLoose();

  if (children.length === 0) return EMPTY_ROOT;

  return {
    root: {
      type: 'root',
      version: 1,
      format: '',
      indent: 0,
      direction: 'ltr',
      children,
    },
  };
};
