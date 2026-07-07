'use client';

import { DateTimePicker } from '@cleanstart/ui';
import { useConfig, useListQuery, useTableColumns } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { EXPORT_FIELD_DENYLIST } from '../../../../lib/export/serialize-field';

type ExportableField = { name: string; label: string };

type Props = {
  readonly collectionSlug: string;
  /** Whether the parent `Drawer` is currently open. `Drawer` always keeps
   * its children mounted (it toggles a native `<dialog>`, not conditional
   * rendering — see `packages/ui/src/primitives/Drawer.tsx`), so this
   * component must react to the open transition itself rather than rely
   * on mount-time state to capture "columns displayed right now". */
  readonly open: boolean;
};

const fieldLabel = (f: { label?: unknown; name?: string }): string => {
  if (typeof f.label === 'string') return f.label;
  if (f.label && typeof f.label === 'object' && 'en' in f.label) {
    return String((f.label as Record<string, unknown>).en ?? f.name ?? '');
  }
  return f.name ?? '';
};

/**
 * The "Export…" kebab-menu drawer. Mirrors `ColumnPicker.tsx`'s shape
 * (a Drawer body, no dialog system of its own). Field list is derived
 * from the collection's client config (`useConfig`) rather than
 * hardcoded per collection — every content collection this drawer
 * serves gets the same picker for free.
 *
 * Initial selection: whichever fields are currently shown as table
 * columns (`useTableColumns` — the same hook `ColumnPicker.tsx` uses)
 * are pre-checked, since that's what the editor is already looking at.
 * Recomputed every time the drawer transitions from closed to open (not
 * just once at mount — see the `open` prop doc above), so toggling
 * columns via "Columns…" and then opening "Export…" reflects the latest
 * choice.
 */
export const ExportDrawer = (props: Props): ReactElement => {
  const { collectionSlug, open } = props;
  const { config } = useConfig();
  const { query } = useListQuery();
  const { columns } = useTableColumns();

  const collection = useMemo(
    () => config.collections.find((c) => c.slug === collectionSlug),
    [config, collectionSlug],
  );

  const exportableFields: ExportableField[] = useMemo(() => {
    const fields = collection?.fields ?? [];
    return fields
      .filter((f): f is typeof f & { name: string } => 'name' in f && typeof f.name === 'string')
      .filter((f) => !EXPORT_FIELD_DENYLIST.includes(f.name))
      .map((f) => ({ name: f.name, label: fieldLabel(f) }));
  }, [collection]);

  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());

  // Recompute the preselected columns on every closed→open transition only
  // — not continuously while open, which would fight the editor's manual
  // checkbox toggles mid-session.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally omits exportableFields/columns; reset must fire only on the `open` transition
  useEffect(() => {
    if (!open) return;
    const displayedFieldNames = new Set(columns.filter((c) => c.active).map((c) => c.accessor));
    const displayed = exportableFields.filter((f) => displayedFieldNames.has(f.name));
    // Fall back to the first 5 exportable fields only if none of the
    // displayed table columns map onto an exportable field name (e.g. every
    // visible column is a nested/computed accessor) — the picker should
    // never open with zero columns checked.
    const initial = displayed.length > 0 ? displayed : exportableFields.slice(0, 5);
    setSelectedFields(new Set(initial.map((f) => f.name)));
  }, [open]);

  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');

  const toggleField = (name: string): void => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const onExport = (): void => {
    const params = new URLSearchParams();
    params.set('fields', Array.from(selectedFields).join(','));
    params.set('format', format);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (query.search) params.set('search', String(query.search));
    if (query.where && Object.keys(query.where as Record<string, unknown>).length > 0) {
      params.set('where', JSON.stringify(query.where));
    }
    window.location.assign(`${config.routes.api}/${collectionSlug}/export?${params.toString()}`);
  };

  return (
    <div className="cs-export-drawer">
      <fieldset className="cs-export-drawer__section">
        <legend>Date range</legend>
        <DateTimePicker value={from} onChange={setFrom} mode="date" ariaLabel="From date" />
        <DateTimePicker value={to} onChange={setTo} mode="date" ariaLabel="To date" />
      </fieldset>

      <fieldset className="cs-export-drawer__section">
        <legend>Columns</legend>
        <ul className="cs-export-drawer__field-list">
          {exportableFields.map((f) => (
            <li key={f.name}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedFields.has(f.name)}
                  onChange={() => toggleField(f.name)}
                />
                <span>{f.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <fieldset className="cs-export-drawer__section">
        <legend>Format</legend>
        <label>
          <input
            type="radio"
            name="export-format"
            checked={format === 'csv'}
            onChange={() => setFormat('csv')}
          />
          CSV
        </label>
        <label>
          <input
            type="radio"
            name="export-format"
            checked={format === 'xlsx'}
            onChange={() => setFormat('xlsx')}
          />
          Excel (.xlsx)
        </label>
      </fieldset>

      <button
        type="button"
        className="cs-btn cs-btn--primary"
        disabled={selectedFields.size === 0}
        onClick={onExport}
      >
        Export {selectedFields.size} column{selectedFields.size === 1 ? '' : 's'}
      </button>
    </div>
  );
};

export default ExportDrawer;
