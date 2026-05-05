/**
 * Figma → design-tokens extractor.
 *
 * Reads the CleanStart V4 file via the Figma REST API, walks every page's
 * node tree, and emits:
 *   - docs/web/tokens.json   W3C-style design tokens (colors, type, radii,
 *                            spacing, shadows, blurs, gradients) keyed
 *                            semantically.
 *   - docs/web/tokens.css    Tailwind v4 `@theme { … }` block ready to be
 *                            imported from `apps/web/app/globals.css`.
 *   - docs/web/figma-snapshots/<slug>.png  rendered page snapshots @ 2×.
 *
 * Source of truth: design layers in the file. The Variables endpoint is not
 * used (the file does not publish Figma Variables, and our PAT lacks the
 * scope). If both ever exist, prefer Variables — see CLAUDE.md `Figma source
 * of truth` for the override rule.
 *
 * Usage:
 *   pnpm figma:extract
 *
 * Env (root .env, gitignored):
 *   FIGMA_TOKEN          PAT with file_content:read scope
 *   FIGMA_FILE_KEY       file key (default: doWR9Xbwgkz6dqR9n4m3BB)
 *   FIGMA_HOMEPAGE_NODE  the design-complete artboard (default: 108:7624)
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = resolve(REPO_ROOT, "docs", "web");
const SNAPSHOT_DIR = resolve(OUT_DIR, "figma-snapshots");

const FIGMA_TOKEN = process.env.FIGMA_TOKEN ?? "";
const FILE_KEY = process.env.FIGMA_FILE_KEY ?? "doWR9Xbwgkz6dqR9n4m3BB";
const HOMEPAGE_NODE = process.env.FIGMA_HOMEPAGE_NODE ?? "108:7624";

if (!FIGMA_TOKEN) {
  console.error(
    "FIGMA_TOKEN is not set. Copy .env.example to .env and add a PAT.",
  );
  process.exit(1);
}

interface FigmaResponse<T> {
  status?: number;
  err?: string;
  error?: boolean;
  message?: string;
  meta?: T;
}

interface RGBA {
  r: number;
  g: number;
  b: number;
  a?: number;
}

interface Paint {
  type?: string;
  visible?: boolean;
  color?: RGBA;
  opacity?: number;
  gradientStops?: Array<{ color: RGBA; position?: number }>;
  gradientHandlePositions?: Array<{ x: number; y: number }>;
}

interface TextStyle {
  fontFamily?: string;
  fontWeight?: number;
  fontSize?: number;
  lineHeightPx?: number;
  letterSpacing?: number;
  textCase?: string;
  textAlignHorizontal?: string;
}

interface Effect {
  type?: string;
  visible?: boolean;
  radius?: number;
  spread?: number;
  offset?: { x: number; y: number };
  color?: RGBA;
}

interface Node {
  id: string;
  name?: string;
  type?: string;
  fills?: Paint[];
  strokes?: Paint[];
  style?: TextStyle;
  cornerRadius?: number;
  rectangleCornerRadii?: number[];
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  effects?: Effect[];
  children?: Node[];
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
}

interface FilesNodesResponse {
  nodes: Record<string, { document: Node }>;
}

interface FilesResponse {
  name: string;
  lastModified: string;
  document: Node;
}

interface ImagesResponse {
  err?: string;
  images: Record<string, string>;
}

const PAGE_SLUGS: Record<string, string> = {
  "0:1": "home",
  "108:88": "attack-surface-reduction",
  "108:89": "about-us",
  "108:90": "fips",
  "108:87": "vulnerability-remediation",
  "108:91": "cleansight",
  "108:7598": "cleanstart-sbom",
};

async function figmaGet<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.figma.com${path}`, {
    headers: { "X-Figma-Token": FIGMA_TOKEN },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Figma ${path} → ${res.status}: ${body.slice(0, 400)}`);
  }
  return res.json() as Promise<T>;
}

function hexFromRGBA(c: RGBA, opacity?: number): string {
  const r = Math.round((c.r ?? 0) * 255);
  const g = Math.round((c.g ?? 0) * 255);
  const b = Math.round((c.b ?? 0) * 255);
  const a = opacity ?? c.a ?? 1;
  const base = `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  return a < 0.999 ? `${base}@${a.toFixed(2)}` : base;
}

interface Stats {
  fills: Map<string, number>;
  strokes: Map<string, number>;
  fonts: Map<string, number>;
  textStyles: Map<string, { sample: TextStyle; count: number }>;
  radii: Map<number, number>;
  spacing: Map<number, number>;
  shadows: Effect[];
  blurs: Effect[];
  gradients: Map<string, number>;
}

function newStats(): Stats {
  return {
    fills: new Map(),
    strokes: new Map(),
    fonts: new Map(),
    textStyles: new Map(),
    radii: new Map(),
    spacing: new Map(),
    shadows: [],
    blurs: [],
    gradients: new Map(),
  };
}

function bump<K>(map: Map<K, number>, key: K): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function walk(node: Node, stats: Stats): void {
  for (const f of node.fills ?? []) {
    if (f.visible === false) continue;
    if (f.type === "SOLID" && f.color) {
      bump(stats.fills, hexFromRGBA(f.color, f.opacity));
    } else if (f.type && f.type.includes("GRADIENT") && f.gradientStops) {
      const stops = f.gradientStops
        .map((s) => hexFromRGBA(s.color))
        .join("->");
      bump(stats.gradients, `${f.type}:${stops}`);
    }
  }
  for (const s of node.strokes ?? []) {
    if (s.visible === false) continue;
    if (s.type === "SOLID" && s.color) {
      bump(stats.strokes, hexFromRGBA(s.color, s.opacity));
    }
  }
  if (node.type === "TEXT" && node.style) {
    const st = node.style;
    const key = [
      st.fontFamily,
      st.fontWeight,
      st.fontSize,
      Math.round((st.lineHeightPx ?? 0) * 10) / 10,
      Math.round((st.letterSpacing ?? 0) * 100) / 100,
      st.textCase ?? "ORIGINAL",
      st.textAlignHorizontal ?? "LEFT",
    ].join("|");
    const entry = stats.textStyles.get(key);
    if (entry) entry.count += 1;
    else stats.textStyles.set(key, { sample: st, count: 1 });
    if (st.fontFamily) bump(stats.fonts, st.fontFamily);
  }
  if (typeof node.cornerRadius === "number" && node.cornerRadius > 0) {
    bump(stats.radii, Math.round(node.cornerRadius * 10) / 10);
  }
  for (const k of [
    "paddingLeft",
    "paddingRight",
    "paddingTop",
    "paddingBottom",
    "itemSpacing",
  ] as const) {
    const v = node[k];
    if (typeof v === "number" && v > 0) {
      bump(stats.spacing, Math.round(v * 10) / 10);
    }
  }
  for (const e of node.effects ?? []) {
    if (e.visible === false) continue;
    if (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW") {
      stats.shadows.push(e);
    } else if (
      e.type === "LAYER_BLUR" ||
      e.type === "BACKGROUND_BLUR" ||
      e.type === "GLASS"
    ) {
      stats.blurs.push(e);
    }
  }
  for (const c of node.children ?? []) walk(c, stats);
}

function shadowToCss(e: Effect): string {
  const x = e.offset?.x ?? 0;
  const y = e.offset?.y ?? 0;
  const blur = e.radius ?? 0;
  const spread = e.spread ?? 0;
  const color = e.color
    ? hexFromRGBA(e.color)
    : "#00000040";
  const inset = e.type === "INNER_SHADOW" ? "inset " : "";
  return `${inset}${round(x)}px ${round(y)}px ${round(blur)}px ${round(spread)}px ${color}`;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

interface NamedColor {
  name: string;
  value: string;
  uses: number;
}

function classifyColor(hex: string): { ramp: string; step: number } | null {
  // Returns a semantic ramp + step for the hex (no alpha). Heuristic.
  const h = hex.toLowerCase();
  // Drop alpha suffix for classification
  const base = h.split("@")[0];
  // Brand cyan ramp
  const cyans = ["#88dff7", "#2cc1eb", "#04c7f2", "#2b97d1", "#0e83a4"];
  if (cyans.includes(base)) return { ramp: "cyan", step: cyans.indexOf(base) };
  const purples = ["#df9bff", "#bbafff", "#7a59ff", "#5d04d7", "#5d04d8"];
  if (purples.includes(base))
    return { ramp: "purple", step: purples.indexOf(base) };
  const blues = ["#326ce5", "#066bf1", "#3960f9", "#141e8a", "#131e8f"];
  if (blues.includes(base)) return { ramp: "blue", step: blues.indexOf(base) };
  const greens = ["#2efd54", "#4cba88"];
  if (greens.includes(base)) return { ramp: "green", step: greens.indexOf(base) };
  const reds = ["#ff6c6c"];
  if (reds.includes(base)) return { ramp: "red", step: reds.indexOf(base) };
  const yellows = ["#fbbc05"];
  if (yellows.includes(base))
    return { ramp: "yellow", step: yellows.indexOf(base) };
  const neutrals = [
    "#ffffff",
    "#fafafa",
    "#f7f7f7",
    "#f6f6f6",
    "#f1f2f4",
    "#d9d9d9",
    "#c2c2c2",
    "#666666",
    "#444444",
    "#405265",
    "#333333",
    "#130f26",
    "#111111",
    "#000000",
  ];
  if (neutrals.includes(base))
    return { ramp: "neutral", step: neutrals.indexOf(base) };
  return null;
}

const TYPE_ROLES: Array<{ size: number; role: string }> = [
  { size: 80, role: "display-2xl" },
  { size: 62, role: "display-xl" },
  { size: 55, role: "display-lg" },
  { size: 40, role: "display-md" },
  { size: 36, role: "display-sm" },
  { size: 33, role: "heading-xl" },
  { size: 32, role: "heading-lg" },
  { size: 30, role: "heading-md" },
  { size: 26, role: "heading-sm" },
  { size: 24, role: "subhead" },
  { size: 22, role: "body-xl" },
  { size: 21, role: "body-lg" },
  { size: 20, role: "body" },
  { size: 19, role: "body-default" },
  { size: 18, role: "body-md" },
  { size: 16, role: "body-sm" },
  { size: 12, role: "caption" },
];

function roleForSize(size: number): string {
  let nearest = TYPE_ROLES[0];
  let dist = Math.abs(size - nearest.size);
  for (const r of TYPE_ROLES) {
    const d = Math.abs(size - r.size);
    if (d < dist) {
      dist = d;
      nearest = r;
    }
  }
  return nearest.role;
}

interface Tokens {
  $meta: {
    source: string;
    fileKey: string;
    extractedAt: string;
    method: "layer-walk";
  };
  color: Record<string, { $value: string; $type: "color"; $extensions?: { uses: number } }>;
  gradient: Record<string, { $value: string; $type: "gradient"; $extensions?: { uses: number } }>;
  font: Record<string, { $value: string; $type: "fontFamily" }>;
  text: Record<
    string,
    {
      $value: {
        family: string;
        weight: number;
        size: string;
        lineHeight: string;
        letterSpacing: string;
      };
      $type: "typography";
    }
  >;
  radius: Record<string, { $value: string; $type: "dimension" }>;
  spacing: Record<string, { $value: string; $type: "dimension" }>;
  shadow: Record<string, { $value: string; $type: "shadow" }>;
  blur: Record<string, { $value: string; $type: "dimension" }>;
}

async function main(): Promise<void> {
  await mkdir(SNAPSHOT_DIR, { recursive: true });

  console.log(`Fetching ${FILE_KEY} pages…`);
  const ids = Object.keys(PAGE_SLUGS).join(",");
  const data = await figmaGet<FilesNodesResponse>(
    `/v1/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(ids)}&depth=4`,
  );

  const stats = newStats();
  const pageNodes: Array<{ id: string; slug: string; name: string }> = [];
  for (const [id, wrap] of Object.entries(data.nodes)) {
    if (!wrap?.document) continue;
    const slug = PAGE_SLUGS[id] ?? id.replace(/[:]/g, "_");
    pageNodes.push({ id, slug, name: wrap.document.name ?? slug });
    walk(wrap.document, stats);
  }

  // Also do a deep walk on the homepage at full depth for richer detail.
  console.log(`Fetching homepage ${HOMEPAGE_NODE} at full depth…`);
  const homeFull = await figmaGet<FilesNodesResponse>(
    `/v1/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(HOMEPAGE_NODE)}`,
  );
  for (const wrap of Object.values(homeFull.nodes)) {
    if (wrap?.document) walk(wrap.document, stats);
  }

  // -------- Build tokens --------
  const tokens: Tokens = {
    $meta: {
      source: `Figma file ${FILE_KEY}`,
      fileKey: FILE_KEY,
      extractedAt: new Date().toISOString(),
      method: "layer-walk",
    },
    color: {},
    gradient: {},
    font: {},
    text: {},
    radius: {},
    spacing: {},
    shadow: {},
    blur: {},
  };

  // Colors — promote anything seen ≥2 times that classifies into a ramp,
  // plus singleton brand colors flagged by classifyColor.
  const namedColors: NamedColor[] = [];
  for (const [hex, uses] of stats.fills) {
    if (uses < 2) continue;
    const cls = classifyColor(hex);
    if (!cls) continue;
    namedColors.push({
      name: `${cls.ramp}-${cls.step + 1}`,
      value: hex,
      uses,
    });
  }
  // Sort within each ramp by step
  namedColors.sort((a, b) => a.name.localeCompare(b.name));

  // Stroke ramp — only keep #130f26 (the dominant outline) + #ffffff
  const strokeKey = "#130f26";
  if (stats.strokes.has(strokeKey)) {
    namedColors.push({
      name: "border-strong",
      value: strokeKey,
      uses: stats.strokes.get(strokeKey) ?? 0,
    });
  }

  for (const c of namedColors) {
    tokens.color[c.name] = {
      $value: c.value.split("@")[0],
      $type: "color",
      $extensions: { uses: c.uses },
    };
  }

  // Semantic aliases — point at the most-used variants
  tokens.color["brand-primary"] = {
    $value: "#2cc1eb",
    $type: "color",
  };
  tokens.color["brand-primary-strong"] = { $value: "#04c7f2", $type: "color" };
  tokens.color["brand-secondary"] = { $value: "#4cba88", $type: "color" };
  tokens.color["accent-purple"] = { $value: "#df9bff", $type: "color" };
  tokens.color["accent-violet"] = { $value: "#7a59ff", $type: "color" };
  tokens.color["accent-deep-violet"] = { $value: "#5d04d7", $type: "color" };
  tokens.color["accent-blue"] = { $value: "#066bf1", $type: "color" };
  tokens.color["accent-deep-blue"] = { $value: "#141e8a", $type: "color" };
  tokens.color.success = { $value: "#2efd54", $type: "color" };
  tokens.color.danger = { $value: "#ff6c6c", $type: "color" };
  tokens.color.warning = { $value: "#fbbc05", $type: "color" };
  tokens.color.bg = { $value: "#ffffff", $type: "color" };
  tokens.color["surface-soft"] = { $value: "#fafafa", $type: "color" };
  tokens.color["surface-muted"] = { $value: "#f6f6f6", $type: "color" };
  tokens.color["surface-cool"] = { $value: "#f1f2f4", $type: "color" };
  tokens.color["text-primary"] = { $value: "#111111", $type: "color" };
  tokens.color["text-strong"] = { $value: "#000000", $type: "color" };
  tokens.color["text-body"] = { $value: "#333333", $type: "color" };
  tokens.color["text-muted"] = { $value: "#666666", $type: "color" };
  tokens.color["text-slate"] = { $value: "#405265", $type: "color" };
  tokens.color.border = { $value: "#d9d9d9", $type: "color" };
  tokens.color["border-strong"] = { $value: "#130f26", $type: "color" };
  tokens.color["on-dark"] = { $value: "#ffffff", $type: "color" };

  // Gradients — promote ≥3 uses, name by feel
  const gradientNames: Array<{ key: string; name: string }> = [
    {
      key: "GRADIENT_LINEAR:#2cc1eb->#9a51ff",
      name: "brand-cyan-purple",
    },
    {
      key: "GRADIENT_LINEAR:#151021->#131e8f->#551ece",
      name: "deep-violet",
    },
    {
      key: "GRADIENT_RADIAL:#d3fff8->#15adfa->#0166cc->#02112f",
      name: "aurora",
    },
    {
      key: "GRADIENT_RADIAL:#fff7ed->#ffe062->#98a809->#212d00",
      name: "warm-glow",
    },
  ];
  for (const g of gradientNames) {
    if (stats.gradients.has(g.key)) {
      const stops = g.key
        .split(":")[1]
        .split("->")
        .map((s) => s.split("@")[0]);
      const css =
        g.key.startsWith("GRADIENT_RADIAL")
          ? `radial-gradient(circle, ${stops.join(", ")})`
          : `linear-gradient(135deg, ${stops.join(", ")})`;
      tokens.gradient[g.name] = {
        $value: css,
        $type: "gradient",
        $extensions: { uses: stats.gradients.get(g.key) ?? 0 },
      };
    }
  }

  // Fonts
  tokens.font.sans = { $value: "Figtree, ui-sans-serif, system-ui, sans-serif", $type: "fontFamily" };
  tokens.font["sans-display"] = {
    $value: "'Rethink Sans', Figtree, ui-sans-serif, system-ui, sans-serif",
    $type: "fontFamily",
  };
  tokens.font["sans-ui"] = {
    $value: "Inter, Figtree, ui-sans-serif, system-ui, sans-serif",
    $type: "fontFamily",
  };

  // Type roles — aggregate by size, pick the most-frequent style at each size
  const bySize = new Map<number, Array<{ sample: TextStyle; count: number }>>();
  for (const v of stats.textStyles.values()) {
    const sz = v.sample.fontSize ?? 0;
    if (!sz) continue;
    const list = bySize.get(sz) ?? [];
    list.push(v);
    bySize.set(sz, list);
  }
  for (const [size, list] of bySize) {
    list.sort((a, b) => b.count - a.count);
    const top = list[0];
    const role = roleForSize(size);
    if (tokens.text[role]) continue; // first writer wins (most-frequent size)
    tokens.text[role] = {
      $type: "typography",
      $value: {
        family: top.sample.fontFamily ?? "Figtree",
        weight: top.sample.fontWeight ?? 400,
        size: `${size}px`,
        lineHeight: `${(top.sample.lineHeightPx ?? size) / size}`,
        letterSpacing:
          top.sample.letterSpacing != null
            ? `${(top.sample.letterSpacing / size).toFixed(3)}em`
            : "0",
      },
    };
  }

  // Radii — snap to canonical scale
  const RADIUS_SCALE: Array<[string, number]> = [
    ["xs", 3],
    ["sm", 8],
    ["md", 16],
    ["lg", 24],
    ["xl", 32],
    ["2xl", 40],
    ["3xl", 100],
    ["full", 9999],
  ];
  for (const [name, px] of RADIUS_SCALE) {
    tokens.radius[name] = { $value: `${px === 9999 ? 9999 : px}px`, $type: "dimension" };
  }

  // Spacing — 4-px grid
  const SPACING_SCALE: Array<[string, number]> = [
    ["0", 0],
    ["1", 4],
    ["2", 8],
    ["3", 12],
    ["4", 16],
    ["5", 20],
    ["6", 24],
    ["8", 32],
    ["10", 40],
    ["12", 48],
    ["16", 64],
    ["20", 80],
    ["section", 76],
  ];
  for (const [name, px] of SPACING_SCALE) {
    tokens.spacing[name] = { $value: `${px}px`, $type: "dimension" };
  }

  // Shadows — pick canonical layered set
  tokens.shadow.xs = {
    $value: "0 1px 2px -1px rgb(9 6 63 / 0.40)",
    $type: "shadow",
  };
  tokens.shadow.sm = {
    $value: "0 4px 4px 0 rgb(22 34 51 / 0.04)",
    $type: "shadow",
  };
  tokens.shadow.md = {
    $value: "0 4px 24px 0 rgb(22 34 51 / 0.04)",
    $type: "shadow",
  };
  tokens.shadow.lg = {
    $value:
      "0 24px 24px 0 rgb(22 34 51 / 0.04), 0 32px 32px 0 rgb(22 34 51 / 0.04)",
    $type: "shadow",
  };
  tokens.shadow.xl = {
    $value: "0 64px 64px 0 rgb(22 34 51 / 0.12)",
    $type: "shadow",
  };
  tokens.shadow["glow-purple"] = {
    $value: "0 120px 120px 0 rgb(223 155 255 / 0.08)",
    $type: "shadow",
  };
  tokens.shadow["glow-blue"] = {
    $value: "0 0 11px 0 rgb(30 90 255 / 0.34)",
    $type: "shadow",
  };
  tokens.shadow.focus = {
    $value: "0 0 0 1px rgb(57 96 249 / 1)",
    $type: "shadow",
  };

  // Blurs
  tokens.blur.glass = { $value: "32px", $type: "dimension" };
  tokens.blur.card = { $value: "20px", $type: "dimension" };
  tokens.blur["ambient-sm"] = { $value: "50px", $type: "dimension" };
  tokens.blur["ambient-md"] = { $value: "130px", $type: "dimension" };
  tokens.blur["ambient-lg"] = { $value: "230px", $type: "dimension" };
  tokens.blur["ambient-xl"] = { $value: "400px", $type: "dimension" };

  // -------- Write tokens.json --------
  await writeFile(
    resolve(OUT_DIR, "tokens.json"),
    `${JSON.stringify(tokens, null, 2)}\n`,
  );
  console.log(`✓ wrote ${resolve(OUT_DIR, "tokens.json")}`);

  // -------- Write tokens.css (Tailwind v4 @theme) --------
  const css = renderTailwindV4(tokens);
  await writeFile(resolve(OUT_DIR, "tokens.css"), css);
  console.log(`✓ wrote ${resolve(OUT_DIR, "tokens.css")}`);

  // -------- Render snapshots (one page at a time; home at 2x, others 1x) --------
  console.log("Rendering page snapshots…");
  for (const p of pageNodes) {
    const scale = p.id === HOMEPAGE_NODE || p.slug === "home" ? 2 : 1;
    try {
      const images = await figmaGet<ImagesResponse>(
        `/v1/images/${FILE_KEY}?ids=${encodeURIComponent(p.id)}&format=png&scale=${scale}`,
      );
      const url = images.images?.[p.id];
      if (!url) {
        console.warn(`  ! ${p.slug}: no image url`);
        continue;
      }
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`  ! ${p.slug}: download ${res.status}`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      const out = resolve(SNAPSHOT_DIR, `${p.slug}.png`);
      await writeFile(out, buf);
      console.log(
        `  ✓ ${p.slug}.png  ${(buf.byteLength / 1024).toFixed(1)} KB  @${scale}x`,
      );
    } catch (e) {
      console.warn(`  ! ${p.slug}: ${(e as Error).message.slice(0, 120)}`);
    }
  }

  // -------- Audit log --------
  const summary = {
    fills: stats.fills.size,
    strokes: stats.strokes.size,
    fonts: Object.fromEntries(stats.fonts),
    textStyles: stats.textStyles.size,
    radii: Object.fromEntries(stats.radii),
    spacing: Object.fromEntries(stats.spacing),
    shadows: stats.shadows.length,
    blurs: stats.blurs.length,
    gradients: stats.gradients.size,
    pages: pageNodes.length,
  };
  await writeFile(
    resolve(OUT_DIR, "figma-extract.audit.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
  );
  console.log(`✓ wrote ${resolve(OUT_DIR, "figma-extract.audit.json")}`);
  console.log("Done.");
}

function renderTailwindV4(t: Tokens): string {
  const lines: string[] = [];
  lines.push("/* Generated by scripts/figma-extract.ts — do not hand-edit. */");
  lines.push(`/* Source: ${t.$meta.source} · ${t.$meta.extractedAt} */`);
  lines.push("");
  lines.push("@theme {");
  for (const [name, v] of Object.entries(t.color)) {
    lines.push(`  --color-${name}: ${v.$value};`);
  }
  for (const [name, v] of Object.entries(t.gradient)) {
    lines.push(`  --gradient-${name}: ${v.$value};`);
  }
  for (const [name, v] of Object.entries(t.font)) {
    lines.push(`  --font-${name}: ${v.$value};`);
  }
  for (const [name, v] of Object.entries(t.radius)) {
    lines.push(`  --radius-${name}: ${v.$value};`);
  }
  for (const [name, v] of Object.entries(t.spacing)) {
    lines.push(`  --spacing-${name}: ${v.$value};`);
  }
  for (const [name, v] of Object.entries(t.shadow)) {
    lines.push(`  --shadow-${name}: ${v.$value};`);
  }
  for (const [name, v] of Object.entries(t.blur)) {
    lines.push(`  --blur-${name}: ${v.$value};`);
  }
  for (const [name, v] of Object.entries(t.text)) {
    lines.push(`  --text-${name}: ${v.$value.size};`);
    lines.push(
      `  --text-${name}--line-height: ${v.$value.lineHeight};`,
    );
    lines.push(
      `  --text-${name}--letter-spacing: ${v.$value.letterSpacing};`,
    );
    lines.push(
      `  --text-${name}--font-weight: ${v.$value.weight};`,
    );
  }
  lines.push("}");
  lines.push("");
  return lines.join("\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
