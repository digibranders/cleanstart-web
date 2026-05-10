'use client';

import type { DocumentViewClientProps } from 'payload';
import type { ReactElement, ReactNode } from 'react';

import { EditChrome } from './EditChrome';
import { PublishMenu } from './PublishMenu';

const slot = (node: ReactNode): ReactNode | null =>
  node === undefined || node === null ? null : node;

/**
 * Wave 4 — single shared client edit view for every collection + global.
 *
 * The heavy lifting (form state, version loading, permissions, locale
 * handling) stays in Payload's RSC pipeline. We receive the pre-
 * rendered slots (`SaveButton`, `PublishButton`, `Status`,
 * `Description`, `LivePreview`, etc.) via `DocumentSlots` and arrange
 * them into our own chrome. Payload's slot system means custom field
 * components stamped via `wireCustomFields` continue to render inside.
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

  return (
    <EditChrome
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
