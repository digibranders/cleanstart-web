'use client';

import { RenderFields } from '@payloadcms/ui';
import type { GroupFieldClientProps } from 'payload';
import type { ReactElement } from 'react';

const labelOf = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'en' in raw) {
    return String((raw as Record<string, unknown>).en ?? '');
  }
  return '';
};

/**
 * Custom Group field. Wraps a labelled fieldset around the inner
 * field tree. Inner composition is delegated to Payload's
 * `RenderFields` so children stamped via `wireCustomFields` keep
 * resolving to our custom field components.
 *
 * `RenderFields` is a transitional render-side import — it owns the
 * intersection-observer-driven lazy-render pipeline that ties into
 * Payload's RSC route. Replacing it cleanly is a Wave 8 follow-up.
 * It's allow-listed in scripts/check-payload-ui-allowlist.ts.
 */
export const GroupField = (props: GroupFieldClientProps): ReactElement => {
  const { field, path, schemaPath, permissions, readOnly, forceRender } = props;
  const labelText = labelOf(field.label);
  const description =
    typeof field.admin?.description === 'string' ? field.admin.description : undefined;

  return (
    <section className="cs-group" aria-label={labelText || undefined}>
      {labelText ? <header className="cs-group__legend">{labelText}</header> : null}
      {description ? <p className="cs-group__description">{description}</p> : null}
      <div className="cs-group__body">
        <RenderFields
          fields={field.fields}
          parentPath={path}
          parentSchemaPath={schemaPath ?? path}
          parentIndexPath=""
          permissions={
            permissions === true
              ? permissions
              : ((permissions as { fields?: unknown })?.fields as Record<string, never>) ?? {}
          }
          readOnly={readOnly ?? false}
          forceRender={forceRender ?? true}
        />
      </div>
    </section>
  );
};

export default GroupField;
