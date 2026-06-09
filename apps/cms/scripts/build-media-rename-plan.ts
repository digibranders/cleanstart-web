#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Build the document-derived Media rename plan (LOCAL — dev machine only).
 *
 * Joins three prod-derived inputs to compute a clean, collision-free new
 * name + alt for every Webflow-id-prefixed media file:
 *   - INVENTORY (media-inventory.json) — which document/role each media is
 *     attached to (drives `<doc-slug>[-<role>]` naming + title alt).
 *   - MEDIA LIST (all-media.tsv) — every media's current filename, ext,
 *     content-hash and current alt.
 *   - JOURNAL (.asset-progress.json) — original Webflow URL per asset id,
 *     used to recover a decoded name for ORPHAN media (no document).
 *
 * Output: scripts/data/media-rename-plan.json — the small, self-contained
 * artifact shipped to prod alongside the executor. Each entry:
 *   { id, from, to, alt }   (alt = null → leave the existing alt as-is)
 *
 * Run from apps/cms:
 *   pnpm exec tsx scripts/build-media-rename-plan.ts \
 *     --inventory /tmp/media-inventory.json --media /tmp/all-media.tsv
 */
import fs from 'node:fs';
import path from 'node:path';

import { buildMediaFilename } from '../src/payload/lib/media-filename.ts';
import { slugify } from '../src/payload/lib/slugify.ts';
import {
  altLeaksVendorId,
  docDerivedAlt,
  docDerivedStem,
  extractContentHash,
  extractLeadingVendorId,
  humaniseSourceName,
  webflowHumanName,
} from '../src/payload/lib/webflow-import/clean-media-name.ts';

const arg = (flag: string, dflt: string): string => {
  const i = process.argv.indexOf(flag);
  const v = i >= 0 ? process.argv[i + 1] : undefined;
  return v ?? dflt;
};

const INVENTORY = arg('--inventory', '/tmp/media-inventory.json');
const MEDIA_TSV = arg('--media', '/tmp/all-media.tsv');
const JOURNAL = path.resolve(
  import.meta.dirname,
  '../../../migrations/webflow-export/.asset-progress.json',
);
const OUT = path.resolve(import.meta.dirname, 'data/media-rename-plan.json');
const EMPTY = Buffer.alloc(0);

// Priority for picking the primary document when one media is reused.
const COLLECTION_RANK: Record<string, number> = {
  blogs: 1, news: 2, guides: 3, resources: 4, events: 5, webinars: 6,
  caseStudies: 7, 'case-studies': 7, aboutGalleries: 8, authors: 9, categories: 10,
};
const ROLE_RANK: Record<string, number> = {
  heroImage: 1, coverImage: 2, image: 3, photo: 4, icon: 5, companyLogo: 6, asset: 7,
};

interface InvImage { role: string; id: number }
interface InvDoc { docId: number; title: string; slug: string | null; images: InvImage[] }
interface Primary { docSlug: string; docTitle: string; role: string; multiImage: boolean; rank: number }

const run = (): void => {
  const inventory = JSON.parse(fs.readFileSync(INVENTORY, 'utf-8')) as Record<string, InvDoc[]>;
  const journal = JSON.parse(fs.readFileSync(JOURNAL, 'utf-8')) as { webflowUrl: string; r2Key: string }[];

  // id -> source URL (for orphan name recovery), keyed by leading Webflow id.
  const idToUrl = new Map<string, string>();
  for (const rec of journal) {
    const base = rec.r2Key.split('/').filter(Boolean).pop() ?? '';
    const vid = extractLeadingVendorId(base);
    if (vid && !idToUrl.has(vid)) idToUrl.set(vid, rec.webflowUrl);
  }

  // mediaId -> primary document attachment (best collection+role wins).
  const primary = new Map<number, Primary>();
  for (const [collection, docs] of Object.entries(inventory)) {
    const cRank = COLLECTION_RANK[collection] ?? 99;
    for (const doc of docs) {
      const docSlug = (doc.slug && doc.slug.trim()) || slugify(doc.title);
      const multiImage = doc.images.length > 1;
      for (const im of doc.images) {
        const rank = cRank * 100 + (ROLE_RANK[im.role] ?? 50);
        const existing = primary.get(im.id);
        if (!existing || rank < existing.rank) {
          primary.set(im.id, { docSlug, docTitle: doc.title, role: im.role, multiImage, rank });
        }
      }
    }
  }

  const media = fs.readFileSync(MEDIA_TSV, 'utf-8').trim().split('\n').slice(1);
  const usedTo = new Set<string>();
  const entries: { id: number; from: string; to: string; alt: string | null; kind: string; note: string }[] = [];
  let skippedClean = 0;
  let noop = 0;

  for (const line of media) {
    const f = line.split('\t');
    if (f.length < 10) continue;
    const id = Number.parseInt(f[0] ?? '', 10);
    const filename = f[2] ?? '';
    const currentAlt = f[7] ?? '';
    if (!filename || !Number.isFinite(id)) continue;

    const dot = filename.lastIndexOf('.');
    const stem = dot > 0 ? filename.slice(0, dot) : filename;
    const ext = dot > 0 ? filename.slice(dot + 1) : 'webp';

    // Only touch Webflow-id-prefixed files; the 7 already-clean ones are left alone.
    if (!extractLeadingVendorId(filename)) {
      skippedClean += 1;
      continue;
    }
    const hash = extractContentHash(stem);
    if (!hash) {
      // No recoverable content hash — refuse to guess; flag for manual review.
      entries.push({ id, from: filename, to: filename, alt: null, kind: 'SKIP_NO_HASH', note: '' });
      continue;
    }

    const prim = primary.get(id);
    let slugSource: string;
    let altSource: string;
    let kind: string;
    let note: string;

    if (prim) {
      slugSource = docDerivedStem(prim.docSlug, prim.role, prim.multiImage);
      altSource = docDerivedAlt(prim.docTitle, prim.role);
      kind = 'doc';
      note = `${prim.docTitle} · ${prim.role}`;
    } else {
      const url = idToUrl.get(extractLeadingVendorId(filename) ?? '');
      const human = url ? webflowHumanName(url) : '';
      slugSource = human || stem; // last-ditch: keep current stem (still id-stripped by buildMediaFilename)
      altSource = humaniseSourceName(slugify(human || stem));
      kind = url ? 'orphan-source' : 'orphan-fallback';
      note = 'unused / no document';
    }

    let to = buildMediaFilename({ slugSource, bytes: EMPTY, ext, hashOverride: hash });

    // Collision guard: never assign a target already taken by another media.
    if (usedTo.has(to)) {
      const toStem = to.slice(0, to.lastIndexOf('.'));
      const toExt = to.slice(to.lastIndexOf('.'));
      for (let n = 2; ; n += 1) {
        const candidate = `${toStem}-${n}${toExt}`;
        if (!usedTo.has(candidate)) { to = candidate; break; }
        if (n > 99) break;
      }
    }
    usedTo.add(to);

    if (to === filename) {
      noop += 1;
      continue;
    }

    const alt = altLeaksVendorId(currentAlt) || currentAlt.trim().length === 0 ? altSource : null;
    entries.push({ id, from: filename, to, alt, kind, note });
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify({ count: entries.length, entries }, null, 2)}\n`);

  const byKind = entries.reduce<Record<string, number>>((a, e) => {
    a[e.kind] = (a[e.kind] ?? 0) + 1;
    return a;
  }, {});
  console.log(`Wrote ${OUT}`);
  console.log(`  ${entries.length} rename entries · ${skippedClean} already-clean · ${noop} no-op`);
  console.log(`  by kind: ${JSON.stringify(byKind)}`);
  const flagged = entries.filter((e) => e.kind.startsWith('SKIP'));
  if (flagged.length) console.log(`  ⚠ ${flagged.length} flagged for manual review (no content hash)`);
};

run();
