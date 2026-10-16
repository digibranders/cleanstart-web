#!/usr/bin/env node
/**
 * Lists published CMS documents that contain em-dashes or en-dashes, so editors
 * can clean them up. Read-only: it only GETs the public REST API.
 *
 * Usage:
 *   node scripts/cms-dash-report.mjs [out.md]      (default: stdout)
 *   CMS_URL=https://cms.cleanstart.com             (default)
 *
 * The report counts characters, per document, grouped by top-level field
 * (Lexical bodies collapse to "body"). Only published docs are visible to the
 * public API, so drafts are not covered.
 */

import { writeFileSync } from "node:fs";

const CMS = (process.env.CMS_URL ?? "https://cms.cleanstart.com").replace(/\/$/, "");
const DASH = /[–—]/g;
const COLLECTIONS = [
  "blogs",
  "knowledgeBase",
  "guides",
  "news",
  "events",
  "webinars",
  "case-studies",
  "resources",
  "jobs",
  "authors",
  "podcastEpisodes",
  "legalDocuments",
  "emailSignatures",
  "signatureTemplates",
  "industries",
  "pages",
  "categories",
  "knowledgeCategories",
  "newsCategories",
  "resourceTypes",
  "webinarTypes",
  "pressTypes",
  "regions",
  "departments",
  "jobLocations",
  "aboutGalleries",
];
const GLOBALS = ["impactStats", "seoDefaults", "siteSettings", "spotlights", "legal"];

async function getJson(path) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${CMS}/api/${path}`);
      if (!res.ok) return { status: res.status };
      return { status: 200, json: await res.json() };
    } catch (err) {
      if (attempt === 4) throw err;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

/** Counts dashes per top-level field of one document. */
function countByField(doc) {
  const byField = new Map();
  const visit = (value, field) => {
    if (typeof value === "string") {
      const n = (value.match(DASH) ?? []).length;
      if (n > 0) byField.set(field, (byField.get(field) ?? 0) + n);
    } else if (Array.isArray(value)) {
      for (const v of value) visit(v, field);
    } else if (value && typeof value === "object") {
      for (const v of Object.values(value)) visit(v, field);
    }
  };
  for (const [k, v] of Object.entries(doc)) visit(v, k);
  return byField;
}

const label = (doc) => doc.slug ?? doc.title ?? doc.name ?? String(doc.id ?? "");

async function scanCollection(slug) {
  const docs = [];
  for (let page = 1; ; page++) {
    const r = await getJson(`${slug}?limit=100&depth=0&page=${page}`);
    if (r.status !== 200) return page === 1 ? { skipped: r.status } : { docs };
    docs.push(...r.json.docs);
    if (!r.json.hasNextPage) return { docs };
  }
}

async function main() {
  const rows = [];
  const summary = [];
  const skipped = [];
  for (const slug of COLLECTIONS) {
    const r = await scanCollection(slug);
    if (r.skipped) {
      skipped.push(`${slug} (HTTP ${r.skipped})`);
      continue;
    }
    let affected = 0;
    let total = 0;
    for (const doc of r.docs) {
      const byField = countByField(doc);
      const n = [...byField.values()].reduce((a, b) => a + b, 0);
      if (n === 0) continue;
      affected++;
      total += n;
      const fields = [...byField].sort((a, b) => b[1] - a[1]).map(([f, c]) => `${f} (${c})`).join(", ");
      rows.push({ collection: slug, slug: label(doc), id: doc.id, count: n, fields });
    }
    summary.push({ slug, docs: r.docs.length, affected, total });
  }
  for (const slug of GLOBALS) {
    const r = await getJson(`globals/${slug}`);
    if (r.status !== 200) {
      skipped.push(`global ${slug} (HTTP ${r.status})`);
      continue;
    }
    const byField = countByField(r.json);
    const n = [...byField.values()].reduce((a, b) => a + b, 0);
    summary.push({ slug: `global:${slug}`, docs: 1, affected: n > 0 ? 1 : 0, total: n });
    if (n > 0) {
      const fields = [...byField].map(([f, c]) => `${f} (${c})`).join(", ");
      rows.push({ collection: `global:${slug}`, slug, id: "", count: n, fields });
    }
  }

  rows.sort((a, b) => a.collection.localeCompare(b.collection) || b.count - a.count);
  const grand = summary.reduce((a, s) => a + s.total, 0);
  const affectedDocs = summary.reduce((a, s) => a + s.affected, 0);
  const cell = (s) => String(s).replace(/\|/g, "\\|");

  const out = [
    "# CMS documents containing em-dashes or en-dashes",
    "",
    `Generated ${new Date().toISOString().slice(0, 10)} from ${CMS} by \`apps/web/scripts/cms-dash-report.mjs\` (published documents only).`,
    "",
    `**${affectedDocs} documents, ${grand} dash characters.** Editors: replace each with a comma, colon, full stop or brackets, and write number ranges as "5 to 10". Fix these in the CMS admin; do not edit production data from code.`,
    "",
    "## By collection",
    "",
    "| Collection | Documents | With dashes | Dash characters |",
    "| --- | ---: | ---: | ---: |",
    ...summary.filter((s) => s.affected > 0).map((s) => `| ${s.slug} | ${s.docs} | ${s.affected} | ${s.total} |`),
    "",
    "## By document",
    "",
    "| Collection | Slug | ID | Count | Fields |",
    "| --- | --- | ---: | ---: | --- |",
    ...rows.map((r) => `| ${r.collection} | ${cell(r.slug)} | ${r.id} | ${r.count} | ${cell(r.fields)} |`),
    "",
    "## Not scanned",
    "",
    skipped.length ? skipped.map((s) => `- ${s}`).join("\n") : "None.",
    "",
  ].join("\n");

  if (process.argv[2]) writeFileSync(process.argv[2], out);
  else process.stdout.write(out);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
