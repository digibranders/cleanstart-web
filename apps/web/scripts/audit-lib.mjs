// Pure, fs-free helpers for the image audit. Kept separate so the
// usage-classification logic (which decides what counts as an orphan and
// therefore drives deletion) can be unit-tested in isolation.

const EXT_GROUP = "png|jpe?g|webp|gif|avif|svg|ico";

/** Map a public-relative path (e.g. "images/a/b.png") to its served URL ("/images/a/b.png"). */
export function toPublicPath(relFromPublic) {
  return "/" + relFromPublic.split(/[\\/]/).join("/");
}

/**
 * Find the static directory prefix of any dynamically-built image path in a
 * source string — template literals (`/images/x/${y}.png`) and string
 * concatenation ("/images/x/" + y + ".png"). Used to mark matching files
 * `dynamic-unsure` instead of `orphan`, so nothing built at runtime is deleted.
 */
export function extractDynamicPrefixes(src) {
  const prefixes = new Set();
  // Template literal: backtick … "/…${"
  const tpl = /`(\/?[\w./-]*?)\$\{/g;
  let m;
  while ((m = tpl.exec(src))) {
    const head = m[1];
    if (!head.includes("/")) continue;
    const window = src.slice(m.index, m.index + 200);
    if (/\/?images?\//i.test(head) || new RegExp(`\\.(${EXT_GROUP})`).test(window)) {
      prefixes.add(head.replace(/[^/]*$/, ""));
    }
  }
  // Concatenation: "/images/…/" + x
  const cat = /["'](\/?[\w./-]*\/)["']\s*\+/g;
  while ((m = cat.exec(src))) {
    if (/images?\//i.test(m[1])) prefixes.add(m[1]);
  }
  return [...prefixes];
}

/**
 * Classify how an asset is referenced by the source corpus.
 * status: "used" (exact path) | "dynamic-unsure" (matches a runtime-built
 * prefix) | "used-weak" (basename only — ambiguous) | "orphan" (no reference).
 */
export function classifyUsage(publicPath, basename, corpus, dynamicPrefixes) {
  if (corpus.includes(publicPath)) return { status: "used", reason: "full-path" };
  for (const p of dynamicPrefixes) {
    if (publicPath.startsWith(p)) return { status: "dynamic-unsure", reason: `dynamic:${p}` };
  }
  const escaped = basename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`["'\`/(]${escaped}`).test(corpus)) return { status: "used-weak", reason: "basename-only" };
  return { status: "orphan", reason: "no-reference" };
}
