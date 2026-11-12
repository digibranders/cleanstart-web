'use client';

import { useState } from 'react';
import { Icon } from '@/components/icon';
import { Badge } from '@/components/ui/badge';
import { Drawer } from '@/components/ui/overlay';
import { useToast } from '@/components/ui/toast';
import {
  adminUpdatedLabel,
  audienceLabel,
  audienceTone,
  deleteDocument,
  replaceDocument,
  type PortalDocument,
} from '@/data/documents';

export function DocumentEditDrawer({
  doc,
  onClose,
}: {
  doc: PortalDocument;
  onClose: () => void;
}): React.JSX.Element {
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);

  const remove = (): void => {
    deleteDocument(doc.id);
    onClose();
    toast(`Deleted ${doc.title}`);
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={doc.title}
      subtitle={`${doc.type}, ${doc.format}`}
      footer={
        confirming ? (
          <>
            <button type="button" className="btn btn-s" onClick={() => setConfirming(false)}>
              Keep it
            </button>
            <button type="button" className="btn btn-dd" onClick={remove}>
              Delete document
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-d"
              onClick={() => setConfirming(true)}
              style={{ marginRight: 'auto' }}
            >
              <Icon name="trash" />
              Delete
            </button>
            <label className="btn btn-s" style={{ cursor: 'pointer' }}>
              Replace file
              <input
                type="file"
                className="sr"
                onChange={(e) => {
                  if (!e.target.files?.[0]) return;
                  replaceDocument(doc.id);
                  toast(`New version of ${doc.title} uploaded`);
                  e.target.value = '';
                }}
              />
            </label>
            <button type="button" className="btn btn-p" onClick={onClose}>
              Done
            </button>
          </>
        )
      }
    >
      <dl className="dl">
        <dt>Product</dt>
        <dd>{doc.product}</dd>
        <dt>Who can open it</dt>
        <dd>
          <Badge tone={audienceTone(doc.audience)}>{audienceLabel(doc.audience)}</Badge>
        </dd>
        <dt>Updated</dt>
        <dd>{adminUpdatedLabel(doc)}</dd>
        <dt>Opens</dt>
        <dd className="tnum">
          {doc.opens}, by people at {doc.partnerCount} partners
        </dd>
      </dl>
      <div className="note note-violet">
        <Icon name="lock" />
        <span>
          Partners get a short-lived link each time they open it. Replacing the file keeps this link
          and the open count.
        </span>
      </div>
      {confirming ? (
        <div className="note note-amber" role="alert">
          <span>Delete {doc.title}? Partners lose access at once. This cannot be undone.</span>
        </div>
      ) : null}
    </Drawer>
  );
}
