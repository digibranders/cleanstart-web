'use client';

import type { ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { fetchRelatedDocs } from '../lib/related-docs';

type RelationshipValue =
  | string
  | number
  | { id?: string | number; relationTo?: string; value?: string | number | { id?: string | number } }
  | null
  | undefined;

type RelationshipCellProps = {
  cellData?: RelationshipValue | RelationshipValue[];
  /**
   * Hint for which collection to query. Required for polymorphic
   * relationships; optional for single-collection (defaults to inferring
   * from the relationship.value shape).
   */
  collectionSlug?: string;
};

/** Only these three ever render, so only these three get resolved — a
 *  `relatedPosts` column with twenty entries used to fetch all twenty to
 *  print the first three titles. */
const MAX_DISPLAYED = 3;

/**
 * Title-bearing fields across every collection a relationship can point
 * at, plus the id. Passed to Payload's `select` so the response carries
 * a title instead of a whole document — an unresolved `blogs` reference
 * used to ship its entire Lexical body to render one line of text.
 * Payload ignores names a given collection doesn't have.
 */
const TITLE_FIELDS = ['title', 'name', 'filename', 'label', 'question'] as const;

/**
 * Pull a "best-effort title" out of an unknown doc shape — checks
 * `title`, `name`, `filename` (for media), then falls back to the id.
 */
const pickTitle = (doc: Record<string, unknown> | null, id: string): { title: string; sub?: string } => {
  if (!doc) return { title: id, sub: 'missing' };
  for (const key of TITLE_FIELDS) {
    const v = doc[key];
    if (typeof v === 'string' && v.trim().length > 0) {
      return { title: v };
    }
  }
  return { title: id, sub: 'no title' };
};

const normalizeOne = (entry: RelationshipValue): { id: string; collection?: string } | null => {
  if (entry == null) return null;
  if (typeof entry === 'string' || typeof entry === 'number') {
    return { id: String(entry) };
  }
  if (typeof entry === 'object') {
    // Polymorphic: { relationTo, value }
    if ('relationTo' in entry && entry.relationTo) {
      const inner = entry.value;
      if (typeof inner === 'string' || typeof inner === 'number') {
        return { id: String(inner), collection: entry.relationTo };
      }
      if (inner && typeof inner === 'object' && 'id' in inner && inner.id != null) {
        return { id: String(inner.id), collection: entry.relationTo };
      }
    }
    if ('id' in entry && entry.id != null) {
      return { id: String(entry.id) };
    }
  }
  return null;
};

/**
 * List-view relationship cell. Resolves the related doc's `useAsTitle`
 * (with smart fallbacks) instead of showing an opaque ID.
 *
 * Resolution goes through `fetchRelatedDocs`, which coalesces every cell
 * mounted in the same commit into one request per collection. A 25-row
 * Blogs list resolves its authors and categories in two round-trips
 * instead of the ~75 it used to fire one-per-cell after hydration.
 */
export const RelationshipCell = (props: RelationshipCellProps): ReactElement => {
  const items = useMemo(() => {
    const raw = props.cellData;
    const list = Array.isArray(raw) ? raw : raw == null ? [] : [raw];
    return list.map(normalizeOne).filter((e): e is { id: string; collection?: string } => e != null);
  }, [props.cellData]);

  const displayed = useMemo(() => items.slice(0, MAX_DISPLAYED), [items]);

  const [resolved, setResolved] = useState<Record<string, { title: string; sub?: string } | null>>({});

  useEffect(() => {
    if (displayed.length === 0) return undefined;
    let cancelled = false;

    const byCollection = new Map<string, string[]>();
    const unknown: string[] = [];
    for (const entry of displayed) {
      const collection = entry.collection ?? props.collectionSlug;
      if (!collection) {
        unknown.push(entry.id);
        continue;
      }
      const ids = byCollection.get(collection);
      if (ids) ids.push(entry.id);
      else byCollection.set(collection, [entry.id]);
    }

    const work = async (): Promise<void> => {
      const out: Record<string, { title: string; sub?: string } | null> = {};
      for (const id of unknown) out[id] = { title: id, sub: 'unknown collection' };

      await Promise.all(
        Array.from(byCollection, async ([collection, ids]) => {
          const docs = await fetchRelatedDocs(collection, ids, {
            depth: 0,
            select: [...TITLE_FIELDS],
          });
          for (const id of ids) out[id] = pickTitle(docs.get(id) ?? null, id);
        }),
      );
      if (!cancelled) setResolved(out);
    };
    void work();
    return () => {
      cancelled = true;
    };
  }, [displayed, props.collectionSlug]);

  if (items.length === 0) {
    return <span className="cs-relationship-cell cs-relationship-cell__missing">—</span>;
  }

  const overflow = items.length - displayed.length;

  return (
    <span className="cs-relationship-cell">
      {displayed.map((entry, idx) => {
        const r = resolved[entry.id];
        return (
          <span key={`${entry.id}-${idx}`} title={`${entry.collection ?? props.collectionSlug ?? '?'}/${entry.id}`}>
            <span className="cs-relationship-cell__title">{r ? r.title : entry.id}</span>
            {r?.sub && <span className="cs-relationship-cell__sub"> · {r.sub}</span>}
            {idx < displayed.length - 1 && ', '}
          </span>
        );
      })}
      {overflow > 0 && (
        <span className="cs-relationship-cell__sub"> +{overflow} more</span>
      )}
    </span>
  );
};

export default RelationshipCell;
