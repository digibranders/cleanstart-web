'use client';

import { useField, useDocumentInfo } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

type Direction = 'prev' | 'next';

interface TargetSummary {
  id: string;
  title: string;
  /** The id stored in the mirror field on the target. null = unset. */
  mirrorId: string | null;
}

/**
 * Sidebar warning card for the editorial Previous/Next pagination on Blogs.
 *
 * Reads `previousPost` and `nextPost` from the current document, fetches each
 * target via the public Payload REST API, and surfaces a yellow callout when
 * the target doesn't point back. Soft warning only — never blocks save, since
 * asymmetric links can be intentional (e.g. a hub post forking into multiple
 * journeys).
 *
 * Mounted as a UI field on the Blogs collection sidebar.
 */
export const JourneyMirrorWarning = (): ReactElement | null => {
  const { id: currentId } = useDocumentInfo();
  const { value: previousRaw } = useField<number | string | null>({ path: 'previousPost' });
  const { value: nextRaw } = useField<number | string | null>({ path: 'nextPost' });

  const previousId = normalizeId(previousRaw);
  const nextId = normalizeId(nextRaw);
  const selfId = currentId != null ? String(currentId) : null;

  const [prevTarget, setPrevTarget] = useState<TargetSummary | null>(null);
  const [nextTarget, setNextTarget] = useState<TargetSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!previousId) {
      setPrevTarget(null);
    } else {
      fetchTarget(previousId, 'next').then((t) => {
        if (!cancelled) setPrevTarget(t);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [previousId]);

  useEffect(() => {
    let cancelled = false;
    if (!nextId) {
      setNextTarget(null);
    } else {
      fetchTarget(nextId, 'prev').then((t) => {
        if (!cancelled) setNextTarget(t);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [nextId]);

  const issues: Array<{ direction: Direction; target: TargetSummary }> = [];
  if (selfId && prevTarget && prevTarget.mirrorId !== selfId) {
    issues.push({ direction: 'prev', target: prevTarget });
  }
  if (selfId && nextTarget && nextTarget.mirrorId !== selfId) {
    issues.push({ direction: 'next', target: nextTarget });
  }

  if (issues.length === 0) return null;

  return (
    <output
      style={{
        display: 'block',
        marginTop: '0.5rem',
        padding: '0.75rem 0.875rem',
        background: 'rgba(234, 179, 8, 0.10)',
        border: '1px solid rgba(234, 179, 8, 0.45)',
        borderRadius: '6px',
        fontSize: '0.8125rem',
        lineHeight: 1.45,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
        Journey link mirror missing
      </div>
      <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
        {issues.map(({ direction, target }) => (
          <li key={`${direction}-${target.id}`}>
            {direction === 'prev' ? 'Previous' : 'Next'} post{' '}
            <a
              href={`/admin/collections/blogs/${target.id}`}
              target="_blank"
              rel="noreferrer noopener"
              style={{ textDecoration: 'underline' }}
            >
              &ldquo;{target.title}&rdquo;
            </a>{' '}
            doesn&rsquo;t point back to this post as its{' '}
            {direction === 'prev' ? 'next' : 'previous'}.
          </li>
        ))}
      </ul>
    </output>
  );
};

function normalizeId(value: number | string | null | undefined): string | null {
  if (value == null) return null;
  const s = String(value);
  return s.length > 0 ? s : null;
}

async function fetchTarget(
  id: string,
  mirrorField: 'prev' | 'next',
): Promise<TargetSummary | null> {
  try {
    const res = await fetch(
      `/api/blogs/${encodeURIComponent(id)}?depth=0&select[title]=true&select[previousPost]=true&select[nextPost]=true`,
      { credentials: 'same-origin' },
    );
    if (!res.ok) return null;
    const doc = (await res.json()) as {
      id?: number | string;
      title?: string;
      previousPost?: number | string | null;
      nextPost?: number | string | null;
    };
    const mirrorRaw = mirrorField === 'prev' ? doc.previousPost : doc.nextPost;
    return {
      id: String(doc.id ?? id),
      title: doc.title ?? '(untitled)',
      mirrorId: normalizeId(mirrorRaw ?? null),
    };
  } catch {
    return null;
  }
}
