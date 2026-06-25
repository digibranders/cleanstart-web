'use client';

import { useAuth, useConfig } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useCallback, useState } from 'react';

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
 * /admin/cache — admin-only page for site-wide and ad-hoc ISR cache purges.
 * Both controls call the same-origin /api/cache-purge endpoint (cookie-authed);
 * per-document purges live on each content doc's edit sidebar instead.
 */
export const CacheView = (): ReactElement => {
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

  if (!isAdmin(user)) {
    return (
      <main className="cs-cache" style={{ padding: '1.5rem' }}>
        <p>Admins only.</p>
      </main>
    );
  }

  return (
    <main className="cs-cache" style={{ padding: '1.5rem', maxWidth: 760 }}>
      <h1>Cache</h1>

      <section style={{ marginTop: '1.5rem' }}>
        <h2>Purge entire site</h2>
        <p>Re-renders every page on its next request (billed ISR writes). Use sparingly.</p>
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
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Custom purge</h2>
        <label htmlFor="cs-purge-paths">Paths (one per line, must start with /)</label>
        <textarea
          id="cs-purge-paths"
          value={customPaths}
          onChange={(e) => setCustomPaths(e.target.value)}
          rows={4}
          style={{ width: '100%' }}
        />
        <label htmlFor="cs-purge-tags">Cache tags (comma-separated, optional)</label>
        <input
          id="cs-purge-tags"
          value={customTags}
          onChange={(e) => setCustomTags(e.target.value)}
          style={{ width: '100%' }}
        />
        <button
          type="button"
          className="cs-btn cs-btn--subtle"
          disabled={busy}
          style={{ marginTop: '0.75rem' }}
          onClick={() => {
            const paths = customPaths.split('\n').map((p) => p.trim()).filter(Boolean);
            const tags = customTags.split(',').map((t) => t.trim()).filter(Boolean);
            void post({ scope: 'custom', paths, tags });
          }}
        >
          Purge paths/tags
        </button>
      </section>
    </main>
  );
};

export default CacheView;
