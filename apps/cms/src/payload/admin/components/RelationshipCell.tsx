'use client';

import type { ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';

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

const cache = new Map<string, { title: string; sub?: string }>();

/**
 * Pull a "best-effort title" out of an unknown doc shape — checks
 * `title`, `name`, `filename` (for media), then falls back to the id.
 */
const pickTitle = (doc: Record<string, unknown> | null, id: string): { title: string; sub?: string } => {
  if (!doc) return { title: id, sub: 'missing' };
  for (const key of ['title', 'name', 'filename', 'label', 'question']) {
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

const fetchDoc = async (
  collection: string,
  id: string,
): Promise<Record<string, unknown> | null> => {
  try {
    const res = await fetch(`/api/${collection}/${id}?depth=0`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as Record<string, unknown>;
    return json;
  } catch {
    return null;
  }
};

/**
 * List-view relationship cell. Resolves the related doc's `useAsTitle`
 * (with smart fallbacks) instead of showing an opaque ID. Caches
 * resolved titles in-process so a list page with many rows pointing at
 * the same author / category fetches each ID once.
 */
export const RelationshipCell = (props: RelationshipCellProps): ReactElement => {
  const items = useMemo(() => {
    const raw = props.cellData;
    const list = Array.isArray(raw) ? raw : raw == null ? [] : [raw];
    return list.map(normalizeOne).filter((e): e is { id: string; collection?: string } => e != null);
  }, [props.cellData]);

  const [resolved, setResolved] = useState<Record<string, { title: string; sub?: string } | null>>({});

  useEffect(() => {
    if (items.length === 0) return undefined;
    let cancelled = false;
    const work = async (): Promise<void> => {
      const out: Record<string, { title: string; sub?: string } | null> = {};
      await Promise.all(
        items.map(async (entry) => {
          const collection = entry.collection ?? props.collectionSlug;
          if (!collection) {
            out[entry.id] = { title: entry.id, sub: 'unknown collection' };
            return;
          }
          const key = `${collection}:${entry.id}`;
          const hit = cache.get(key);
          if (hit) {
            out[entry.id] = hit;
            return;
          }
          const doc = await fetchDoc(collection, entry.id);
          const picked = pickTitle(doc, entry.id);
          cache.set(key, picked);
          out[entry.id] = picked;
        }),
      );
      if (!cancelled) setResolved(out);
    };
    void work();
    return () => {
      cancelled = true;
    };
  }, [items, props.collectionSlug]);

  if (items.length === 0) {
    return <span className="cs-relationship-cell cs-relationship-cell__missing">—</span>;
  }

  const displayed = items.slice(0, 3);
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
