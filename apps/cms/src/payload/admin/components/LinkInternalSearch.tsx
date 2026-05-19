'use client';

import { useEffect, useRef, useState } from 'react';

type DocPick = {
  collection: string;
  id: string;
  kind: 'doc';
  label: string;
  slug: string | null;
  title: string;
};

type PathPick = {
  kind: 'path';
  url: string;
};

type ExternalPick = {
  kind: 'external';
  url: string;
};

export type InternalPick = DocPick | ExternalPick | PathPick;

// Backwards-compat alias for older imports.
export type InternalDocPick = DocPick;

const looksLikePath = (raw: string): boolean => {
  if (!raw) return false;
  const trimmed = raw.trim();
  if (!trimmed) return false;
  return (
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('?')
  );
};

// "Internal" hostnames are matched in three layers:
//   1. The admin's own host (covers production + any same-origin paste).
//   2. The admin's registrable parent (cms.cleanstart.com → cleanstart.com),
//      so a URL pasted from the live site resolves automatically.
//   3. An explicit allowlist driven by `NEXT_PUBLIC_SITE_HOSTS` (comma
//      separated). Required in local dev because `localhost` has no
//      parent domain to share with the production site.
const SITE_HOSTS_FALLBACK = ['cleanstart.com'];

const SITE_HOSTS: readonly string[] = (() => {
  const raw = process.env.NEXT_PUBLIC_SITE_HOSTS;
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return SITE_HOSTS_FALLBACK;
  }
  return raw
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
})();

const isInternalHost = (urlHost: string): boolean => {
  const host = urlHost.toLowerCase();
  if (typeof window !== 'undefined') {
    const adminHost = window.location.hostname.toLowerCase();
    if (host === adminHost) return true;
    const parts = adminHost.split('.');
    if (parts.length >= 2) {
      const root = parts.slice(-2).join('.');
      if (host === root || host.endsWith(`.${root}`)) return true;
    }
  }
  for (const allowed of SITE_HOSTS) {
    if (host === allowed || host.endsWith(`.${allowed}`)) return true;
  }
  return false;
};

const classifyUrl = (
  raw: string,
): { kind: 'external'; url: string } | { kind: 'path'; url: string } | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  if (isInternalHost(parsed.host)) {
    const pathStr = `${parsed.pathname}${parsed.search}${parsed.hash}` || '/';
    return { kind: 'path', url: pathStr };
  }
  return { kind: 'external', url: trimmed };
};

type CollectionConfig = {
  label: string;
  slug: string;
  titleField: string;
};

const COLLECTIONS: readonly CollectionConfig[] = [
  { label: 'Page', slug: 'pages', titleField: 'title' },
  { label: 'Blog', slug: 'blogs', titleField: 'title' },
  { label: 'News', slug: 'news', titleField: 'title' },
  { label: 'Resource', slug: 'resources', titleField: 'title' },
  { label: 'Knowledge Base', slug: 'knowledgeBase', titleField: 'title' },
  { label: 'Event', slug: 'events', titleField: 'title' },
  { label: 'Webinar', slug: 'webinars', titleField: 'title' },
  { label: 'Guide', slug: 'guides', titleField: 'title' },
  { label: 'Job', slug: 'jobs', titleField: 'title' },
  { label: 'Author', slug: 'authors', titleField: 'name' },
];

const PER_COLLECTION_LIMIT = 3;
const DEBOUNCE_MS = 200;

const fetchCollection = async (
  config: CollectionConfig,
  query: string,
  signal: AbortSignal,
): Promise<DocPick[]> => {
  const url = new URL(`/api/${config.slug}`, window.location.origin);
  url.searchParams.set(`where[${config.titleField}][like]`, query);
  url.searchParams.set('limit', String(PER_COLLECTION_LIMIT));
  url.searchParams.set('depth', '0');
  const response = await fetch(url.toString(), {
    credentials: 'include',
    signal,
  });
  if (!response.ok) return [];
  const json = (await response.json()) as {
    docs?: Array<Record<string, unknown>>;
  };
  return (json.docs ?? []).map((doc) => ({
    collection: config.slug,
    id: String(doc.id),
    kind: 'doc' as const,
    label: config.label,
    slug: typeof doc.slug === 'string' ? (doc.slug as string) : null,
    title:
      typeof doc[config.titleField] === 'string'
        ? (doc[config.titleField] as string)
        : `(untitled ${config.slug})`,
  }));
};

type Props = {
  initialDisplay?: string | undefined;
  onSelect: (pick: InternalPick) => void;
  selectedDisplay?: string | undefined;
};

export function LinkInternalSearch({
  initialDisplay = '',
  onSelect,
  selectedDisplay,
}: Props): React.ReactElement {
  const [query, setQuery] = useState(initialDisplay);
  const [results, setResults] = useState<DocPick[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Track the prop value the user-visible query was last seeded from.
  // When the parent resolves a doc title async (edit mode) and changes
  // `initialDisplay` from `news/1` to `News: <Title>`, we sync the
  // input — but only if the editor hasn't started typing.
  const lastSeed = useRef(initialDisplay);
  useEffect(() => {
    if (initialDisplay === lastSeed.current) return;
    if (query === lastSeed.current) {
      setQuery(initialDisplay);
    }
    lastSeed.current = initialDisplay;
  }, [initialDisplay, query]);
  // Stash the latest onSelect so the synthetic-pick auto-commit
  // effect can call it without re-running on every parent render.
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    // Path entries (`/about-us`, `#section`) and pasted URLs resolve
    // immediately — no API search needed. We also auto-commit them up
    // to the popover so "Add link" works on first click without the
    // editor having to reach into the dropdown.
    if (looksLikePath(trimmed)) {
      setResults([]);
      setLoading(false);
      onSelectRef.current({ kind: 'path', url: trimmed });
      return;
    }
    const classified = classifyUrl(trimmed);
    if (classified) {
      setResults([]);
      setLoading(false);
      onSelectRef.current(classified);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      Promise.all(
        COLLECTIONS.map((config) =>
          fetchCollection(config, trimmed, controller.signal).catch(
            () => [] as DocPick[],
          ),
        ),
      )
        .then((batches) => {
          if (controller.signal.aborted) return;
          setResults(batches.flat());
          setHighlight(0);
          setLoading(false);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setResults([]);
          setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const trimmedQuery = query.trim();
  // Two synthetic top-results possible:
  //   - explicit path/anchor (`/about-us`, `#sec`)
  //   - pasted URL → classified as same-domain path or external
  const explicitPath: PathPick | null = looksLikePath(trimmedQuery)
    ? { kind: 'path', url: trimmedQuery }
    : null;
  const classified: ExternalPick | PathPick | null = explicitPath
    ? null
    : classifyUrl(trimmedQuery);
  const syntheticPick: ExternalPick | PathPick | null =
    explicitPath ?? classified;
  const visibleItems: InternalPick[] = syntheticPick
    ? [syntheticPick]
    : results;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (!open || visibleItems.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((prev) => (prev + 1) % visibleItems.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight(
        (prev) => (prev - 1 + visibleItems.length) % visibleItems.length,
      );
    } else if (event.key === 'Enter') {
      const pick = visibleItems[highlight];
      if (pick) {
        event.preventDefault();
        commit(pick);
      }
    }
  };

  const commit = (pick: InternalPick): void => {
    if (pick.kind === 'doc') {
      setQuery(`${pick.label}: ${pick.title}`);
    } else {
      setQuery(pick.url);
    }
    setOpen(false);
    onSelect(pick);
  };

  const renderSyntheticLabel = (
    pick: ExternalPick | PathPick,
  ): { kind: string; title: string } => {
    if (pick.kind === 'path') return { kind: 'Path', title: pick.url };
    return { kind: 'External', title: pick.url };
  };

  const showResults = open && trimmedQuery.length >= 1;

  return (
    <div className="cs-link-popover__search">
      <input
        className="cs-link-popover__input"
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={
          selectedDisplay
            ? `Selected: ${selectedDisplay}`
            : 'Search content, or type a path like /about-us'
        }
        ref={inputRef}
        type="text"
        value={query}
      />
      {showResults ? (
        <div className="cs-link-popover__results">
          {syntheticPick ? (() => {
            const display = renderSyntheticLabel(syntheticPick);
            return (
              <button
                aria-current={highlight === 0}
                className={`cs-link-popover__result${
                  highlight === 0 ? ' cs-link-popover__result--active' : ''
                }`}
                key={`synthetic-${syntheticPick.kind}-${syntheticPick.url}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  commit(syntheticPick);
                }}
                onMouseEnter={() => setHighlight(0)}
                type="button"
              >
                <span className="cs-link-popover__result-kind">
                  {display.kind}
                </span>
                <span className="cs-link-popover__result-title">
                  {display.title}
                </span>
              </button>
            );
          })() : loading ? (
            <div className="cs-link-popover__results-empty">Searching…</div>
          ) : results.length === 0 ? (
            <div className="cs-link-popover__results-empty">
              No matches — paste a URL or start with <code>/</code>
            </div>
          ) : (
            results.map((pick, index) => (
              <button
                aria-current={index === highlight}
                className={`cs-link-popover__result${
                  index === highlight ? ' cs-link-popover__result--active' : ''
                }`}
                key={`${pick.collection}-${pick.id}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  commit(pick);
                }}
                onMouseEnter={() => setHighlight(index)}
                type="button"
              >
                <span className="cs-link-popover__result-kind">
                  {pick.label}
                </span>
                <span className="cs-link-popover__result-title">
                  {pick.title}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
