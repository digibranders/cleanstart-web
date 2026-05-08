/**
 * Lexical body audit — counts links and image-alt coverage in the
 * Lexical JSON tree. Pure walker, no React. Powers the SEO sidebar's
 * link/image-alt chips so editors can see body health at a glance.
 *
 * Internal vs external link discrimination matches the link picker's
 * own discriminator (`fields/link.ts`): nodes carrying a `linkType`
 * of `internal` (or a non-empty `doc` relationship) are internal;
 * everything else with a non-empty URL counts as external.
 */

interface LinkAttrs {
  type: string | undefined;
  url: string | undefined;
  linkType: string | undefined;
  doc: unknown;
}

interface ImageNode {
  type?: string;
  altText?: string;
  alt?: string;
  fields?: { altText?: string; alt?: string };
}

interface LexicalNode {
  type?: string;
  fields?: LinkAttrs & ImageNode['fields'];
  altText?: string;
  alt?: string;
  url?: string;
  children?: LexicalNode[];
}

export interface BodyAuditResult {
  readonly internalLinks: number;
  readonly externalLinks: number;
  readonly totalImages: number;
  readonly imagesWithAlt: number;
}

const isLinkNode = (node: LexicalNode): boolean =>
  node.type === 'link' || node.type === 'autolink';

const isImageNode = (node: LexicalNode): boolean =>
  node.type === 'upload' ||
  node.type === 'image' ||
  node.type === 'inline-image';

const linkAttrs = (node: LexicalNode): LinkAttrs => ({
  type: node.fields?.type,
  url: node.fields?.url ?? node.url ?? '',
  linkType: node.fields?.linkType,
  doc: node.fields?.doc ?? null,
});

const imageHasAlt = (node: LexicalNode): boolean => {
  const direct = node.altText ?? node.alt;
  if (typeof direct === 'string' && direct.trim().length > 0) return true;
  const fielded = node.fields?.altText ?? node.fields?.alt;
  return typeof fielded === 'string' && fielded.trim().length > 0;
};

const isInternalLink = (attrs: LinkAttrs): boolean => {
  if (attrs.linkType === 'internal') return true;
  if (attrs.doc != null) return true;
  // Site-relative paths (`/foo`) without an explicit linkType are
  // treated as internal — matches what the public renderer does.
  if (typeof attrs.url === 'string' && attrs.url.startsWith('/')) return true;
  return false;
};

export const auditLexicalBody = (body: unknown): BodyAuditResult => {
  const result = {
    internalLinks: 0,
    externalLinks: 0,
    totalImages: 0,
    imagesWithAlt: 0,
  };

  if (!body || typeof body !== 'object') return result;
  const root = (body as { root?: LexicalNode }).root;
  if (!root || !root.children) return result;

  const walk = (node: LexicalNode): void => {
    if (isLinkNode(node)) {
      const attrs = linkAttrs(node);
      const url = typeof attrs.url === 'string' ? attrs.url.trim() : '';
      if (url.length > 0 || attrs.doc != null) {
        if (isInternalLink(attrs)) result.internalLinks += 1;
        else result.externalLinks += 1;
      }
    }
    if (isImageNode(node)) {
      result.totalImages += 1;
      if (imageHasAlt(node)) result.imagesWithAlt += 1;
    }
    if (node.children) {
      for (const child of node.children) walk(child);
    }
  };

  for (const child of root.children) walk(child);
  return result;
};
