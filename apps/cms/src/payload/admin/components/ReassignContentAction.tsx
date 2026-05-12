'use client';

import { useConfig } from '@payloadcms/ui';
import type { ReactElement, ChangeEvent } from 'react';
import { useState, useCallback } from 'react';

import { Dialog, DialogHeader, DialogBody, DialogFooter } from '@cleanstart/ui';

interface AuthorOption {
  id: number;
  name: string;
}

/**
 * Admin action for bulk-reassigning content from one author to another.
 * Mounted via editMenuItems on the Users edit view.
 *
 * Opens a dialog with two author pickers (from / to), then POSTs to
 * /api/users/reassign-content. The "from" author is pre-selected from
 * the authors list (admin chooses which author doc belongs to this user).
 */
export const ReassignContentAction = (): ReactElement | null => {
  const { config } = useConfig();
  const [open, setOpen] = useState(false);
  const [authors, setAuthors] = useState<AuthorOption[]>([]);
  const [fromId, setFromId] = useState<number | null>(null);
  const [toId, setToId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ totalUpdated: number; perCollection: Record<string, number> } | null>(null);

  const loadAuthors = useCallback(async () => {
    const serverURL = config?.serverURL ?? '';
    try {
      const res = await fetch(`${serverURL}/api/authors?limit=200&sort=name`, {
        credentials: 'include',
      });
      if (!res.ok) return;
      const body = (await res.json()) as { docs: { id: number; name: string }[] };
      setAuthors(body.docs.map((d) => ({ id: d.id, name: d.name })));
    } catch {
      // Silent — authors list is best-effort.
    }
  }, [config]);

  const handleOpen = useCallback(() => {
    setOpen(true);
    setResult(null);
    setFromId(null);
    setToId(null);
    void loadAuthors();
  }, [loadAuthors]);

  const handleReassign = useCallback(async () => {
    if (fromId == null || toId == null) return;
    setBusy(true);
    try {
      const serverURL = config?.serverURL ?? '';
      const res = await fetch(`${serverURL}/api/users/reassign-content`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fromAuthorId: fromId, toAuthorId: toId }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        error?: string;
        totalUpdated?: number;
        perCollection?: Record<string, number>;
      };
      if (!body.ok) {
        alert(`Reassignment failed: ${body.error ?? 'unknown error'}`);
        return;
      }
      setResult({ totalUpdated: body.totalUpdated ?? 0, perCollection: body.perCollection ?? {} });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setBusy(false);
    }
  }, [fromId, toId, config]);

  return (
    <>
      <button type="button" onClick={handleOpen}>
        Reassign content
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} ariaLabel="Reassign author content">
        <DialogHeader title="Reassign author content" onClose={() => setOpen(false)} />
        <DialogBody>
          {result ? (
            <div>
              <p style={{ marginBottom: '0.75rem' }}>
                <strong>{result.totalUpdated}</strong> document{result.totalUpdated !== 1 ? 's' : ''} updated.
              </p>
              {Object.entries(result.perCollection).length > 0 && (
                <ul style={{ margin: 0, padding: '0 0 0 1.25rem' }}>
                  {Object.entries(result.perCollection).map(([col, count]) => (
                    <li key={col}>{col}: {count}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span>From author (being offboarded)</span>
                <select
                  value={fromId ?? ''}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setFromId(e.target.value ? Number(e.target.value) : null)
                  }
                  style={{ padding: '0.375rem 0.5rem' }}
                >
                  <option value="">Select author…</option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span>To author (replacement)</span>
                <select
                  value={toId ?? ''}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setToId(e.target.value ? Number(e.target.value) : null)
                  }
                  style={{ padding: '0.375rem 0.5rem' }}
                >
                  <option value="">Select author…</option>
                  {authors
                    .filter((a) => a.id !== fromId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
              </label>
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          {result ? (
            <button type="button" onClick={() => setOpen(false)}>Close</button>
          ) : (
            <>
              <button type="button" onClick={() => setOpen(false)}>Cancel</button>
              <button
                type="button"
                onClick={() => void handleReassign()}
                disabled={fromId == null || toId == null || busy}
              >
                {busy ? 'Reassigning…' : 'Reassign content'}
              </button>
            </>
          )}
        </DialogFooter>
      </Dialog>
    </>
  );
};

export default ReassignContentAction;
