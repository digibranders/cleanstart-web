'use client';

import type { DocumentSubViewTypes } from 'payload';
import type { ReactElement, ReactNode } from 'react';

type Props = {
  readonly controls: ReactNode;
  readonly description?: ReactNode;
  readonly status?: ReactNode;
  readonly beforeControls?: ReactNode;
  readonly menuItems?: ReactNode;
  readonly livePreview?: ReactNode;
  readonly upload?: ReactNode;
  readonly uploadControls?: ReactNode;
  readonly documentSubViewType: DocumentSubViewTypes;
};

/**
 * Edit-view layout shell. Two columns at desktop:
 *   - left  · the form (rendered by Payload one layer below us)
 *   - right · status, controls, custom sidebar fields
 *
 * On `documentSubViewType === 'version'` or `'versions'` Payload's
 * own version pane mounts in place of the form column; our chrome
 * still wraps it so the action bar stays consistent.
 */
export const EditChrome = (props: Props): ReactElement => {
  const {
    controls,
    description,
    status,
    beforeControls,
    menuItems,
    livePreview,
    upload,
    uploadControls,
    documentSubViewType,
  } = props;

  return (
    <div
      className={`cs-edit cs-edit--${documentSubViewType}`}
      data-sub-view={documentSubViewType}
    >
      <header className="cs-edit__bar">
        <div className="cs-edit__bar-left">
          {status ? <span className="cs-edit__status">{status}</span> : null}
          {description ? <div className="cs-edit__description">{description}</div> : null}
        </div>
        <div className="cs-edit__bar-right">
          {beforeControls}
          {controls}
          {menuItems ? <div className="cs-edit__menu">{menuItems}</div> : null}
        </div>
      </header>

      {upload || uploadControls ? (
        <section className="cs-edit__upload" aria-label="Upload">
          {upload}
          {uploadControls}
        </section>
      ) : null}

      <div className="cs-edit__body">
        <div className="cs-edit__form-col">
          {/*
            The actual <form> tree (RenderFields, errors, autosave plumbing)
            is composed below us by Payload's document RSC route. We are the
            chrome around it. children of <CmsEditView> arrive automatically
            via the route's render — nothing more to mount here.
          */}
        </div>
        {livePreview ? (
          <aside className="cs-edit__preview-col" aria-label="Live preview">
            {livePreview}
          </aside>
        ) : null}
      </div>
    </div>
  );
};
