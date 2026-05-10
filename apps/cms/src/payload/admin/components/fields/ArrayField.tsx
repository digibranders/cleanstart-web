'use client';

import { ConfirmDialog, useDragSort } from '@cleanstart/ui';
import { RenderFields, useField } from '@payloadcms/ui';
import type { ArrayFieldClientProps } from 'payload';
import type { ReactElement } from 'react';
import { useState } from 'react';

const labelOf = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'en' in raw) {
    return String((raw as Record<string, unknown>).en ?? '');
  }
  return '';
};

type ArrayRow = { readonly id?: string };

/**
 * Custom Array field. Owns the row chrome (drag handle, index badge,
 * remove button, add button), delegates inner field tree to
 * RenderFields. Reorder uses our @cleanstart/ui useDragSort hook.
 *
 * Min/max enforcement is server-side (Phase D validators) — UI hides
 * the Add button at maxRows, surfaces a banner at minRows. Field
 * value is read/written through Payload's `useField` so saves and
 * autosave keep working.
 */
export const ArrayField = (props: ArrayFieldClientProps): ReactElement => {
  const { field, path, schemaPath, permissions, readOnly, forceRender } = props;
  const { value, setValue } = useField<ReadonlyArray<ArrayRow> | undefined>({ path });

  const rows = (value ?? []) as ReadonlyArray<ArrayRow>;
  const labelText = labelOf(field.label) || path;
  const description =
    typeof field.admin?.description === 'string' ? field.admin.description : undefined;
  const max = typeof field.maxRows === 'number' ? field.maxRows : undefined;
  const min = typeof field.minRows === 'number' ? field.minRows : undefined;
  const isDisabled = readOnly === true;

  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);

  const setRows = (next: ReadonlyArray<ArrayRow>): void => {
    setValue(next as unknown as ArrayRow[]);
  };

  const reorder = (from: number, to: number): void => {
    if (from === to) return;
    const arr = [...rows];
    const [moved] = arr.splice(from, 1);
    if (moved !== undefined) arr.splice(to, 0, moved);
    setRows(arr);
  };
  const remove = (idx: number): void => {
    const next = rows.filter((_, i) => i !== idx);
    setRows(next);
    setConfirmRemove(null);
  };
  const addOne = (): void => {
    setRows([...rows, {} as ArrayRow]);
  };

  const { draggingIndex, hoverIndex, itemHandlers } = useDragSort({ onReorder: reorder });
  const atMax = max != null && rows.length >= max;
  const belowMin = min != null && rows.length < min;

  return (
    <fieldset className="cs-array">
      <legend className="cs-array__legend">
        {labelText}
        <span className="cs-array__count">
          ({rows.length}
          {max != null ? ` / ${max}` : ''})
        </span>
      </legend>
      {description ? <p className="cs-array__description">{description}</p> : null}
      {belowMin ? (
        <output className="cs-array__warn">
          At least {min} {min === 1 ? 'item' : 'items'} required.
        </output>
      ) : null}

      <ol className="cs-array__list">
        {rows.map((row, i) => {
          const handlers = itemHandlers(i);
          const isDragging = draggingIndex === i;
          const isHover = hoverIndex === i;
          return (
            <li
              key={row.id ?? `row-${i}`}
              className={[
                'cs-array__row',
                isDragging ? 'is-dragging' : '',
                isHover ? 'is-hover' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              draggable={!isDisabled}
              {...handlers}
            >
              <div className="cs-array__row-handle" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 16 16">
                  <title>Drag to reorder</title>
                  <circle cx="6" cy="4" r="1" fill="currentColor" />
                  <circle cx="10" cy="4" r="1" fill="currentColor" />
                  <circle cx="6" cy="8" r="1" fill="currentColor" />
                  <circle cx="10" cy="8" r="1" fill="currentColor" />
                  <circle cx="6" cy="12" r="1" fill="currentColor" />
                  <circle cx="10" cy="12" r="1" fill="currentColor" />
                </svg>
              </div>
              <span className="cs-array__row-index">{i + 1}</span>
              <div className="cs-array__row-body">
                <RenderFields
                  fields={field.fields}
                  parentPath={`${path}.${i}`}
                  parentSchemaPath={schemaPath ?? path}
                  parentIndexPath={String(i)}
                  permissions={
                    permissions && typeof permissions === 'object' && 'fields' in permissions
                      ? (permissions.fields as Record<string, never>) ?? {}
                      : {}
                  }
                  readOnly={readOnly ?? false}
                  {...(forceRender !== undefined ? { forceRender } : {})}
                />
              </div>
              {!isDisabled ? (
                <button
                  type="button"
                  className="cs-array__row-remove"
                  aria-label={`Remove item ${i + 1}`}
                  onClick={() => setConfirmRemove(i)}
                >
                  ×
                </button>
              ) : null}
            </li>
          );
        })}
      </ol>

      {!atMax && !isDisabled ? (
        <button type="button" className="cs-btn cs-btn--subtle cs-array__add" onClick={addOne}>
          + Add {labelText.toLowerCase().replace(/s$/, '') || 'item'}
        </button>
      ) : null}

      <ConfirmDialog
        open={confirmRemove != null}
        onClose={() => setConfirmRemove(null)}
        onConfirm={() => {
          if (confirmRemove != null) remove(confirmRemove);
        }}
        title="Remove item?"
        description="This row will be removed from the array. The change applies on save."
        confirmLabel="Remove"
        tone="danger"
      />
    </fieldset>
  );
};

export default ArrayField;
