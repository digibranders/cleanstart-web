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

const CHECK_ICON = (
  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" role="presentation">
    <title>Checked</title>
    <path d="M3 8l4 4 6-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type CheckboxProps = {
  checked: boolean;
  onChange: () => void;
  label: string;
};

const Checkbox = ({ checked, onChange, label }: CheckboxProps): ReactElement => (
  <label className="cs-checkbox-field__row">
    <input
      type="checkbox"
      className="cs-checkbox-field__input"
      checked={checked}
      onChange={onChange}
      aria-label={label}
    />
    <span className="cs-checkbox-field__visual" aria-hidden="true">
      {checked ? CHECK_ICON : null}
    </span>
  </label>
);

/**
 * Renders a "Flagged leads" panel above the Leads list table. Loads leads
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

  const allSelected = leads != null && leads.length > 0 && selectedIds.size === leads.length;

  const toggleAll = useCallback(() => {
    if (!leads) return;
    setSelectedIds(allSelected ? new Set() : new Set(leads.map((l) => l.id)));
  }, [leads, allSelected]);

  return (
    <div className="cs-flagged-panel">
      <button
        type="button"
        className="cs-btn cs-btn--subtle"
        onClick={open ? () => setOpen(false) : handleOpen}
      >
        {open ? 'Hide flagged' : 'Flagged leads'}
      </button>

      {open && (
        <div className="cs-flagged-panel__table-wrap">
          {busy ? (
            <p className="cs-flagged-panel__empty">Loading…</p>
          ) : !leads || leads.length === 0 ? (
            <p className="cs-flagged-panel__empty">No flagged leads.</p>
          ) : (
            <>
              <div className="cs-flagged-panel__toolbar">
                <span className="cs-flagged-panel__toolbar-count">
                  {leads.length} flagged lead{leads.length !== 1 ? 's' : ''}
                  {selectedIds.size < leads.length ? ` (${selectedIds.size} selected)` : ''}
                </span>
                <button
                  type="button"
                  className="cs-btn cs-btn--danger"
                  onClick={() => setConfirmOpen(true)}
                  disabled={selectedIds.size === 0 || busy}
                >
                  Delete selected ({selectedIds.size})
                </button>
              </div>

              <table className="cs-flagged-panel__table">
                <thead>
                  <tr>
                    <th className="cs-flagged-panel__th" style={{ width: '2.5rem' }}>
                      <Checkbox
                        checked={allSelected}
                        onChange={toggleAll}
                        label="Select all flagged leads"
                      />
                    </th>
                    <th className="cs-flagged-panel__th">ID</th>
                    <th className="cs-flagged-panel__th">Form</th>
                    <th className="cs-flagged-panel__th">Flag reason</th>
                    <th className="cs-flagged-panel__th">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="cs-flagged-panel__tr">
                      <td className="cs-flagged-panel__td">
                        <Checkbox
                          checked={selectedIds.has(lead.id)}
                          onChange={() => toggleSelect(lead.id)}
                          label={`Select lead ${lead.id}`}
                        />
                      </td>
                      <td className="cs-flagged-panel__td">{lead.id}</td>
                      <td className="cs-flagged-panel__td">{resolveFormId(lead.form)}</td>
                      <td className="cs-flagged-panel__td cs-flagged-panel__flag-cell">
                        {flagReason(lead)}
                      </td>
                      <td className="cs-flagged-panel__td">
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
