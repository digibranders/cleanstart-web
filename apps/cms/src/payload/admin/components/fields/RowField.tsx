'use client';

import { RenderFields } from '@payloadcms/ui';
import type { RowFieldClientProps } from 'payload';
import type { ReactElement } from 'react';

/**
 * Custom Row field. Inline horizontal layout for sibling fields. No
 * label / chrome — just the layout container. RenderFields delegates
 * the children, with `cs-row` providing the flex grid.
 */
export const RowField = (props: RowFieldClientProps): ReactElement => {
  const { field, parentPath, schemaPath, permissions, readOnly, forceRender } = props;

  return (
    <div className="cs-row">
      <RenderFields
        fields={field.fields}
        parentPath={parentPath ?? ''}
        parentSchemaPath={schemaPath ?? ''}
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
  );
};

export default RowField;
