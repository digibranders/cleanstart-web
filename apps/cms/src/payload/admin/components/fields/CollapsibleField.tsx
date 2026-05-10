'use client';

import { RenderFields } from '@payloadcms/ui';
import type { CollapsibleFieldClientProps } from 'payload';
import type { ReactElement } from 'react';
import { useId, useState } from 'react';

const labelOf = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'en' in raw) {
    return String((raw as Record<string, unknown>).en ?? '');
  }
  return '';
};

/**
 * Custom Collapsible field. <details>-based for native keyboard
 * support (Space / Enter to toggle, focus styles for free) wrapping
 * Payload's `RenderFields` for the inner tree.
 *
 * `initCollapsed` from `field.admin` controls the start state. We
 * mirror it into local state so collapse/expand stays purely client-
 * side without bouncing through Payload's preferences round-trip.
 */
export const CollapsibleField = (props: CollapsibleFieldClientProps): ReactElement => {
  const { field, path, schemaPath, permissions, readOnly, forceRender } = props;
  const labelText = labelOf(field.label);
  const description =
    typeof field.admin?.description === 'string' ? field.admin.description : undefined;
  const initCollapsed =
    (field.admin as { initCollapsed?: boolean } | undefined)?.initCollapsed === true;
  const [open, setOpen] = useState<boolean>(!initCollapsed);
  const summaryId = useId();

  return (
    <details
      className={`cs-collapsible${open ? ' is-open' : ''}`}
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary id={summaryId} className="cs-collapsible__summary">
        <span className="cs-collapsible__chevron" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" role="presentation">
            <title>{open ? 'Collapse' : 'Expand'}</title>
            <path
              d="M3 4.5l3 3 3-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="cs-collapsible__title">{labelText || path}</span>
      </summary>
      {description ? <p className="cs-collapsible__description">{description}</p> : null}
      <div className="cs-collapsible__body">
        <RenderFields
          fields={field.fields}
          parentPath={path}
          parentSchemaPath={schemaPath ?? path}
          parentIndexPath=""
          permissions={
            permissions && typeof permissions === 'object' && 'fields' in permissions
              ? (permissions.fields as Record<string, never>) ?? {}
              : {}
          }
          readOnly={readOnly ?? false}
          {...(forceRender !== undefined ? { forceRender } : {})}
        />
      </div>
    </details>
  );
};

export default CollapsibleField;
