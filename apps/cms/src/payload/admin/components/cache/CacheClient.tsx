'use client';

import { useAuth, useConfig } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { showToast } from '../ToastBus';
import type { CacheSearchResult } from '../../../endpoints/cache-search';

interface PurgeResponse {
  ok: boolean;
  purged?: unknown;
  disabled?: boolean;
  error?: string;
}

interface SearchResponse {
  ok: boolean;
  results: (CacheSearchResult & { collectionLabel: string })[];
}

const isAdmin = (user: unknown): boolean =>
  Array.isArray((user as { roles?: unknown })?.roles) &&
  (user as { roles: string[] }).roles.includes('admin');

/**
 * Interactive body of /admin/cache — admin-only controls for site-wide and
 * ad-hoc ISR cache purges. Both controls call the same-origin
 * /api/cache-purge endpoint (cookie-authed); per-document purges live on each
 * content doc's edit sidebar instead.
 *
 * Server chrome (sidebar nav + header) is supplied by CacheView via
 * DefaultTemplate; this component owns only the page content.
 */
export const CacheClient = (): ReactElement => {
  const { user } = useAuth();
  const { config } = useConfig();
  const serverURL = config?.serverURL ?? '';
  const [busy, setBusy] = useState(false);

  // ── Page search state ──────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(CacheSearchResult & { collectionLabel: string })[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPages, setSelectedPages] = useState<(CacheSearchResult & { collectionLabel: string })[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Manual paths / tags state ──────────────────────────────────────────────
  const [customPaths, setCustomPaths] = useState('');
  const [customTags, setCustomTags] = useState('');

  const post = useCallback(
    async (payload: Record<string, unknown>) => {
      setBusy(true);
      try {
        const res = await fetch(`${serverURL}/api/cache-purge`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const body = (await res.json()) as PurgeResponse;
        if (!res.ok || !body.ok) {
          showToast({ message: `Purge failed: ${body.error ?? `HTTP ${res.status}`}`, type: 'error' });
        } else if (body.disabled) {
          showToast({ message: 'Cache purge is disabled in this environment.', type: 'warning' });
        } else {
          showToast({ message: 'Cache purge requested.', type: 'success' });
        }
      } catch (err) {
        showToast({ message: err instanceof Error ? err.message : 'Network error', type: 'error' });
      } finally {
        setBusy(false);
      }
    },
    [serverURL],
  );

  // Live search — debounced 300 ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `${serverURL}/api/cache-search?q=${encodeURIComponent(searchQuery.trim())}`,
          { credentials: 'include' },
        );
        const data = (await res.json()) as SearchResponse;
        setSearchResults(data.results ?? []);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, serverURL]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addPage = useCallback((result: (CacheSearchResult & { collectionLabel: string })) => {
    setSelectedPages((prev) => {
      if (prev.some((p) => p.path === result.path)) return prev;
      return [...prev, result];
    });
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  }, []);

  const removePage = useCallback((path: string) => {
    setSelectedPages((prev) => prev.filter((p) => p.path !== path));
  }, []);

  const selectedDisabled = busy || selectedPages.length === 0;

  const parsedPaths = useMemo(
    () => customPaths.split('\n').map((p) => p.trim()).filter(Boolean),
    [customPaths],
  );
  const parsedTags = useMemo(
    () => customTags.split(',').map((t) => t.trim()).filter(Boolean),
    [customTags],
  );
  const customDisabled = busy || (parsedPaths.length === 0 && parsedTags.length === 0);
  const invalidPaths = parsedPaths.filter((p) => !p.startsWith('/'));

  if (!isAdmin(user)) {
    return (
      <div className="cs-cache__denied" role="alert">
        <h2 className="cs-cache__denied-title">Admins only</h2>
        <p className="cs-cache__denied-body">
          You don&rsquo;t have permission to manage the site cache. Contact an administrator
          if you need access.
        </p>
      </div>
    );
  }

  return (
    <>
      <header className="cs-dashboard__header">
        <h1 className="cs-dashboard__title">Cache</h1>
        <p className="cs-dashboard__subtitle">
          Purge the marketing site&rsquo;s ISR cache. Changes published through the CMS
          revalidate automatically — use these controls only to force a refresh.
        </p>
      </header>

      {/* ── Danger zone: full-site purge ── */}
      <section className="cs-cache__card cs-cache__card--danger" aria-labelledby="cs-cache-all-title">
        <div className="cs-cache__card-head">
          <span className="cs-cache__badge cs-cache__badge--danger">Danger zone</span>
          <h2 className="cs-cache__card-title" id="cs-cache-all-title">
            Purge entire site
          </h2>
          <p className="cs-cache__card-desc">
            Re-renders every page on its next request, billing one ISR write per page.
            Use sparingly — prefer a targeted purge below when you can.
          </p>
        </div>
        <div className="cs-cache__actions">
          <button
            type="button"
            className="cs-btn cs-btn--danger"
            disabled={busy}
            onClick={() => {
              if (window.confirm('Purge the ENTIRE site cache? This re-renders every page.')) {
                void post({ scope: 'all' });
              }
            }}
          >
            Purge entire site
          </button>
        </div>
      </section>

      {/* ── Page search purge ── */}
      <section className="cs-cache__card" aria-labelledby="cs-cache-search-title">
        <div className="cs-cache__card-head">
          <h2 className="cs-cache__card-title" id="cs-cache-search-title">
            Purge by page
          </h2>
          <p className="cs-cache__card-desc">
            Search for a blog post, article, guide, or any CMS-managed page and purge
            its cache instantly.
          </p>
        </div>

        <div className="cs-cache__field" ref={searchRef}>
          <label className="cs-cache__label" htmlFor="cs-cache-search-input">
            Search pages
          </label>
          <span className="cs-cache__hint">Type a title or slug to find a page.</span>
          <div className="cs-cache__search-wrap">
            <div className="cs-cache__search-icon" aria-hidden="true">
              {searchLoading ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="10" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <input
              ref={inputRef}
              id="cs-cache-search-input"
              className="cs-cache__search-input"
              type="search"
              autoComplete="off"
              spellCheck={false}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true);
              }}
              placeholder="e.g. container security, sbom-101"
            />
            {searchQuery.length > 0 && (
              <button
                type="button"
                className="cs-cache__search-clear"
                aria-label="Clear search"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowDropdown(false);
                  inputRef.current?.focus();
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          {/* Dropdown results */}
          {showDropdown && (
            <div className="cs-cache__search-dropdown" aria-label="Search results">
              {searchResults.length === 0 ? (
                <div className="cs-cache__search-empty">No pages found.</div>
              ) : (
                searchResults.map((result) => (
                  <button
                    key={result.path}
                    type="button"
                    aria-pressed={selectedPages.some((p) => p.path === result.path)}
                    className={[
                      'cs-cache__search-option',
                      selectedPages.some((p) => p.path === result.path)
                        ? 'cs-cache__search-option--selected'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => addPage(result)}
                  >
                    <span className="cs-cache__search-option-title">{result.title}</span>
                    <span className="cs-cache__search-option-meta">
                      <span className="cs-cache__search-option-tag">{result.collectionLabel}</span>
                      <span className="cs-cache__search-option-path">{result.path}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Selected pages chips */}
        {selectedPages.length > 0 && (
          <div className="cs-cache__chips" aria-label="Selected pages">
            {selectedPages.map((page) => (
              <span key={page.path} className="cs-cache__chip">
                <span className="cs-cache__chip-text" title={page.path}>
                  {page.title}
                </span>
                <button
                  type="button"
                  className="cs-cache__chip-remove"
                  aria-label={`Remove ${page.title}`}
                  onClick={() => removePage(page.path)}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="cs-cache__actions">
          <button
            type="button"
            className="cs-btn cs-btn--primary"
            disabled={selectedDisabled}
            onClick={() => {
              const paths = selectedPages.map((p) => p.path);
              void post({ scope: 'custom', paths });
              setSelectedPages([]);
            }}
          >
            {selectedPages.length > 0
              ? `Purge ${selectedPages.length} page${selectedPages.length === 1 ? '' : 's'}`
              : 'Purge selected pages'}
          </button>
        </div>
      </section>

      {/* ── Manual paths / tags ── */}
      <section className="cs-cache__card" aria-labelledby="cs-cache-custom-title">
        <div className="cs-cache__card-head">
          <h2 className="cs-cache__card-title" id="cs-cache-custom-title">
            Targeted purge
          </h2>
          <p className="cs-cache__card-desc">
            Revalidate specific paths or cache tags without touching the rest of the site.
            Enter URL paths (e.g. <code className="cs-cache__code">/blogs/my-post</code>)
            or Next.js cache tags.
          </p>
        </div>

        <div className="cs-cache__field">
          <label className="cs-cache__label" htmlFor="cs-purge-paths">
            Paths
          </label>
          <span className="cs-cache__hint">One per line — each must start with "/".</span>
          <textarea
            id="cs-purge-paths"
            className="cs-cache__textarea"
            value={customPaths}
            onChange={(e) => setCustomPaths(e.target.value)}
            rows={4}
            spellCheck={false}
            placeholder={'/blogs/sbom-101\n/knowledge-hub\n/pricing'}
          />
          {invalidPaths.length > 0 && (
            <span className="cs-cache__error" role="alert">
              {invalidPaths.length === 1 ? 'One path does' : `${invalidPaths.length} paths do`} not
              start with "/" and will be ignored.
            </span>
          )}
        </div>

        <div className="cs-cache__field">
          <label className="cs-cache__label" htmlFor="cs-purge-tags">
            Cache tags <span className="cs-cache__label-optional">optional</span>
          </label>
          <span className="cs-cache__hint">Comma-separated Next.js cache tag names.</span>
          <input
            id="cs-purge-tags"
            className="cs-cache__input"
            value={customTags}
            onChange={(e) => setCustomTags(e.target.value)}
            spellCheck={false}
            placeholder="blog, homepage"
          />
        </div>

        <div className="cs-cache__actions">
          <button
            type="button"
            className="cs-btn cs-btn--subtle"
            disabled={customDisabled}
            onClick={() => {
              void post({ scope: 'custom', paths: parsedPaths, tags: parsedTags });
            }}
          >
            Purge paths / tags
          </button>
        </div>
      </section>
    </>
  );
};

export default CacheClient;
