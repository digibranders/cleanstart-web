'use client';

import type { ReactElement } from 'react';
import { useFormFields } from '@payloadcms/ui';

import { collectionUrlFromSlug } from '@/payload/lib/route-prefixes';

/**
 * Detail-view UI field — links to the source doc's admin edit page (where
 * the link gets fixed) and, when resolvable, its live public URL. Reads
 * sibling field values via the data-layer `useFormFields` hook.
 */
export const SourcePageLinkField = (): ReactElement => {
  const collection = useFormFields(([f]) => f.sourceCollection?.value as string | undefined);
  const id = useFormFields(([f]) => f.sourceDocId?.value as string | undefined);
  const slug = useFormFields(([f]) => f.sourceDocSlug?.value as string | undefined);
  const title = useFormFields(([f]) => f.sourceDocTitle?.value as string | undefined);
  const location = useFormFields(([f]) => f.location?.value as string | undefined);

  const adminHref = collection && id ? `/admin/collections/${collection}/${id}` : null;
  const liveHref = collection && slug ? collectionUrlFromSlug(collection, slug) : null;

  return (
    <div className="field-type cs-source-page-field">
      <div className="field-label">Source page</div>
      <div>
        {adminHref ? <a href={adminHref}>{title || `${collection}/${id}`}</a> : title || '—'}
        {liveHref ? (
          <>
            {' · '}
            <a href={liveHref} target="_blank" rel="noopener noreferrer">
              view live ↗
            </a>
          </>
        ) : null}
      </div>
      {location ? <div className="cs-source-page-field__loc">Location on page: {location}</div> : null}
    </div>
  );
};

export default SourcePageLinkField;
