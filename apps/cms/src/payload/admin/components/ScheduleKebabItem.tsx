'use client';

import { PopupList, useDocumentInfo } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { SchedulePublishDialog } from './SchedulePublishDialog';

/**
 * "Schedule publish…" item mounted in the document kebab menu via
 * `admin.components.edit.editMenuItems`. For existing docs it opens the
 * SchedulePublishDialog in controlled mode; for new docs (no ID yet)
 * the item is disabled with a hint to save a draft first.
 */
export const ScheduleKebabItem = (): ReactElement => {
  const { id } = useDocumentInfo();
  const [open, setOpen] = useState(false);
  const unsaved = id == null;

  return (
    <>
      {unsaved ? (
        <span title="Save a draft first to schedule publish" style={{ display: 'contents' }}>
          <PopupList.Button disabled>
            Schedule publish…
          </PopupList.Button>
        </span>
      ) : (
        <PopupList.Button onClick={() => setOpen(true)}>
          Schedule publish…
        </PopupList.Button>
      )}
      {!unsaved && (
        <SchedulePublishDialog open={open} onClose={() => setOpen(false)} />
      )}
    </>
  );
};

export default ScheduleKebabItem;
