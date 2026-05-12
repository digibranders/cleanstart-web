'use client';

// CLAUDE.md says `@payloadcms/ui` is data-layer-only — `DocumentFields`
// is a render-side export. We import it here under a narrow, documented
// exception: owning the edit-view chrome (header, controls, sidebar,
// live preview pane) requires composing Payload's own field tree
// somewhere, and `DocumentFields` is the smallest seam that gives us
// every field-type renderer, error plumbing, autosave hooks, and the
// `<form>` wrapper. Re-implementing it here would duplicate hundreds
// of lines that aren't UI we want to own. Custom Field components
// (text, textarea, array, blocks, etc.) are still stamped via
// `wireCustomFields` and surface inside this tree.
import { DocumentFields, useConfig, useDocumentInfo } from '@payloadcms/ui';
import type { ClientField, DocumentViewClientProps } from 'payload';
import type { ReactElement, ReactNode } from 'react';
import { useMemo } from 'react';

import { EditChrome } from './EditChrome';
import { PublishMenu } from './PublishMenu';

const slot = (node: ReactNode): ReactNode | null =>
  node === undefined || node === null ? null : node;

/**
 * Wave 4 — single shared client edit view for every collection + global.
 *
 * Receives slot props from Payload's RSC pipeline (`SaveButton`,
 * `PublishButton`, `Status`, `Description`, `LivePreview`, etc.) and
 * arranges them into our chrome. The actual `<form>` tree comes from
 * `<DocumentFields>` (see import comment above).
 */
export const CmsEditView = (props: DocumentViewClientProps): ReactElement => {
  const {
    Description,
    PreviewButton,
    PublishButton,
    SaveButton,
    SaveDraftButton,
    UnpublishButton,
    Status,
    LivePreview,
    EditMenuItems,
    BeforeDocumentControls,
    documentSubViewType,
    Upload,
    UploadControls,
  } = props;

  const { config } = useConfig();
  const {
    collectionSlug,
    globalSlug,
    docPermissions,
    hasSavePermission,
    isTrashed,
  } = useDocumentInfo();

  const entitySlug = collectionSlug ?? globalSlug ?? '';
  const schemaPathSegments = useMemo(() => [entitySlug], [entitySlug]);

  const docConfig = useMemo(() => {
    if (collectionSlug) {
      return config.collections.find((c) => c.slug === collectionSlug);
    }
    if (globalSlug) {
      return config.globals.find((g) => g.slug === globalSlug);
    }
    return undefined;
  }, [config, collectionSlug, globalSlug]);

  const fields = (docConfig?.fields ?? []) as ClientField[];
  const readOnly = hasSavePermission === false || isTrashed === true;

  const form =
    documentSubViewType === 'default' && docPermissions ? (
      <DocumentFields
        docPermissions={docPermissions}
        fields={fields}
        readOnly={readOnly}
        schemaPathSegments={schemaPathSegments}
        {...(isTrashed !== undefined ? { isTrashed } : {})}
      />
    ) : null;

  return (
    <EditChrome
      form={form}
      {...(Description !== undefined ? { description: Description } : {})}
      {...(Status !== undefined ? { status: Status } : {})}
      {...(BeforeDocumentControls !== undefined
        ? { beforeControls: BeforeDocumentControls }
        : {})}
      {...(EditMenuItems !== undefined ? { menuItems: EditMenuItems } : {})}
      {...(Upload !== undefined ? { upload: Upload } : {})}
      {...(UploadControls !== undefined ? { uploadControls: UploadControls } : {})}
      controls={
        <>
          {slot(PreviewButton)}
          <PublishMenu
            saveDraft={SaveDraftButton}
            publish={PublishButton}
            unpublish={UnpublishButton}
            save={SaveButton}
          />
        </>
      }
      {...(LivePreview !== undefined ? { livePreview: LivePreview } : {})}
      documentSubViewType={documentSubViewType}
    />
  );
};

export default CmsEditView;
