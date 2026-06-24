import { docPath, normalizePath } from './page-path';
import type { ContentDocRecord, ContentSnapshot } from './types';

export interface CmsDocInput {
  collection: string;
  id: string;
  slug: string;
  title: string;
  authorLabels: string[];
  categoryLabels: string[];
  publishedAt: string | null;
  updatedAt: string | null;
}

export interface Ga4Row {
  path: string;
  sessions: number;
  users?: number;
  conversions?: number;
}

export interface GscRow {
  path: string;
  clicks: number;
  impressions: number;
  position: number;
}

export interface BuildSnapshotInput {
  capturedAt: string;
  windows: ContentSnapshot['windows'];
  cmsDocs: CmsDocInput[];
  ga4Recent: Ga4Row[];
  ga4Prior: Ga4Row[];
  gsc: GscRow[];
}

const indexByPath = <T extends { path: string }>(rows: T[]): Map<string, T> => {
  const m = new Map<string, T>();
  for (const r of rows) m.set(normalizePath(r.path), r);
  return m;
};

export const buildSnapshot = (input: BuildSnapshotInput): ContentSnapshot => {
  const recent = indexByPath(input.ga4Recent);
  const prior = indexByPath(input.ga4Prior);
  const gsc = indexByPath(input.gsc);
  const docs: ContentDocRecord[] = [];
  for (const d of input.cmsDocs) {
    const url = docPath(d.collection, d.slug);
    if (!url) continue;
    const r = recent.get(url);
    const p = prior.get(url);
    const g = gsc.get(url);
    docs.push({
      collection: d.collection,
      id: d.id,
      slug: d.slug,
      title: d.title,
      url,
      authorLabels: d.authorLabels,
      categoryLabels: d.categoryLabels,
      publishedAt: d.publishedAt,
      updatedAt: d.updatedAt,
      sessionsRecent: r?.sessions ?? 0,
      sessionsPrior: p?.sessions ?? 0,
      usersRecent: r?.users ?? 0,
      conversionsRecent: r?.conversions ?? 0,
      clicks: g?.clicks ?? 0,
      impressions: g?.impressions ?? 0,
      position: g?.position ?? 0,
      indexedProxy: (g?.impressions ?? 0) > 0,
    });
  }
  return { capturedAt: input.capturedAt, windows: input.windows, docs };
};
