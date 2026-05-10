'use client';

import {
  ConfirmDialog,
  Dialog,
  DialogBody,
  DialogHeader,
  useDragSort,
} from '@cleanstart/ui';
import { RenderFields, useField } from '@payloadcms/ui';
import type { BlocksFieldClientProps } from 'payload';
import type { ReactElement } from 'react';
import { useState } from 'react';

const labelOf = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'en' in raw) {
    return String((raw as Record<string, unknown>).en ?? '');
  }
  return '';
};

type BlockRow = {
  readonly id?: string;
  readonly blockType: string;
  readonly [k: string]: unknown;
};

/**
 * Custom Blocks field. Layered chrome on top of Payload's
 * RenderFields: pick-block dialog (typed list of block configs),
 * row chrome (drag handle + index + collapsible body + remove),
 * reorder via useDragSort.
 *
 * Block sub-fields render via RenderFields. The `wireCustomFields`
 * stamp applies recursively so nested custom Field components surface.
 */
export const BlocksField = (props: BlocksFieldClientProps): ReactElement => {
  const { field, path, schemaPath, permissions, readOnly, forceRender } = props;
  const { value, setValue } = useField<ReadonlyArray<BlockRow> | undefined>({ path });

  const rows = (value ?? []) as ReadonlyArray<BlockRow>;
  const labelText = labelOf(field.label) || path;
  const description =
    typeof field.admin?.description === 'string' ? field.admin.description : undefined;
  const max = typeof field.maxRows === 'number' ? field.maxRows : undefined;
  const blocks = (field.blocks ?? []) as ReadonlyArray<{
    slug: string;
    labels?: { singular?: unknown };
    fields: unknown[];
  }>;
  const isDisabled = readOnly === true;

  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);

  const setRows = (next: ReadonlyArray<BlockRow>): void => {
    setValue(next as unknown as BlockRow[]);
  };

  const reorder = (from: number, to: number): void => {
    if (from === to) return;
    const arr = [...rows];
    const [moved] = arr.splice(from, 1);
    if (moved !== undefined) arr.splice(to, 0, moved);
    setRows(arr);
  };
  const remove = (idx: number): void => {
    setRows(rows.filter((_, i) => i !== idx));
    setConfirmRemove(null);
  };
  const insertBlock = (slug: string): void => {
    setRows([...rows, { blockType: slug } as BlockRow]);
    setPickerOpen(false);
  };

  const { draggingIndex, hoverIndex, itemHandlers } = useDragSort({ onReorder: reorder });
  const atMax = max != null && rows.length >= max;

  return (
    <fieldset className="cs-blocks">
      <legend className="cs-blocks__legend">
        {labelText}
        <span className="cs-blocks__count">
          ({rows.length}
          {max != null ? ` / ${max}` : ''})
        </span>
      </legend>
      {description ? <p className="cs-blocks__description">{description}</p> : null}

      <ol className="cs-blocks__list">
        {rows.map((row, i) => {
          const handlers = itemHandlers(i);
          const isDragging = draggingIndex === i;
          const isHover = hoverIndex === i;
          const blockCfg = blocks.find((b) => b.slug === row.blockType);
          const blockLabel = labelOf(blockCfg?.labels?.singular) || row.blockType;
          return (
            <li
              key={row.id ?? `block-${i}`}
              className={[
                'cs-blocks__row',
                isDragging ? 'is-dragging' : '',
                isHover ? 'is-hover' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              draggable={!isDisabled}
              {...handlers}
            >
              <header className="cs-blocks__row-header">
                <div className="cs-blocks__row-handle" aria-hidden="true">
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
                <span className="cs-blocks__row-index">{i + 1}</span>
                <span className="cs-blocks__row-type">{blockLabel}</span>
                {!isDisabled ? (
                  <button
                    type="button"
                    className="cs-blocks__row-remove"
                    aria-label={`Remove ${blockLabel}`}
                    onClick={() => setConfirmRemove(i)}
                  >
                    ×
                  </button>
                ) : null}
              </header>
              <div className="cs-blocks__row-body">
                {blockCfg ? (
                  <RenderFields
                    fields={blockCfg.fields as never}
                    parentPath={`${path}.${i}`}
                    parentSchemaPath={`${schemaPath ?? path}.${row.blockType}`}
                    parentIndexPath={String(i)}
                    permissions={
                      permissions && typeof permissions === 'object' && 'fields' in permissions
                        ? (permissions.fields as Record<string, never>) ?? {}
                        : {}
                    }
                    readOnly={readOnly ?? false}
                    {...(forceRender !== undefined ? { forceRender } : {})}
                  />
                ) : (
                  <p className="cs-blocks__row-missing">
                    Block type "{row.blockType}" not registered.
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {!atMax && !isDisabled ? (
        <button
          type="button"
          className="cs-btn cs-btn--subtle cs-blocks__add"
          onClick={() => setPickerOpen(true)}
        >
          + Add block
        </button>
      ) : null}

      <Dialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        ariaLabel="Pick block type"
        size="md"
      >
        <DialogHeader title="Add block" onClose={() => setPickerOpen(false)} />
        <DialogBody>
          <ul className="cs-blocks__picker">
            {blocks.map((b) => (
              <li key={b.slug}>
                <button
                  type="button"
                  className="cs-blocks__picker-item"
                  onClick={() => insertBlock(b.slug)}
                >
                  <span className="cs-blocks__picker-item-label">
                    {labelOf(b.labels?.singular) || b.slug}
                  </span>
                  <span className="cs-blocks__picker-item-slug">{b.slug}</span>
                </button>
              </li>
            ))}
          </ul>
        </DialogBody>
      </Dialog>

      <ConfirmDialog
        open={confirmRemove != null}
        onClose={() => setConfirmRemove(null)}
        onConfirm={() => {
          if (confirmRemove != null) remove(confirmRemove);
        }}
        title="Remove block?"
        description="This block will be removed. The change applies on save."
        confirmLabel="Remove"
        tone="danger"
      />
    </fieldset>
  );
};

export default BlocksField;
