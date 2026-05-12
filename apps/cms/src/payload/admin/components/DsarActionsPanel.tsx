'use client';

import { useConfig } from '@payloadcms/ui';
import type { ReactElement, ChangeEvent } from 'react';
import { useState, useCallback } from 'react';

import { Dialog, DialogHeader, DialogBody, DialogFooter, ConfirmDialog } from '@cleanstart/ui';

type LeadMatch = { id: number; createdAt: string; formId: number | string };

type FindResponse = { ok: boolean; error?: string; matches?: LeadMatch[]; count?: number };
type DeleteResponse = { ok: boolean; error?: string; deleted?: number };

/**
 * GDPR DSAR admin panel — "Find by email" and "Delete by email".
 * Mounted in the Leads list view via beforeListTable.
 *
 * Find by email: lists all lead IDs matching the email address in their
 * `fields` JSON. Useful for Art. 15 subject access requests.
 *
 * Delete by email: deletes all matching leads + writes dsar_erasure audit
 * log rows. Used for Art. 17 erasure requests.
 */
export const DsarActionsPanel = (): ReactElement => {
  const { config } = useConfig();

  const [findOpen, setFindOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [findResult, setFindResult] = useState<LeadMatch[] | null>(null);
  const [deleteResult, setDeleteResult] = useState<{ deleted: number } | null>(null);

  const serverURL = config?.serverURL ?? '';

  const handleFind = useCallback(async () => {
    if (!email.trim()) return;
    setBusy(true);
    setFindResult(null);
    try {
      const res = await fetch(
        `${serverURL}/api/leads/dsar/find?email=${encodeURIComponent(email.trim())}`,
        { credentials: 'include' },
      );
      const body = (await res.json()) as FindResponse;
      if (!body.ok) {
        alert(`Find failed: ${body.error ?? 'unknown error'}`);
        return;
      }
      setFindResult(body.matches ?? []);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setBusy(false);
    }
  }, [email, serverURL]);

  const handleDelete = useCallback(async () => {
    if (!email.trim()) return;
    setBusy(true);
    setDeleteResult(null);
    setConfirmDeleteOpen(false);
    try {
      const res = await fetch(`${serverURL}/api/leads/dsar/delete`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim() }),
      });
      const body = (await res.json()) as DeleteResponse;
      if (!body.ok) {
        alert(`Delete failed: ${body.error ?? 'unknown error'}`);
        return;
      }
      setDeleteResult({ deleted: body.deleted ?? 0 });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setBusy(false);
    }
  }, [email, serverURL]);

  const resetFind = useCallback(() => {
    setFindOpen(false);
    setEmail('');
    setFindResult(null);
  }, []);

  const resetDelete = useCallback(() => {
    setDeleteOpen(false);
    setEmail('');
    setDeleteResult(null);
  }, []);

  return (
    <div className="cs-dsar-panel">
      <button
        type="button"
        className="cs-btn cs-btn--subtle"
        onClick={() => { setFindOpen(true); setEmail(''); setFindResult(null); }}
      >
        DSAR: Find by email
      </button>
      <button
        type="button"
        className="cs-btn cs-btn--danger"
        onClick={() => { setDeleteOpen(true); setEmail(''); setDeleteResult(null); }}
      >
        DSAR: Delete by email
      </button>

      {/* Find dialog */}
      <Dialog open={findOpen} onClose={resetFind} ariaLabel="DSAR: find leads by email">
        <DialogHeader title="DSAR: Find leads by email" onClose={resetFind} />
        <DialogBody>
          {findResult ? (
            <div>
              <p style={{ marginBottom: '0.75rem' }}>
                Found <strong>{findResult.length}</strong> lead{findResult.length !== 1 ? 's' : ''}.
              </p>
              {findResult.length > 0 && (
                <ul style={{ margin: 0, padding: '0 0 0 1.25rem' }}>
                  {findResult.map((m) => (
                    <li key={m.id}>
                      ID {m.id} — form {m.formId} — {new Date(m.createdAt).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span className="cs-text-field__label">Email address</span>
              <input
                type="email"
                className="cs-text-field__input"
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="subject@example.com"
              />
            </label>
          )}
        </DialogBody>
        <DialogFooter>
          {findResult ? (
            <button type="button" className="cs-btn cs-btn--subtle" onClick={resetFind}>
              Close
            </button>
          ) : (
            <>
              <button type="button" className="cs-btn cs-btn--subtle" onClick={resetFind}>
                Cancel
              </button>
              <button
                type="button"
                className="cs-btn cs-btn--primary"
                onClick={() => void handleFind()}
                disabled={!email.trim() || busy}
              >
                {busy ? 'Searching…' : 'Find leads'}
              </button>
            </>
          )}
        </DialogFooter>
      </Dialog>

      {/* Delete flow — email entry dialog */}
      <Dialog open={deleteOpen && !confirmDeleteOpen} onClose={resetDelete} ariaLabel="DSAR: delete leads by email">
        <DialogHeader title="DSAR: Delete leads by email" onClose={resetDelete} />
        <DialogBody>
          {deleteResult ? (
            <p>
              Deleted <strong>{deleteResult.deleted}</strong> lead record
              {deleteResult.deleted !== 1 ? 's' : ''}.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p className="cs-dsar-panel__warning">
                This permanently deletes all leads matching this email. An audit log entry is written
                for each deletion (GDPR Art. 17).
              </p>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span className="cs-text-field__label">Email address</span>
                <input
                  type="email"
                  className="cs-text-field__input"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="subject@example.com"
                />
              </label>
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          {deleteResult ? (
            <button type="button" className="cs-btn cs-btn--subtle" onClick={resetDelete}>
              Close
            </button>
          ) : (
            <>
              <button type="button" className="cs-btn cs-btn--subtle" onClick={resetDelete}>
                Cancel
              </button>
              <button
                type="button"
                className="cs-btn cs-btn--danger"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={!email.trim() || busy}
              >
                Delete records…
              </button>
            </>
          )}
        </DialogFooter>
      </Dialog>

      {/* Confirmation dialog */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Confirm DSAR erasure"
        description={`Permanently delete all leads for "${email}"? This cannot be undone. An audit log entry is written for each deletion.`}
        confirmLabel={busy ? 'Deleting…' : 'Delete all matching leads'}
        onConfirm={handleDelete}
        busy={busy}
        tone="danger"
      />
    </div>
  );
};

export default DsarActionsPanel;
