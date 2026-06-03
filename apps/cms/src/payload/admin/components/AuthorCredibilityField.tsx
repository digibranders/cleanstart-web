'use client';

import { useDocumentInfo } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

interface CountedCollection {
  readonly slug: string;
  readonly label: string;
  /** Relationship field that ties a doc to the author. */
  readonly relationField: string;
}

const ATTRIBUTED_COLLECTIONS: readonly CountedCollection[] = [
  { slug: 'blogs', label: 'blog post', relationField: 'authors' },
  { slug: 'news', label: 'news item', relationField: 'authors' },
  { slug: 'guides', label: 'guide', relationField: 'authors' },
  // KnowledgeBase has no `authors` byline — credibility comes from the
  // technical reviewer (`reviewedBy`), which also drives JSON-LD.
  { slug: 'knowledgeBase', label: 'KB article (reviewed)', relationField: 'reviewedBy' },
];

interface CountQueryResult {
  totalDocs?: number;
  docs?: { publishedAt?: string }[];
}

interface CredibilitySnapshot {
  totalPublished: number;
  lastPublishedAt: string | null;
}

const formatRelative = (iso: string): string => {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const diffMs = Date.now() - t;
  if (diffMs < 0) return 'in the future';
  const day = 24 * 60 * 60 * 1000;
  const days = Math.floor(diffMs / day);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  if (days < 365) return `${Math.round(days / 30)} months ago`;
  return `${Math.round(days / 365)} years ago`;
};

/**
 * Sidebar widget on the Author edit view. Shows a quick credibility
 * snapshot — total published items attributed to this author across
 * the byline-aware collections, plus the date of the most recent
 * publish. Reads via the existing REST surface; no new endpoint.
 */
export const AuthorCredibilityField = (): ReactElement | null => {
  const { id } = useDocumentInfo();
  const [snapshot, setSnapshot] = useState<CredibilitySnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id == null || id === 'create') {
      setSnapshot(null);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    const fetchAll = async (): Promise<void> => {
      try {
        const results = await Promise.all(
          ATTRIBUTED_COLLECTIONS.map(async (entry) => {
            const url = new URL(`/api/${entry.slug}`, window.location.origin);
            url.searchParams.set(`where[${entry.relationField}][in]`, String(id));
            url.searchParams.set('where[_status][equals]', 'published');
            url.searchParams.set('limit', '1');
            url.searchParams.set('depth', '0');
            url.searchParams.set('sort', '-publishedAt');
            url.searchParams.set('select[publishedAt]', 'true');
            const res = await fetch(url.toString(), { credentials: 'include' });
            if (!res.ok) return { totalDocs: 0, docs: [] };
            return (await res.json()) as CountQueryResult;
          }),
        );
        if (cancelled) return;
        let total = 0;
        let latest: string | null = null;
        for (const r of results) {
          total += r.totalDocs ?? 0;
          const candidate = r.docs?.[0]?.publishedAt;
          if (typeof candidate === 'string') {
            if (latest == null || new Date(candidate).getTime() > new Date(latest).getTime()) {
              latest = candidate;
            }
          }
        }
        setSnapshot({ totalPublished: total, lastPublishedAt: latest });
      } catch {
        if (!cancelled) setSnapshot({ totalPublished: 0, lastPublishedAt: null });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchAll();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (id == null || id === 'create') return null;

  const tone =
    snapshot && snapshot.totalPublished > 0 ? '#7ddc9c' : 'var(--theme-text-soft, #a4a7af)';

  return (
    <div className="field-type author-credibility-field" style={{ marginBottom: 'var(--cs-space-3, 12px)' }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--theme-text-soft, #a4a7af)',
          marginBottom: 4,
        }}
      >
        Credibility
      </div>
      {loading && !snapshot ? (
        <p style={{ fontSize: 12, margin: 0, color: 'var(--theme-text-disabled, #6b6e77)' }}>
          Loading…
        </p>
      ) : snapshot ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            padding: '8px 10px',
            background: 'var(--theme-elevation-50, #1c1d21)',
            border: '1px solid var(--theme-elevation-150, #2a2c33)',
            borderRadius: 6,
            fontSize: 12,
            color: 'var(--theme-text, #e8e9eb)',
          }}
        >
          <span style={{ color: tone, fontWeight: 600 }}>
            {snapshot.totalPublished} published
          </span>
          <span style={{ fontSize: 11, color: 'var(--theme-text-soft, #a4a7af)' }}>
            {snapshot.lastPublishedAt
              ? `Most recent: ${formatRelative(snapshot.lastPublishedAt)}`
              : 'No published bylines yet'}
          </span>
        </div>
      ) : null}
    </div>
  );
};
