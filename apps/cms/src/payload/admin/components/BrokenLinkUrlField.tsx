'use client';

import type { ReactElement } from 'react';
import { useFormFields } from '@payloadcms/ui';

/**
 * Detail-view field for the broken URL — renders it as a clickable
 * external link (new tab) so an editor can verify it, plus the resolved
 * final URL when the link redirects.
 */
export const BrokenLinkUrlField = (): ReactElement => {
  const url = useFormFields(([fields]) => fields.url?.value as string | undefined);
  const finalUrl = useFormFields(([fields]) => fields.finalUrl?.value as string | undefined);
  return (
    <div className="field-type cs-broken-url-field">
      <div className="field-label">Broken URL</div>
      <div>
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer">
            {url}
          </a>
        ) : (
          '—'
        )}
      </div>
      {finalUrl ? (
        <div className="cs-broken-url-field__final">
          ↳ redirects to{' '}
          <a href={finalUrl} target="_blank" rel="noopener noreferrer">
            {finalUrl}
          </a>
        </div>
      ) : null}
    </div>
  );
};

export default BrokenLinkUrlField;
