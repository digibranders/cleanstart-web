'use client';

import { Icon } from '@/components/icon';
import { Drawer } from '@/components/ui/overlay';
import type { PortalDocument } from '@/data/documents';

export function DocumentPreview({
  doc,
  onClose,
  onDownload,
}: {
  doc: PortalDocument | null;
  onClose: () => void;
  onDownload: (d: PortalDocument) => void;
}): React.JSX.Element | null {
  if (!doc) return null;
  const isVideo = doc.type === 'Video';
  return (
    <Drawer
      open
      onClose={onClose}
      title={doc.title}
      subtitle={`${doc.type}, ${doc.product}`}
      footer={
        <>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Close
          </button>
          {isVideo ? null : (
            <button type="button" className="btn btn-p" onClick={() => onDownload(doc)}>
              Download
            </button>
          )}
        </>
      }
    >
      {isVideo ? (
        <div
          style={{
            aspectRatio: '16 / 9',
            borderRadius: 8,
            background: '#120E20',
            color: '#FFFFFF',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <span
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              color: '#C9C4DE',
            }}
          >
            <Icon name="play" className="ic" />
            {doc.format}
          </span>
        </div>
      ) : null}
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: '#4A4858' }}>
        {doc.summary ?? `${doc.type}, ${doc.format}`}
      </p>
      <dl className="dl">
        <dt>Type</dt>
        <dd>{doc.type}</dd>
        <dt>Product</dt>
        <dd>{doc.product}</dd>
        <dt>Format</dt>
        <dd>{doc.format}</dd>
        <dt>Updated</dt>
        <dd>{doc.updated}</dd>
        <dt>Opened by your team</dt>
        <dd className="tnum">{doc.ownOpens} times</dd>
      </dl>
      <div className="note note-violet">
        <Icon name="lock" />
        <span>Private to signed-in partners. Share the portal with colleagues, not the file.</span>
      </div>
    </Drawer>
  );
}
