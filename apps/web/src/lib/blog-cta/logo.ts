/**
 * Makes a catalog logo safe to show on a fixed tile. The portal's SVGs were
 * drawn for either theme: 39 of 654 swap their ink to white under
 * `prefers-color-scheme: dark`, so for a visitor on a dark system theme they
 * vanish on a white tile, and 13 are white-only. Pure so it can be tested.
 */

export type LogoTone = "light" | "dark";

export interface PreparedLogo {
  svg: string;
  /** Which tile the logo reads on: `light` is a white tile, `dark` is the dark violet band. */
  tone: LogoTone;
  /** True when the SVG was rewritten, so the original URL can no longer be used as is. */
  changed: boolean;
}

/**
 * An SVG shown through <img> cannot run script, but refuse anything that
 * tries to. `foreignObject` is not on the list: Illustrator exports it as
 * inert metadata (the MariaDB logo has one).
 */
const UNSAFE = /<script|\son[a-z]+\s*=|javascript:|<!ENTITY/i;
const DARK_QUERY = /@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*\{/i;
const WHITES: ReadonlySet<string> = new Set(["white", "#fff", "#ffffff", "#fefefe", "rgb(255,255,255)"]);

/** Removes every `@media (prefers-color-scheme: dark) { ... }` block, matching braces. */
function stripDarkQueries(svg: string): string {
  let out = svg;
  for (;;) {
    const match = DARK_QUERY.exec(out);
    if (!match) return out;
    let depth = 1;
    let end = match.index + match[0].length;
    while (end < out.length && depth > 0) {
      if (out[end] === "{") depth++;
      else if (out[end] === "}") depth--;
      end++;
    }
    out = out.slice(0, match.index) + out.slice(end);
  }
}

function fillsOf(svg: string): string[] {
  return [...svg.matchAll(/fill\s*[=:]\s*["']?\s*([^;"'}\s>]+)/gi)]
    .map((m) => (m[1] ?? "").toLowerCase().replace(/\s+/g, ""))
    .filter((f) => f !== "" && f !== "none");
}

/** Null when the text is not a usable SVG. */
export function prepareLogoSvg(svg: string): PreparedLogo | null {
  if (!/<svg[\s>]/i.test(svg.slice(0, 600)) || UNSAFE.test(svg)) return null;
  const stripped = stripDarkQueries(svg);
  const fills = fillsOf(stripped);
  const whiteOnly = fills.length > 0 && fills.every((f) => WHITES.has(f));
  return { svg: stripped, tone: whiteOnly ? "dark" : "light", changed: stripped !== svg };
}
