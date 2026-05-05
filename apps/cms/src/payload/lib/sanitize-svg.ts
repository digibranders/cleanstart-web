import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize an uploaded SVG before persisting it. Strips:
 *   - <script> elements
 *   - on* event handler attributes (onload, onclick, …)
 *   - <foreignObject> (can embed arbitrary HTML/JS)
 *   - href / xlink:href values starting with javascript: or data:
 *
 * Without this, an editor account compromise (or simply a careless
 * upload of a malicious SVG masquerading as a logo) leads to stored
 * XSS the moment any page renders the SVG inline. Re-encoding by
 * Sharp doesn't apply to SVGs; they ship as-uploaded.
 */
const FORBIDDEN_TAGS = ['script', 'foreignObject', 'foreignobject'];

const HREF_SCHEME = /^(javascript|data|vbscript):/i;

export const sanitizeSvg = (raw: string): string => {
  const cleaned = DOMPurify.sanitize(raw, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: FORBIDDEN_TAGS,
    // DOMPurify already strips on* handlers under the svg profile, but be
    // explicit so a future profile change doesn't silently re-allow them.
    FORBID_ATTR: [
      'onload',
      'onerror',
      'onclick',
      'onmouseover',
      'onmouseout',
      'onfocus',
      'onblur',
      'onsubmit',
    ],
    // Disallow external resource fetches; brand SVGs are self-contained.
    ALLOW_UNKNOWN_PROTOCOLS: false,
  });

  // Belt-and-braces: walk the cleaned output one more time and zap any
  // surviving href/xlink:href with a dangerous scheme. DOMPurify's URL
  // sanitizer is robust but the cost of a regex sweep here is trivial.
  return cleaned.replace(/(href\s*=\s*["'])([^"']+)(["'])/gi, (match, prefix, value, suffix) => {
    if (HREF_SCHEME.test(value.trim())) return `${prefix}#${suffix}`;
    return match;
  });
};

export const sanitizeSvgBuffer = (buffer: Buffer): Buffer => {
  const text = buffer.toString('utf8');
  const cleaned = sanitizeSvg(text);
  return Buffer.from(cleaned, 'utf8');
};
