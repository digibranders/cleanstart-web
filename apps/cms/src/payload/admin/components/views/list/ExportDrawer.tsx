'use client';

import { DateTimePicker, DropdownMenu, type DropdownMenuItem } from '@cleanstart/ui';
import { useConfig, useListQuery, useTableColumns } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { EXPORT_FIELD_DENYLIST } from '../../../../lib/export/serialize-field';

import { resolveCuratedDefaultColumns } from './export-default-columns';
import { DATE_PRESET_OPTIONS, type DatePreset, computePresetRange } from './export-date-preset';

type ExportableField = { name: string; label: string };

/** Synthetic, server-computed column — not a real Payload field, so it's
 * appended unconditionally rather than derived from `collection.fields`.
 * See `apps/cms/src/payload/lib/export/schema-types.ts`. */
const SCHEMA_TYPES_FIELD: ExportableField = { name: '__schemaTypes', label: 'Schema Types' };

/** `type: 'ui'` fields are pure admin-panel display widgets with no stored
 * data — Payload never populates them into `doc`, so offering them in the
 * export picker produces blank cells. These five are the exception: their
 * visible name/label stays, but the endpoint redirects them to the real
 * nested `seo.*` storage path (`lib/export/virtual-fields.ts`). Every other
 * `ui` field (`serpPreview`, `schemaPreview`, `seoHealthScore`,
 * `seoAdvanced`, ...) is dropped from the picker entirely. */
const UI_FIELD_REDIRECT_ALLOWLIST: ReadonlySet<string> = new Set([
  'seoTitle',
  'seoDescription',
  'seoIndexable',
  'canonicalUrl',
  'socialCard',
]);

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

/** Generic "always useful" field names — checked against whatever fields
 * actually exist on the current collection, never hardcoded per collection.
 * E.g. `news`'s `publicationDate` is preselected purely because it's in
 * this list and happens to exist on that collection's field set. */
const ALWAYS_USEFUL_FIELD_NAMES: readonly string[] = [
  'title',
  'name',
  'slug',
  'status',
  '_status',
  'createdAt',
  'updatedAt',
  'publishedAt',
  'publicationDate',
  'effectiveDate',
];

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
    const real = fields
      .filter((f): f is typeof f & { name: string } => 'name' in f && typeof f.name === 'string')
      .filter((f) => !EXPORT_FIELD_DENYLIST.includes(f.name))
      .filter((f) => f.type !== 'ui' || UI_FIELD_REDIRECT_ALLOWLIST.has(f.name))
      .map((f) => ({ name: f.name, label: fieldLabel(f) }));
    return [...real, SCHEMA_TYPES_FIELD];
  }, [collection]);

  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());

  // Recompute the preselected columns on every closed→open transition only
  // — not continuously while open, which would fight the editor's manual
  // checkbox toggles mid-session.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally omits exportableFields/columns; reset must fire only on the `open` transition
  useEffect(() => {
    if (!open) return;
    const exportableNames = new Set(exportableFields.map((f) => f.name));

    // Curated per-collection defaults take precedence when defined,
    // intersected with the fields actually present so a stale/renamed
    // curated entry never tries to select a nonexistent checkbox.
    const curatedPreselect = resolveCuratedDefaultColumns(collectionSlug, exportableNames);

    let initialNames: string[];
    if (curatedPreselect && curatedPreselect.length > 0) {
      initialNames = curatedPreselect;
    } else {
      const displayedFieldNames = new Set(columns.filter((c) => c.active).map((c) => c.accessor));
      const union = new Set<string>();
      for (const f of exportableFields) {
        if (displayedFieldNames.has(f.name) || ALWAYS_USEFUL_FIELD_NAMES.includes(f.name)) {
          union.add(f.name);
        }
      }
      initialNames = exportableFields.filter((f) => union.has(f.name)).map((f) => f.name);
    }

    // Fall back to the first 5 exportable fields only if neither the
    // curated list nor the generic heuristic produced anything — the
    // picker should never open with zero columns checked.
    if (initialNames.length === 0) {
      initialNames = exportableFields.slice(0, 5).map((f) => f.name);
    }
    setSelectedFields(new Set(initialNames));
  }, [open]);

  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>('allTime');
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');
  const datePresetTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [datePresetMenuOpen, setDatePresetMenuOpen] = useState(false);

  const onPresetChange = (preset: DatePreset): void => {
    setDatePreset(preset);
    if (preset === 'custom') return;
    const range = computePresetRange(preset);
    setFrom(range.from);
    setTo(range.to);
  };

  // Manually editing either picker (not via the preset dropdown) means the
  // two controls would otherwise silently disagree — flip back to "Custom
  // range" so the dropdown always reflects what's actually selected.
  const onFromChange = (next: string | null): void => {
    setFrom(next);
    setDatePreset('custom');
  };

  const onToChange = (next: string | null): void => {
    setTo(next);
    setDatePreset('custom');
  };

  const datePresetLabel =
    DATE_PRESET_OPTIONS.find((opt) => opt.value === datePreset)?.label ?? 'All time';

  const datePresetMenuItems: DropdownMenuItem[] = DATE_PRESET_OPTIONS.map((opt) => ({
    kind: 'item',
    id: opt.value,
    label: opt.label,
    onSelect: () => onPresetChange(opt.value),
  }));

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
        <p
          className="cs-export-drawer__hint"
          style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', opacity: 0.7 }}
        >
          Choose a quick preset below, or set a custom From / To range.
        </p>
        <button
          ref={datePresetTriggerRef}
          type="button"
          className="cs-btn cs-btn--subtle cs-export-drawer__date-trigger"
          onClick={() => setDatePresetMenuOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={datePresetMenuOpen}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            minWidth: '13rem',
          }}
        >
          <span>
            <span style={{ opacity: 0.6, marginRight: '0.4rem' }}>Date range:</span>
            {datePresetLabel}
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            style={{
              flexShrink: 0,
              transition: 'transform 150ms ease',
              transform: datePresetMenuOpen ? 'rotate(180deg)' : 'none',
            }}
          >
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <DropdownMenu
          open={datePresetMenuOpen}
          onClose={() => setDatePresetMenuOpen(false)}
          anchorRef={datePresetTriggerRef}
          items={datePresetMenuItems}
          ariaLabel="Date range preset"
        />
        <DateTimePicker value={from} onChange={onFromChange} mode="date" ariaLabel="From date" />
        <DateTimePicker value={to} onChange={onToChange} mode="date" ariaLabel="To date" />
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
