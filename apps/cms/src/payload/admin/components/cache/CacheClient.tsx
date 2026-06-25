'use client';

import { useAuth, useConfig } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useCallback, useMemo, useState } from 'react';

import { showToast } from '../ToastBus';

interface PurgeResponse {
  ok: boolean;
  purged?: unknown;
  disabled?: boolean;
  error?: string;
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
          showToast({ message: 'Purge requested.', type: 'success' });
        }
      } catch (err) {
        showToast({ message: err instanceof Error ? err.message : 'Network error', type: 'error' });
      } finally {
        setBusy(false);
      }
    },
    [serverURL],
  );

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

      <section className="cs-cache__card" aria-labelledby="cs-cache-custom-title">
        <div className="cs-cache__card-head">
          <h2 className="cs-cache__card-title" id="cs-cache-custom-title">
            Targeted purge
          </h2>
          <p className="cs-cache__card-desc">
            Revalidate specific pages or cache tags without touching the rest of the site.
          </p>
        </div>

        <div className="cs-cache__field">
          <label className="cs-cache__label" htmlFor="cs-purge-paths">
            Paths
          </label>
          <span className="cs-cache__hint">One per line — each must start with “/”.</span>
          <textarea
            id="cs-purge-paths"
            className="cs-cache__textarea"
            value={customPaths}
            onChange={(e) => setCustomPaths(e.target.value)}
            rows={4}
            spellCheck={false}
            placeholder={'/blog\n/pricing'}
          />
          {invalidPaths.length > 0 && (
            <span className="cs-cache__error" role="alert">
              {invalidPaths.length === 1 ? 'One path does' : `${invalidPaths.length} paths do`} not
              start with “/” and will be ignored.
            </span>
          )}
        </div>

        <div className="cs-cache__field">
          <label className="cs-cache__label" htmlFor="cs-purge-tags">
            Cache tags <span className="cs-cache__label-optional">optional</span>
          </label>
          <span className="cs-cache__hint">Comma-separated.</span>
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
