'use client';

import { useConfig } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useState, useCallback } from 'react';

import { ConfirmDialog } from '@cleanstart/ui';

type FlaggedLead = {
  id: number;
  createdAt: string;
  honeypot: string | null;
  turnstilePassed: boolean;
  form: number | { id: number };
};

type FlaggedResponse = { ok: boolean; docs?: FlaggedLead[]; error?: string };
type DeleteResponse = { ok: boolean; error?: string };

const resolveFormId = (form: number | { id: number }): number =>
  typeof form === 'object' ? form.id : form;

const flagReason = (lead: FlaggedLead): string => {
  if (lead.honeypot) return `Honeypot tripped (${lead.honeypot.slice(0, 20)})`;
  if (!lead.turnstilePassed) return 'Turnstile failed';
  return 'Unknown flag';
};

/**
 * Renders a "Flagged leads" tab above the Leads list table. Loads leads
 * where `honeypot` is non-empty or `turnstilePassed = false`. Admins
 * can bulk-delete the flagged records.
 *
 * Mounted via `beforeListTable` on the Leads collection.
 */
export const FlaggedLeadsTab = (): ReactElement => {
  const { config } = useConfig();
  const [open, setOpen] = useState(false);
  const [leads, setLeads] = useState<FlaggedLead[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const serverURL = config?.serverURL ?? '';

  const loadFlagged = useCallback(async () => {
    setBusy(true);
    try {
      const params = new URLSearchParams({
        'where[or][0][honeypot][not_equals]': '',
        'where[or][1][turnstilePassed][equals]': 'false',
        limit: '200',
        depth: '0',
      });
      const res = await fetch(`${serverURL}/api/leads?${params.toString()}`, {
        credentials: 'include',
      });
      const body = (await res.json()) as FlaggedResponse;
      if (body.ok !== false && Array.isArray(body.docs)) {
        setLeads(body.docs as FlaggedLead[]);
        setSelectedIds(new Set((body.docs as FlaggedLead[]).map((l) => l.id)));
      }
    } catch {
      setLeads([]);
    } finally {
      setBusy(false);
    }
  }, [serverURL]);

  const handleOpen = useCallback(() => {
    setOpen(true);
    void loadFlagged();
  }, [loadFlagged]);

  const handleBulkDelete = useCallback(async () => {
    setConfirmOpen(false);
    setBusy(true);
    const ids = Array.from(selectedIds);
    let deleted = 0;
    for (const id of ids) {
      try {
        const res = await fetch(`${serverURL}/api/leads/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        const body = (await res.json()) as DeleteResponse;
        if (body.ok !== false) deleted += 1;
      } catch {
        // Continue — best-effort bulk delete.
      }
    }
    setBusy(false);
    alert(`Deleted ${deleted} of ${ids.length} flagged lead${ids.length !== 1 ? 's' : ''}.`);
    setOpen(false);
    setLeads(null);
  }, [selectedIds, serverURL]);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <button type="button" onClick={open ? () => setOpen(false) : handleOpen}>
        {open ? 'Hide flagged' : 'Flagged leads'}
      </button>

      {open && (
        <div
          style={{
            marginTop: '0.75rem',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          {busy ? (
            <p style={{ padding: '0.75rem', margin: 0 }}>Loading…</p>
          ) : !leads || leads.length === 0 ? (
            <p style={{ padding: '0.75rem', margin: 0, color: 'var(--theme-elevation-500)' }}>
              No flagged leads.
            </p>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  background: 'var(--theme-elevation-50)',
                  borderBottom: '1px solid var(--theme-elevation-150)',
                }}
              >
                <span style={{ fontSize: '0.8125rem' }}>
                  {leads.length} flagged lead{leads.length !== 1 ? 's' : ''}
                  {selectedIds.size < leads.length ? ` (${selectedIds.size} selected)` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  disabled={selectedIds.size === 0 || busy}
                  style={{ color: 'var(--theme-error-500, #ef4444)', marginLeft: 'auto' }}
                >
                  Delete selected ({selectedIds.size})
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ background: 'var(--theme-elevation-50)' }}>
                    <th style={{ padding: '0.375rem 0.75rem', textAlign: 'left', width: '2rem' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.size === leads.length}
                        onChange={() =>
                          selectedIds.size === leads.length
                            ? setSelectedIds(new Set())
                            : setSelectedIds(new Set(leads.map((l) => l.id)))
                        }
                      />
                    </th>
                    <th style={{ padding: '0.375rem 0.75rem', textAlign: 'left' }}>ID</th>
                    <th style={{ padding: '0.375rem 0.75rem', textAlign: 'left' }}>Form</th>
                    <th style={{ padding: '0.375rem 0.75rem', textAlign: 'left' }}>Flag reason</th>
                    <th style={{ padding: '0.375rem 0.75rem', textAlign: 'left' }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      style={{ borderTop: '1px solid var(--theme-elevation-100)' }}
                    >
                      <td style={{ padding: '0.375rem 0.75rem' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(lead.id)}
                          onChange={() => toggleSelect(lead.id)}
                        />
                      </td>
                      <td style={{ padding: '0.375rem 0.75rem' }}>{lead.id}</td>
                      <td style={{ padding: '0.375rem 0.75rem' }}>{resolveFormId(lead.form)}</td>
                      <td
                        style={{
                          padding: '0.375rem 0.75rem',
                          color: 'var(--theme-error-500, #ef4444)',
                        }}
                      >
                        {flagReason(lead)}
                      </td>
                      <td style={{ padding: '0.375rem 0.75rem' }}>
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete flagged leads"
        description={`Permanently delete ${selectedIds.size} selected lead${selectedIds.size !== 1 ? 's' : ''}? This cannot be undone.`}
        confirmLabel={busy ? 'Deleting…' : 'Delete leads'}
        onConfirm={handleBulkDelete}
        busy={busy}
        tone="danger"
      />
    </div>
  );
};

export default FlaggedLeadsTab;
