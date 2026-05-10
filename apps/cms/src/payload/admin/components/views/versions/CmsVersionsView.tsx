'use client';

import type { DocumentViewClientProps } from 'payload';
import type { ReactElement } from 'react';

import { EditChrome } from '../edit/EditChrome';

/**
 * Custom `views.edit.versions` — wraps the versions list (rendered
 * server-side by Payload's RSC route as part of the Description /
 * Status slot pattern) with our edit chrome. The actual table of
 * versions arrives via the Description slot.
 *
 * Diff rendering for individual versions lives in CmsVersionView.
 */
export const CmsVersionsView = (props: DocumentViewClientProps): ReactElement => {
  const {
    Description,
    Status,
    PreviewButton,
    PublishButton,
    SaveButton,
    SaveDraftButton,
    UnpublishButton,
    LivePreview,
    EditMenuItems,
    documentSubViewType,
    BeforeDocumentControls,
  } = props;

  return (
    <EditChrome
      documentSubViewType={documentSubViewType}
      controls={
        <>
          {PreviewButton}
          {SaveDraftButton}
          {PublishButton}
          {SaveButton}
          {UnpublishButton}
        </>
      }
      {...(Description !== undefined ? { description: Description } : {})}
      {...(Status !== undefined ? { status: Status } : {})}
      {...(EditMenuItems !== undefined ? { menuItems: EditMenuItems } : {})}
      {...(BeforeDocumentControls !== undefined
        ? { beforeControls: BeforeDocumentControls }
        : {})}
      {...(LivePreview !== undefined ? { livePreview: LivePreview } : {})}
    />
  );
};

export default CmsVersionsView;
