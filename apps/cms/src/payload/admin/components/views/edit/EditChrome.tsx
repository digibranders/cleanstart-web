'use client';

import type { DocumentSubViewTypes } from 'payload';
import type { ReactElement, ReactNode } from 'react';

type Props = {
  readonly controls: ReactNode;
  readonly form: ReactNode;
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
 *   - left  · the form (`<DocumentFields>`, supplied via `form` slot)
 *   - right · status, controls, optional live-preview pane
 *
 * On `documentSubViewType === 'version'` or `'versions'` Payload's own
 * version pane mounts in place of the form via the same `form` slot,
 * so our chrome stays consistent across edit / version subviews.
 */
export const EditChrome = (props: Props): ReactElement => {
  const {
    controls,
    form,
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
        <div className="cs-edit__form-col">{form}</div>
        {livePreview ? (
          <aside className="cs-edit__preview-col" aria-label="Live preview">
            {livePreview}
          </aside>
        ) : null}
      </div>
    </div>
  );
};
