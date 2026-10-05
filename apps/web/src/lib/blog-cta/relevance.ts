/**
 * Pure relevance scoring that picks, for one article, the catalog image and
 * the resource most related to it. No I/O here: the fetchers in `resolve.ts`
 * feed it plain data so the scoring is unit-testable.
 */

export interface ArticleText {
  title: string;
  abstract: string;
  category: string;
  headings: readonly string[];
  body: string;
}

export interface ResourceCandidate {
  slug: string;
  title: string;
  summary: string;
  gated: boolean;
  publishedAt: string | null;
}

/** Per-field weights: a mention in the title says far more than one in the body. */
const FIELD_WEIGHT = {
  title: 6,
  abstract: 3,
  category: 2,
  headings: 2,
  body: 1,
} as const;

/**
 * Catalog names that are also everyday words (or too ambiguous in security
 * writing) to count on their own. They still match through an alias.
 */
const AMBIGUOUS_IMAGE_NAMES: ReadonlySet<string> = new Set([
  "go",
  "node",
  "git",
  "curl",
  "bash",
  "ko",
  "kor",
  "vt",
  "wave",
  "karma",
  "prism",
  "vector",
  "distribution",
  "paranoia",
  "tempo",
  "crane",
  "vault",
  "dex",
  "druid",
  "medusa",
  "stargate",
  "cortex",
  "contour",
  "dragonfly",
  "heartbeat",
  "forecastle",
  "rust",
  "ruby",
  "spark",
  "flux",
  "envoy",
  "squid",
]);

/** Extra phrasings that point at a catalog name. */
const IMAGE_ALIASES: Readonly<Record<string, readonly string[]>> = {
  go: ["golang"],
  node: ["node.js", "nodejs"],
  postgres: ["postgresql"],
  rust: ["rust-lang", "rustlang"],
  ruby: ["ruby on rails"],
  vault: ["hashicorp vault"],
  envoy: ["envoy proxy"],
  flux: ["fluxcd", "flux cd"],
  spark: ["apache spark"],
};

/** A match needs at least this much weight, e.g. one heading or two body mentions. */
const MIN_IMAGE_SCORE = 2;

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** `cert-manager-controller` also matches "cert manager controller". */
function phrasePattern(phrase: string): RegExp {
  const parts = phrase.split(/[-\s]+/).map(escapeRegExp);
  return new RegExp(`(?<![\\w.-])${parts.join("[-\\s]")}(?![\\w-]|\\.\\w)`, "gi");
}

function countMatches(pattern: RegExp, text: string): number {
  if (!text) return 0;
  pattern.lastIndex = 0;
  return text.match(pattern)?.length ?? 0;
}

function weightedMentions(phrase: string, article: ArticleText): number {
  const pattern = phrasePattern(phrase);
  return (
    countMatches(pattern, article.title) * FIELD_WEIGHT.title +
    countMatches(pattern, article.abstract) * FIELD_WEIGHT.abstract +
    countMatches(pattern, article.category) * FIELD_WEIGHT.category +
    article.headings.reduce((sum, h) => sum + countMatches(pattern, h), 0) * FIELD_WEIGHT.headings +
    countMatches(pattern, article.body) * FIELD_WEIGHT.body
  );
}

/** Folds `redis-fips` into `redis`. Returns sorted, de-duplicated base names. */
export function baseImageNames(names: readonly string[]): string[] {
  return [...new Set(names.map((n) => n.replace(/-fips$/, "")))].sort();
}

/**
 * The catalog image the article is most about, or null when nothing clears
 * the threshold. Ties go to the shorter name, which is the more canonical
 * image (`redis` over `redis-exporter`).
 */
export function matchCatalogImage(article: ArticleText, catalogNames: readonly string[]): string | null {
  let best: { name: string; score: number } | null = null;
  for (const name of baseImageNames(catalogNames)) {
    // An everyday word like "go" counts only beside a word that makes it the image.
    const phrases = [
      ...(AMBIGUOUS_IMAGE_NAMES.has(name)
        ? [`${name} docker image`, `${name} container image`, `${name} image`, `official ${name}`]
        : [name]),
      ...(IMAGE_ALIASES[name] ?? []),
    ];
    if (phrases.length === 0) continue;
    const score = phrases.reduce((sum, p) => sum + weightedMentions(p, article), 0);
    if (score < MIN_IMAGE_SCORE) continue;
    if (!best || score > best.score || (score === best.score && name.length < best.name.length)) {
      best = { name, score };
    }
  }
  return best?.name ?? null;
}

const STOPWORDS: ReadonlySet<string> = new Set(
  (
    "the and for with that this from your you are was were have has had not but all can will " +
    "its into than then them they their there what when where which who why how our out about " +
    "more most over such only also just like make made using used use uses each every other " +
    "any some been being does doing done should could would may might must very new now one two " +
    "three four five first last get gets got through without within across between after before " +
    "here these those both same itself while because during under again further once per via " +
    "guide cleanstart blog article read"
  ).split(" "),
);

/** Spelled-out terms that readers and titles also write as an abbreviation. */
const ABBREVIATIONS: ReadonlyArray<readonly [RegExp, string]> = [[/\bsoftware bill of materials\b/g, "sbom"]];

/** Lowercase word tokens with crude plural folding, minus stopwords. */
export function tokenize(text: string): string[] {
  const normalised = ABBREVIATIONS.reduce((s, [pattern, abbr]) => s.replace(pattern, abbr), text.toLowerCase());
  return (normalised.match(/[a-z0-9][a-z0-9+.-]*[a-z0-9+]|[a-z0-9]/g) ?? [])
    .map((t) => (t.length > 4 && t.endsWith("s") && !t.endsWith("ss") ? t.slice(0, -1) : t))
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

function articleTermWeights(article: ArticleText): Map<string, number> {
  const weights = new Map<string, number>();
  const add = (text: string, w: number): void => {
    for (const t of tokenize(text)) weights.set(t, (weights.get(t) ?? 0) + w);
  };
  add(article.title, FIELD_WEIGHT.title);
  add(article.abstract, FIELD_WEIGHT.abstract);
  add(article.category, FIELD_WEIGHT.category);
  for (const h of article.headings) add(h, FIELD_WEIGHT.headings);
  add(article.body, FIELD_WEIGHT.body);
  // Damp very long bodies so one repeated word cannot drown the title.
  for (const [t, w] of weights) weights.set(t, Math.log1p(w));
  return weights;
}

/** Gated resources capture a lead, so they win close calls. */
const GATED_BONUS = 1.15;
/** Below this the match is noise; fall back to the newest gated resource. */
const MIN_RESOURCE_SCORE = 2.5;

/**
 * The resource most related to the article. Scores each resource's title and
 * summary terms against the article's weighted terms, with inverse document
 * frequency across the resource set so words every resource uses ("container",
 * "security") count for little. Falls back to the newest gated resource.
 */
export function pickRelatedResource<T extends ResourceCandidate>(
  article: ArticleText,
  resources: readonly T[],
): T | null {
  if (resources.length === 0) return null;
  const articleWeights = articleTermWeights(article);
  const headlineTerms = new Set([...tokenize(article.title), ...article.headings.flatMap(tokenize)]);
  const docs = resources.map((resource) => {
    const titleTerms = new Set(tokenize(resource.title));
    return { resource, titleTerms, terms: new Set([...titleTerms, ...tokenize(resource.summary)]) };
  });
  const df = new Map<string, number>();
  for (const { terms } of docs) for (const t of terms) df.set(t, (df.get(t) ?? 0) + 1);
  const n = resources.length;

  let best: { resource: T; score: number } | null = null;
  for (const { resource, titleTerms, terms } of docs) {
    let score = 0;
    for (const t of terms) {
      const a = articleWeights.get(t);
      if (!a) continue;
      const idf = Math.log((n + 1) / ((df.get(t) ?? 0) + 1)) + 1;
      score += a * idf * (titleTerms.has(t) ? 1.5 : 1);
    }
    // A resource whose whole title appears in the post's title or headings is
    // about the same thing, however many other terms the summaries share.
    if (titleTerms.size > 0) {
      const covered = [...titleTerms].filter((term) => headlineTerms.has(term)).length;
      score *= 1 + covered / titleTerms.size;
    }
    if (resource.gated) score *= GATED_BONUS;
    if (!best || score > best.score) best = { resource, score };
  }

  if (best && best.score >= MIN_RESOURCE_SCORE) return best.resource;
  return newestGated(resources);
}

function newestGated<T extends ResourceCandidate>(resources: readonly T[]): T {
  const byDate = [...resources].sort(
    (a, b) => Date.parse(b.publishedAt ?? "") - Date.parse(a.publishedAt ?? ""),
  );
  return byDate.find((r) => r.gated) ?? (byDate[0] as T);
}

/** The id behind a Payload relationship value, whether it arrived as an id or a hydrated doc. */
export function relationId(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object" && "id" in value) {
    const id = (value as { id: unknown }).id;
    if (typeof id === "string" || typeof id === "number") return String(id);
  }
  return null;
}

/**
 * The resource an editor picked, if it is still among the published rows.
 * A pick that was unpublished or deleted resolves to null, so the caller
 * falls back to the automatic match instead of linking to a 404.
 */
export function pickEditorResource<T extends { id: string | number }>(
  chosen: unknown,
  published: readonly T[],
): T | null {
  const id = relationId(chosen);
  if (id === null) return null;
  return published.find((r) => String(r.id) === id) ?? null;
}

/**
 * The catalog image an editor typed, normalised to its base name, if it
 * exists in the catalog. `redis-fips` and ` Redis ` both resolve to `redis`.
 */
export function pickEditorImage(chosen: string | null | undefined, catalogNames: readonly string[]): string | null {
  const name = chosen?.trim().toLowerCase();
  if (!name) return null;
  const bases = baseImageNames(catalogNames);
  const base = name.replace(/-fips$/, "");
  return bases.includes(base) ? base : null;
}

/** First sentence of a catalog description, which the portal truncates with an ellipsis. */
export function firstSentence(text: string): string | null {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  const match = clean.match(/^.+?[.!?](?=\s|$)/);
  if (match) return match[0];
  return clean.endsWith("…") ? null : clean;
}
