'use client';

import { ConfirmDialog, useDragSort } from '@cleanstart/ui';
import { RenderFields, RowLabelProvider, useField, useForm } from '@payloadcms/ui';
import type { ArrayFieldClientProps } from 'payload';
import type { ReactElement, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

const labelOf = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'en' in raw) {
    return String((raw as Record<string, unknown>).en ?? '');
  }
  return '';
};

type ArrayRow = {
  readonly id?: string;
  readonly customComponents?: { readonly RowLabel?: ReactNode };
};

type UseFieldWithRows = {
  readonly rows?: ReadonlyArray<ArrayRow>;
  readonly value?: number;
};

/**
 * Custom Array field with compact, space-optimised chrome.
 *
 *   ┌ legend ────────────────────────────────────────────────┐
 *   │ Faqs (2)        [Expand all] [Collapse all] [Remove ⋯] │
 *   └────────────────────────────────────────────────────────┘
 *
 * Each row collapses to a single-line header (drag handle · index ·
 * summary text · remove). Click the header (or expand chevron) to
 * reveal the inner fields. Removing a single row is a one-click
 * action; removing all rows shows a confirmation.
 *
 * Payload tracks array state as { value: rowCount, rows: RowMeta[] }
 * when `useField` is called with `hasRows: true`. Row data lives at
 * `${path}.${index}.<subfield>`; `addFieldRow` / `removeFieldRow` /
 * `moveFieldRow` on the form context keep dirty / validation /
 * autosave in sync.
 */
export const ArrayField = (props: ArrayFieldClientProps): ReactElement => {
  const { field, path, schemaPath, permissions, readOnly, forceRender } = props;
  const fieldState = useField({ hasRows: true, path }) as UseFieldWithRows;
  const rows: ReadonlyArray<ArrayRow> = Array.isArray(fieldState.rows) ? fieldState.rows : [];

  const { addFieldRow, removeFieldRow, moveFieldRow, getDataByPath } = useForm();

  // Cmd/Ctrl+Z undo for row removal. Each remove snapshots the row's
  // sub-field values onto a LIFO stack; pressing Cmd+Z (when focus
  // isn't inside an editable element — native undo wins there) pops
  // the stack and re-inserts the row at its original index, restoring
  // the captured values. Stack is per-component instance and resets
  // on unmount; saves don't clear it (a deliberate trade-off so the
  // user can still undo immediately after an autosave).
  const undoStack = useRef<
    Array<{ rowIndex: number; snapshot: Record<string, unknown> }>
  >([]);

  const labelText = labelOf(field.label) || path;
  const description =
    typeof field.admin?.description === 'string' ? field.admin.description : undefined;
  const max = typeof field.maxRows === 'number' ? field.maxRows : undefined;
  const min = typeof field.minRows === 'number' ? field.minRows : undefined;
  // Respect both the `readOnly` prop (set by RenderFields after merging
  // parent + permissions) and the field's own `admin.readOnly` flag —
  // the former can be `undefined` early in the render cycle, e.g. on
  // newly-created docs where parent permissions haven't resolved yet.
  const isDisabled = readOnly === true || field.admin?.readOnly === true;
  const initCollapsed =
    (field.admin as { initCollapsed?: boolean } | undefined)?.initCollapsed === true;

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [confirmRemoveAll, setConfirmRemoveAll] = useState(false);

  // Seed initial collapse state when rows first arrive — honour
  // `admin.initCollapsed` so e.g. auto-generated TOC entries stay
  // tucked away by default.
  useEffect(() => {
    setCollapsed((prev) => {
      let changed = false;
      const next = { ...prev };
      rows.forEach((row, i) => {
        const key = row.id ?? `idx-${i}`;
        if (!(key in next)) {
          next[key] = initCollapsed;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [rows, initCollapsed]);

  // Cmd/Ctrl+Z handler — restores the last removed row at its original
  // index, with the captured sub-field values. Skips when focus is on
  // an input/textarea/contenteditable so the browser's native input
  // undo keeps working.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'z' && e.key !== 'Z') return;
      if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      const last = undoStack.current.pop();
      if (!last) return;
      e.preventDefault();
      const subFieldState: Record<
        string,
        { initialValue: unknown; value: unknown; valid: true }
      > = {};
      for (const [name, value] of Object.entries(last.snapshot)) {
        subFieldState[name] = { initialValue: value, value, valid: true };
      }
      addFieldRow({
        path,
        rowIndex: last.rowIndex,
        schemaPath: schemaPath ?? path,
        subFieldState,
      });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [addFieldRow, path, schemaPath]);

  const rowKey = (row: ArrayRow, i: number): string => row.id ?? `idx-${i}`;

  const reorder = (from: number, to: number): void => {
    if (from === to) return;
    moveFieldRow({ moveFromIndex: from, moveToIndex: to, path });
  };
  const snapshotRow = (idx: number): Record<string, unknown> => {
    const snap: Record<string, unknown> = {};
    const list = Array.isArray(field.fields) ? field.fields : [];
    for (const f of list) {
      const name = (f as { name?: string }).name;
      if (typeof name !== 'string' || name === 'id') continue;
      snap[name] = getDataByPath(`${path}.${idx}.${name}`);
    }
    return snap;
  };
  const remove = (idx: number): void => {
    undoStack.current.push({ rowIndex: idx, snapshot: snapshotRow(idx) });
    removeFieldRow({ path, rowIndex: idx });
  };
  const addOne = (): void => {
    addFieldRow({ path, rowIndex: rows.length, schemaPath: schemaPath ?? path });
  };
  const expandAll = (): void => {
    const next: Record<string, boolean> = {};
    rows.forEach((row, i) => {
      next[rowKey(row, i)] = false;
    });
    setCollapsed(next);
  };
  const collapseAll = (): void => {
    const next: Record<string, boolean> = {};
    rows.forEach((row, i) => {
      next[rowKey(row, i)] = true;
    });
    setCollapsed(next);
  };
  const removeAll = (): void => {
    // Snapshot from the end so the undo stack pops in insertion order
    // (each pushed entry's rowIndex was valid at the moment of removal).
    for (let i = rows.length - 1; i >= 0; i -= 1) {
      undoStack.current.push({ rowIndex: i, snapshot: snapshotRow(i) });
      removeFieldRow({ path, rowIndex: i });
    }
    setConfirmRemoveAll(false);
  };

  // Pull a short summary string for the row header. Prefer text-shaped
  // subfields (text / textarea / email / code) over numeric / boolean
  // ones so a TOC row summarises as "Section title" rather than "2".
  // Falls back to any non-empty value if no text field has content.
  const subfieldOrder = useMemo(() => {
    const list = Array.isArray(field.fields) ? field.fields : [];
    const named = list
      .map((f) => f as { name?: string; type?: string })
      .filter((f): f is { name: string; type: string } => typeof f.name === 'string' && f.name !== 'id');
    const textLike = new Set(['text', 'textarea', 'email', 'code', 'richText']);
    const text = named.filter((f) => textLike.has(f.type));
    const rest = named.filter((f) => !textLike.has(f.type));
    return [...text, ...rest].map((f) => f.name);
  }, [field.fields]);

  const rowSummary = (i: number): string => {
    for (const name of subfieldOrder) {
      const v = getDataByPath(`${path}.${i}.${name}`);
      if (typeof v === 'string' && v.trim().length > 0) return v.trim();
      if (typeof v === 'number') return String(v);
    }
    return '';
  };

  const { draggingIndex, hoverIndex, itemHandlers } = useDragSort({ onReorder: reorder });
  const atMax = max != null && rows.length >= max;
  const belowMin = min != null && rows.length < min;

  const singularLabel =
    typeof field.labels?.singular === 'string'
      ? field.labels.singular
      : labelOf(field.labels?.singular) ||
        labelText.toLowerCase().replace(/s$/, '') ||
        'item';

  return (
    <section className="cs-array" aria-label={labelText}>
      <header className="cs-array__legend">
        <span className="cs-array__title">
          {labelText}
          <span className="cs-array__count">
            ({rows.length}
            {max != null ? ` / ${max}` : ''})
          </span>
        </span>
        {rows.length > 0 ? (
          <span className="cs-array__legend-actions">
            <button
              type="button"
              className="cs-array__action"
              onClick={expandAll}
            >
              Expand all
            </button>
            <button
              type="button"
              className="cs-array__action"
              onClick={collapseAll}
            >
              Collapse all
            </button>
            {!isDisabled ? (
              <button
                type="button"
                className="cs-array__action cs-array__action--danger"
                onClick={() => setConfirmRemoveAll(true)}
              >
                Remove all
              </button>
            ) : null}
          </span>
        ) : null}
      </header>
      {description ? <p className="cs-array__description">{description}</p> : null}
      {belowMin ? (
        <output className="cs-array__warn">
          At least {min} {min === 1 ? 'item' : 'items'} required.
        </output>
      ) : null}

      <ol className="cs-array__list">
        {rows.map((row, i) => {
          const key = rowKey(row, i);
          const isCollapsed = collapsed[key] === true;
          const handlers = itemHandlers(i);
          const isDragging = draggingIndex === i;
          const isHover = hoverIndex === i;
          const summary = rowSummary(i);
          return (
            <li
              key={key}
              className={[
                'cs-array__row',
                isCollapsed ? 'is-collapsed' : 'is-open',
                isDragging ? 'is-dragging' : '',
                isHover ? 'is-hover' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onDragOver={handlers.onDragOver}
              onDragLeave={handlers.onDragLeave}
              onDrop={handlers.onDrop}
            >
              <header
                className={`cs-array__row-header${isDisabled ? ' is-readonly' : ''}`}
              >
                {isDisabled ? (
                  <span
                    className="cs-array__row-static-index"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                ) : (
                  // Only the drag handle is draggable — making the entire
                  // <li> draggable lets the browser swallow `click` on
                  // nested buttons (× / toggle) as the start of a drag,
                  // which broke removal on un-focused (empty) rows.
                  <span
                    className="cs-array__row-handle"
                    aria-hidden="true"
                    title="Drag to reorder"
                    draggable
                    onDragStart={handlers.onDragStart}
                    onDragEnd={handlers.onDragEnd}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16">
                      <title>Drag to reorder</title>
                      <circle cx="6" cy="4" r="1" fill="currentColor" />
                      <circle cx="10" cy="4" r="1" fill="currentColor" />
                      <circle cx="6" cy="8" r="1" fill="currentColor" />
                      <circle cx="10" cy="8" r="1" fill="currentColor" />
                      <circle cx="6" cy="12" r="1" fill="currentColor" />
                      <circle cx="10" cy="12" r="1" fill="currentColor" />
                    </svg>
                  </span>
                )}
                <button
                  type="button"
                  className={`cs-array__row-toggle${
                    isDisabled && row.customComponents?.RowLabel
                      ? ' cs-array__row-toggle--rowlabel'
                      : ''
                  }`}
                  aria-expanded={!isCollapsed}
                  onClick={() =>
                    setCollapsed((prev) => ({ ...prev, [key]: !isCollapsed }))
                  }
                >
                  <span className="cs-array__row-chevron" aria-hidden="true">
                    <svg width="10" height="10" viewBox="0 0 10 10">
                      <title>{isCollapsed ? 'Expand' : 'Collapse'}</title>
                      <path
                        d={isCollapsed ? 'M3 2l4 3-4 3' : 'M2 3l3 4 3-4'}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  {isDisabled && row.customComponents?.RowLabel ? (
                    <span className="cs-array__row-summary">
                      <RowLabelProvider path={`${path}.${i}`} rowNumber={i}>
                        {row.customComponents.RowLabel}
                      </RowLabelProvider>
                    </span>
                  ) : (
                    <>
                      <span className="cs-array__row-index">{i + 1}</span>
                      <span className="cs-array__row-summary">
                        {summary || <em>Empty {singularLabel}</em>}
                      </span>
                    </>
                  )}
                </button>
                {!isDisabled ? (
                  <button
                    type="button"
                    className="cs-array__row-remove"
                    aria-label={`Remove ${singularLabel} ${i + 1}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(i);
                    }}
                  >
                    ×
                  </button>
                ) : null}
              </header>
              {!isCollapsed ? (
                <div className="cs-array__row-body">
                  <RenderFields
                    fields={field.fields}
                    parentPath={`${path}.${i}`}
                    parentSchemaPath={schemaPath ?? path}
                    parentIndexPath=""
                    permissions={
                      permissions === true
                        ? permissions
                        : ((permissions as { fields?: unknown })?.fields as Record<
                            string,
                            never
                          >) ?? {}
                    }
                    readOnly={readOnly ?? false}
                    forceRender={forceRender ?? true}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      {!atMax && !isDisabled ? (
        <button type="button" className="cs-btn cs-btn--subtle cs-array__add" onClick={addOne}>
          + Add {singularLabel.toLowerCase()}
        </button>
      ) : null}

      <ConfirmDialog
        open={confirmRemoveAll}
        onClose={() => setConfirmRemoveAll(false)}
        onConfirm={removeAll}
        title={`Remove all ${rows.length} ${rows.length === 1 ? singularLabel : `${singularLabel}s`}?`}
        description="All rows will be removed. The change applies on save."
        confirmLabel="Remove all"
        tone="danger"
      />
    </section>
  );
};

export default ArrayField;
