/**
 * Mutate a parsed clipboard DOM tree in place so that Word / Word Online
 * / Google Docs HTML becomes plain semantic HTML that Lexical's built-in
 * `$generateNodesFromDOM` already handles cleanly:
 *
 *   <p class="MsoHeading2">X</p>                  → <h2>X</h2>
 *   <p style="font-size:18pt;font-weight:700">X</p> → <h2>X</h2>
 *   <p><strong>X</strong></p>  (all-bold)         → <h3>X</h3>
 *   <span style="font-weight:700">X</span>          → <strong>X</strong>
 *   <span style="font-style:italic">X</span>        → <em>X</em>
 *   <span style="text-decoration:underline">X</span> → <u>X</u>
 *   <o:p>, <style>, <script>, <xml>, <meta>          → removed
 *   <font face=… size=…>X</font>                    → unwrapped to X
 *
 * This is a strictly destructive transform — keep it pure DOM and pure
 * functions so it stays trivial to test under happy-dom. The companion
 * Lexical paste plugin runs this, then calls `$generateNodesFromDOM`,
 * which already knows h1-h6, strong, em, u, ul, ol, li, a, br.
 */

const STRIP_TAGS: ReadonlySet<string> = new Set([
  'style',
  'script',
  'meta',
  'link',
  'xml',
  'o:p',
  'colgroup',
]);

// Tag-name prefixes used by Word desktop and Word Online for namespaced
// XML payloads — vector graphics, math, internal Word metadata.
const STRIP_TAG_PREFIXES: readonly string[] = ['v:', 'w:', 'm:', 'o:'];

const parseInlineStyle = (raw: string | null | undefined): Record<string, string> => {
  if (!raw) return {};
  const out: Record<string, string> = {};
  for (const decl of raw.split(';')) {
    const idx = decl.indexOf(':');
    if (idx === -1) continue;
    const key = decl.slice(0, idx).trim().toLowerCase();
    const value = decl.slice(idx + 1).trim().toLowerCase();
    if (key) out[key] = value;
  }
  return out;
};

const ptToNumber = (value: string): number | null => {
  const match = value.match(/^([0-9]+(?:\.[0-9]+)?)\s*pt$/);
  return match?.[1] ? Number.parseFloat(match[1]) : null;
};

const fontWeightIsBold = (value: string | undefined): boolean => {
  if (!value) return false;
  if (value === 'bold' || value === 'bolder') return true;
  const numeric = Number.parseInt(value, 10);
  return Number.isFinite(numeric) && numeric >= 600;
};

const headingLevelForParagraph = (
  element: Element,
): 1 | 2 | 3 | 4 | 5 | 6 | null => {
  const cls = (element.getAttribute('class') || '').toLowerCase();
  const msoMatch = cls.match(/msoheading([1-6])/);
  if (msoMatch?.[1]) {
    return Number.parseInt(msoMatch[1], 10) as 1 | 2 | 3 | 4 | 5 | 6;
  }
  if (/msotitle\b/.test(cls)) return 1;

  const style = parseInlineStyle(element.getAttribute('style'));
  const sizePt = style['font-size'] ? ptToNumber(style['font-size']) : null;
  const bold = fontWeightIsBold(style['font-weight']);
  if (sizePt !== null) {
    if (sizePt >= 22) return 1;
    if (sizePt >= 17) return 2;
    if (sizePt >= 14) return 3;
    if (sizePt >= 12 && bold) return 4;
  }
  return null;
};

const isWhollyWrappedIn = (element: Element, wrapperTags: ReadonlySet<string>): boolean => {
  const text = (element.textContent || '').trim();
  if (text.length === 0) return false;
  let wrappedTextLength = 0;
  for (const wrapTag of wrapperTags) {
    for (const wrapped of element.getElementsByTagName(wrapTag)) {
      wrappedTextLength += (wrapped.textContent || '').trim().length;
    }
  }
  // Allow a small margin (e.g., a trailing space outside the bold tag).
  return wrappedTextLength >= Math.floor(text.length * 0.9);
};

const replaceTag = (element: Element, newTagName: string): Element => {
  const replacement = element.ownerDocument.createElement(newTagName);
  while (element.firstChild) replacement.appendChild(element.firstChild);
  element.replaceWith(replacement);
  return replacement;
};

const wrapChildren = (element: Element, wrapperTagName: string): void => {
  const doc = element.ownerDocument;
  const wrapper = doc.createElement(wrapperTagName);
  while (element.firstChild) wrapper.appendChild(element.firstChild);
  element.appendChild(wrapper);
};

const stripStripTagsRecursive = (root: Element): void => {
  // Drop tag and its subtree entirely.
  for (const tag of STRIP_TAGS) {
    for (const node of Array.from(root.getElementsByTagName(tag))) {
      node.remove();
    }
  }
  // Sweep namespaced tags (v:imagedata, w:sdt, m:oMath, o:smarttagtype, etc.).
  // Array.from snapshots the live collection before iteration, so removing a
  // parent node here also removes its descendants from the DOM — subsequent
  // iterations that encounter a detached child are no-ops because `tagName`
  // still evaluates but `remove()` is idempotent on detached nodes.
  for (const node of Array.from(root.getElementsByTagName('*'))) {
    const tag = node.tagName.toLowerCase();
    if (STRIP_TAG_PREFIXES.some((prefix) => tag.startsWith(prefix))) {
      node.remove();
    }
  }
};

const stripWordOnlineNoiseSpans = (root: Element): void => {
  // Word Online inserts `<span class="EOP">` end-of-paragraph markers
  // that are visually empty but contain non-breaking spaces; remove
  // them outright so they don't surface as stray whitespace.
  for (const span of Array.from(root.getElementsByTagName('span'))) {
    const cls = (span.getAttribute('class') || '').toLowerCase();
    if (/\beop\b/.test(cls)) {
      span.remove();
    }
  }
};

const unwrapElement = (element: Element): void => {
  const parent = element.parentNode;
  if (!parent) return;
  while (element.firstChild) parent.insertBefore(element.firstChild, element);
  parent.removeChild(element);
};

const normalizeSpan = (span: Element): void => {
  // Spans never carry semantic weight in our output. If the span has
  // formatting styles, wrap its contents in the corresponding tag(s);
  // either way, unwrap the span itself afterwards.
  const style = parseInlineStyle(span.getAttribute('style'));
  const wraps: string[] = [];
  if (fontWeightIsBold(style['font-weight'])) wraps.push('strong');
  if (style['font-style'] === 'italic' || style['font-style'] === 'oblique') wraps.push('em');
  const decoration = style['text-decoration'] || style['text-decoration-line'];
  if (decoration && /\bunderline\b/.test(decoration)) wraps.push('u');
  for (const tag of wraps) wrapChildren(span, tag);
  unwrapElement(span);
};

const normalizeFont = (font: Element): void => {
  // <font> carries no semantic info we want to keep; unwrap.
  unwrapElement(font);
};

const promoteHeadingParagraphs = (root: Element): void => {
  for (const p of Array.from(root.getElementsByTagName('p'))) {
    const level = headingLevelForParagraph(p);
    if (level !== null) {
      replaceTag(p, `h${level}`);
      continue;
    }
    // All-bold paragraph → h3 (a common Word "lesser heading" shape).
    if (isWhollyWrappedIn(p, new Set(['b', 'strong']))) {
      replaceTag(p, 'h3');
    }
  }
};

const promoteAriaHeadingDivs = (root: Element): void => {
  // Word Online and some other rich-text editors emit divs marked
  // with `role="heading"` + `aria-level="N"` instead of proper h-tags.
  // Convert those into the corresponding semantic heading.
  for (const el of Array.from(root.querySelectorAll('div[role="heading"], p[role="heading"]'))) {
    const level = Number.parseInt(el.getAttribute('aria-level') || '', 10);
    if (level >= 1 && level <= 6) {
      replaceTag(el, `h${level}`);
    }
  }
};

const normalizeAllSpans = (root: Element): void => {
  // Process innermost spans first (reverse document order) so a child span
  // is normalised before its parent. This prevents a parent bold-span from
  // wrapping an already-normalised child and producing a double <strong>.
  const spans = Array.from(root.getElementsByTagName('span')).reverse();
  for (const span of spans) {
    normalizeSpan(span);
  }
  const fonts = Array.from(root.getElementsByTagName('font')).reverse();
  for (const font of fonts) {
    normalizeFont(font);
  }
};

const stripWordAttributes = (root: Element): void => {
  // Drop `class`, `style`, `lang`, and any `mso*` / `data-*` attribute
  // from every element. Preserve `href` / `target` on anchors.
  const PRESERVE_TAG_ATTRS: Record<string, ReadonlySet<string>> = {
    a: new Set(['href', 'target', 'rel']),
    img: new Set(['src', 'alt']),
  };
  const all = root.getElementsByTagName('*');
  for (const el of Array.from(all)) {
    const tag = el.tagName.toLowerCase();
    const preserve = PRESERVE_TAG_ATTRS[tag];
    for (const attr of Array.from(el.attributes)) {
      if (preserve?.has(attr.name.toLowerCase())) continue;
      el.removeAttribute(attr.name);
    }
  }
};

export const looksLikeRichDoc = (html: string): boolean => {
  // Quick test: does this clipboard HTML look like a structured rich
  // document worth normalizing? Avoid running on a copied URL or a
  // plain code snippet.
  if (!html || html.length < 32) return false;
  const sample = html.slice(0, 4096).toLowerCase();
  return (
    /<h[1-6][\s>]/.test(sample) ||
    /<p[\s>]/.test(sample) ||
    /<ul|<ol/.test(sample) ||
    // Word desktop / Outlook signatures.
    /mso-|msonormal|msoheading|<o:p|<w:/.test(sample) ||
    // Word Online signatures: OutlineElement wrapper, BCX colour
    // tokens on spans, role="heading" semantic markers.
    /outlineelement|listcontainerwrapper|bcx[0-9]|role="heading"/.test(sample) ||
    // Google Docs signature.
    /class="docs-/.test(sample)
  );
};

export type ExtractedInlineImage = {
  src: string;
  alt: string;
  /**
   * Unique token written into a `<p>CS_IMG_PLACEHOLDER:{id}</p>`
   * element that takes the original `<img>`'s position in the DOM.
   * The paste plugin uses this to swap the placeholder paragraph for
   * a real UploadNode once the image finishes ingesting — preserving
   * the image's position in the document flow instead of dumping
   * everything at the end of the editor.
   */
  placeholderId: string;
};

export const INLINE_IMAGE_PLACEHOLDER_PREFIX = 'CS_IMG_PLACEHOLDER:';

const PLACEHOLDER_BLOCK_TAGS: ReadonlySet<string> = new Set([
  'p',
  'div',
  'figure',
  'li',
  'blockquote',
  'pre',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
]);

const generatePlaceholderId = (index: number): string => {
  const rand = Math.random().toString(36).slice(2, 10);
  return `i${index}-${Date.now().toString(36)}-${rand}`;
};

/**
 * Replace every `<img>` element in `root` with a `<p>` placeholder
 * whose text is `CS_IMG_PLACEHOLDER:{placeholderId}`. Return the
 * collected sources (absolute `http(s)` only) in document order so
 * the paste plugin can ingest each URL server-side and then swap the
 * matching placeholder paragraph for a real UploadNode at the same
 * position in the editor.
 *
 * Why this exists: Lexical's stock `UploadNode.importDOM()` turns
 * any `<img>` it sees during `$generateNodesFromDOM` into a
 * "pending" upload node that the bundled UploadPlugin tries to fetch
 * from the **browser** via `await fetch(src)`. A third-party CDN
 * (Webflow, etc.) does not return CORS headers, so that fetch throws
 * with no try/catch — the pending node renders as a 95×203
 * ShimmerEffect forever. By stripping `<img>` before
 * `$generateNodesFromDOM` runs we never enter that broken path; the
 * paste plugin then ingests each URL server-side via
 * `POST /api/media-ingest-url` and inserts proper UploadNodes.
 *
 * Positional preservation strategy:
 *   - Walk to the nearest block-level ancestor (p/div/figure/li/h*).
 *   - Insert a `<p>placeholder</p>` immediately after that ancestor.
 *   - Remove the `<img>` (and the ancestor if it is now empty,
 *     avoiding the "trailing empty paragraph where the image was"
 *     artefact).
 *
 * Non-`http(s)` srcs (e.g. `data:`, `blob:`, relative paths) are
 * dropped with no placeholder — they cannot be ingested via URL
 * fetch and would never become real upload nodes.
 */
export const extractInlineImages = (root: Element): ExtractedInlineImage[] => {
  const out: ExtractedInlineImage[] = [];
  const doc = root.ownerDocument;
  // Snapshot first — we'll be mutating the live HTMLCollection.
  const imgs = Array.from(root.getElementsByTagName('img'));
  for (const img of imgs) {
    const rawSrc = img.getAttribute('src') ?? '';
    const alt = img.getAttribute('alt') ?? '';
    if (!/^https?:\/\//i.test(rawSrc)) {
      img.remove();
      continue;
    }
    const placeholderId = generatePlaceholderId(out.length);
    out.push({ src: rawSrc, alt, placeholderId });
    const placeholder = doc.createElement('p');
    placeholder.textContent = `${INLINE_IMAGE_PLACEHOLDER_PREFIX}${placeholderId}`;
    // Walk up to the nearest block-level ancestor still inside `root`.
    let block: Element | null = img.parentElement;
    while (
      block &&
      block !== root &&
      !PLACEHOLDER_BLOCK_TAGS.has(block.tagName.toLowerCase())
    ) {
      block = block.parentElement;
    }
    if (block && block !== root && block.parentNode) {
      block.parentNode.insertBefore(placeholder, block.nextSibling);
      img.remove();
      const remainingText = (block.textContent ?? '').trim();
      const remainingMedia = block.querySelector('img, svg, video, iframe, table, audio');
      if (remainingText.length === 0 && !remainingMedia) {
        block.remove();
      }
    } else {
      // No block ancestor inside root — swap the img directly.
      img.replaceWith(placeholder);
    }
  }
  return out;
};

/**
 * Mutate `root` in place: drop noisy tags, unwrap spans/fonts into
 * proper inline tags, promote heading-shaped paragraphs to <h{n}>,
 * and clean up attributes. The result is suitable input for Lexical's
 * built-in `$generateNodesFromDOM`.
 */
export const normalizeRichHtml = (root: Element): void => {
  stripStripTagsRecursive(root);
  stripWordOnlineNoiseSpans(root);
  promoteAriaHeadingDivs(root);
  normalizeAllSpans(root);
  promoteHeadingParagraphs(root);
  stripWordAttributes(root);
};
