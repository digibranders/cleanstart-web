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
  // We must collect first because each unwrap mutates the live list.
  for (const span of Array.from(root.getElementsByTagName('span'))) {
    normalizeSpan(span);
  }
  for (const font of Array.from(root.getElementsByTagName('font'))) {
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
