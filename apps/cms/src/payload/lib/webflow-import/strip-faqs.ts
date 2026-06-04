/**
 * Remove an inline "FAQs" section from a Lexical body.
 *
 * Webflow stored guide FAQs in two places at once: dedicated Q/A slot fields
 * (q1..q5 / ans-1..ans-5) AND inline inside the `main-text` rich-text as an
 * "FAQs" heading followed by the Q&A. The import extracts the slots into the
 * structured `faqs` field but converts the full body HTML to Lexical, so the
 * FAQ section survives in `body` too — rendering twice on the detail page and
 * polluting the auto table-of-contents / word count.
 *
 * The FAQ section is always the final block of the body (verified across the
 * imported corpus: no guide has a non-FAQ section after the FAQ heading, and
 * none has more than one FAQ heading), so removing from the first FAQ heading
 * to the end is safe. Callers must only apply this when the structured `faqs`
 * field is populated, so the Q&A are never lost.
 */

type LexicalNode = {
  type?: string;
  tag?: string;
  text?: string;
  children?: LexicalNode[];
};

type LexicalBody = {
  root?: { children?: LexicalNode[] } & Record<string, unknown>;
} | null | undefined;

/**
 * Matches a standalone FAQ section heading and its common Webflow variants:
 * `FAQ`, `FAQs`, `FAQs:`, `FAQs?`, `FAQ's`, `FAQ’S` — but NOT a heading that
 * merely starts with "FAQ" (e.g. "FAQ about networking"), which would risk
 * deleting real content.
 */
const FAQ_HEADING = /^faq'?s?\s*[:?.]*\s*$/i;

const collectText = (node: LexicalNode): string => {
  if (typeof node.text === 'string') return node.text;
  return (node.children ?? []).map(collectText).join('');
};

const isFaqHeading = (node: LexicalNode): boolean => {
  if (node?.type !== 'heading') return false;
  const text = collectText(node).replace(/[‘’]/g, "'").trim();
  return FAQ_HEADING.test(text);
};

/** True when the body contains a standalone inline FAQ section heading. */
export const bodyHasInlineFaqHeading = (body: LexicalBody): boolean => {
  const children = body?.root?.children;
  return Array.isArray(children) && children.some(isFaqHeading);
};

/**
 * Return a copy of `body` with the inline FAQ section removed (the first FAQ
 * heading and every node after it). Returns the input unchanged when no FAQ
 * heading is present or the value is not a Lexical body.
 */
export const stripInlineFaqSection = <T extends LexicalBody>(body: T): T => {
  const root = body?.root;
  const children = root?.children;
  if (!root || !Array.isArray(children)) return body;
  const idx = children.findIndex(isFaqHeading);
  if (idx === -1) return body;
  return {
    ...(body as object),
    root: { ...root, children: children.slice(0, idx) },
  } as T;
};
