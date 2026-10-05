'use client';

import { useDocumentInfo, useField } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

type Kind = 'resource' | 'image';

export interface Suggestion {
  available: boolean;
  resource: { title: string; typeLabel: string; slug: string } | null;
  image: { name: string } | null;
}

const UNAVAILABLE: Suggestion = { available: false, resource: null, image: null };

/**
 * One request serves both fields (resource and image) on the same document,
 * and a re-render or a second mount inside the window reuses it.
 */
const CACHE_MS = 20_000;
const inflight = new Map<string, { at: number; promise: Promise<Suggestion> }>();

const loadSuggestion = (id: string, version: string): Promise<Suggestion> => {
  const key = `${id}:${version}`;
  const hit = inflight.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.promise;

  const promise = fetch(`/api/blog-cta-suggestion?id=${encodeURIComponent(id)}`, {
    credentials: 'include',
  })
    .then(async (res): Promise<Suggestion> => {
      if (!res.ok) return UNAVAILABLE;
      const body = (await res.json()) as Partial<Suggestion> & { available?: boolean };
      if (body.available !== true) return UNAVAILABLE;
      return { available: true, resource: body.resource ?? null, image: body.image ?? null };
    })
    .catch(() => UNAVAILABLE);
  inflight.set(key, { at: Date.now(), promise });
  return promise;
};

export const hasValue = (value: unknown): boolean =>
  value != null && (typeof value !== 'string' || value.trim() !== '');

const noteStyle = {
  display: 'block',
  marginTop: '-0.25rem',
  marginBottom: '1.25rem',
  fontSize: '0.8125rem',
  lineHeight: 1.5,
  color: 'var(--theme-text-soft, var(--theme-elevation-600))',
} as const;

export type AutoPickState =
  | { phase: 'unsaved' }
  | { phase: 'loading' }
  | { phase: 'ready'; suggestion: Suggestion };

/** The note itself, with no hooks, so it can be rendered and tested on its own. */
export const AutoPickNote = ({
  kind,
  state,
  overridden,
}: {
  kind: Kind;
  state: AutoPickState;
  overridden: boolean;
}): ReactElement => {
  if (state.phase === 'unsaved') {
    return <output style={noteStyle}>Save the post to see which one the page picks automatically.</output>;
  }
  if (state.phase === 'loading') return <output style={noteStyle}>Checking the automatic pick…</output>;

  const { suggestion } = state;
  if (!suggestion.available) {
    return <output style={noteStyle}>The automatic pick could not be loaded just now.</output>;
  }

  const picked =
    kind === 'resource' ? (
      suggestion.resource ? (
        <>
          <strong>{suggestion.resource.title}</strong> ({suggestion.resource.typeLabel})
        </>
      ) : (
        <>none, because no published resource matches</>
      )
    ) : suggestion.image ? (
      <>
        <code>{suggestion.image.name}</code> (images portal)
      </>
    ) : (
      <>none, so the page links to the whole images portal</>
    );

  return (
    <output style={noteStyle}>
      {overridden ? (
        <>Your pick overrides the automatic one, which would be {picked}.</>
      ) : (
        <>Showing the automatic pick: {picked}. Choose one above to override it.</>
      )}
    </output>
  );
};

/**
 * Read-only line under the Sidebar resource and Images portal entry fields: which
 * one the blog page picks by itself. Without it a blank field looks like
 * nothing is configured. Mounted as a UI field right after each override.
 *
 * The match is made by apps/web (it owns the scoring), reached through the
 * CMS endpoint so the shared secret never reaches the browser.
 */
export const BlogCtaAutoPick = ({ kind }: { kind: Kind }): ReactElement => {
  const { id, savedDocumentData } = useDocumentInfo();
  const { value } = useField<unknown>({ path: kind === 'resource' ? 'ctaResource' : 'ctaImage' });
  const version = (savedDocumentData as { updatedAt?: string } | undefined)?.updatedAt ?? '';

  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  useEffect(() => {
    if (id == null) return;
    let cancelled = false;
    setSuggestion(null);
    loadSuggestion(String(id), version).then((s) => {
      if (!cancelled) setSuggestion(s);
    });
    return () => {
      cancelled = true;
    };
  }, [id, version]);

  const state: AutoPickState =
    id == null ? { phase: 'unsaved' } : suggestion === null ? { phase: 'loading' } : { phase: 'ready', suggestion };

  return <AutoPickNote kind={kind} state={state} overridden={hasValue(value)} />;
};
