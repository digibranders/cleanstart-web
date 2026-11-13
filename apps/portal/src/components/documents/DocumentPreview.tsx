'use client';

import { Icon } from '@/components/icon';
import { Drawer } from '@/components/ui/overlay';
import { fmtLong } from '@/lib/dates';
import { DOC_PRODUCT_LABEL, DOCUMENT_TYPE_LABEL } from '@/lib/domain';
import type { DocumentDto } from '@/lib/dto';
import { formatLabel } from '@/server/files/rules';

export function DocumentPreview({
  doc,
  onClose,
  onDownload,
}: {
  doc: DocumentDto | null;
  onClose: () => void;
  onDownload: (d: DocumentDto) => void;
}): React.JSX.Element | null {
  if (!doc) return null;
  const isVideo = doc.type === 'video';
  const format = formatLabel(doc);
  return (
    <Drawer
      open
      onClose={onClose}
      title={doc.title}
      subtitle={`${DOCUMENT_TYPE_LABEL[doc.type]}, ${DOC_PRODUCT_LABEL[doc.product]}`}
      footer={
        <>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn btn-p" onClick={() => onDownload(doc)}>
            Download
          </button>
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
            {format}
          </span>
        </div>
      ) : null}
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: '#4A4858' }}>
        {doc.summary ?? `${DOCUMENT_TYPE_LABEL[doc.type]}, ${format}`}
      </p>
      <dl className="dl">
        <dt>Type</dt>
        <dd>{DOCUMENT_TYPE_LABEL[doc.type]}</dd>
        <dt>Product</dt>
        <dd>{DOC_PRODUCT_LABEL[doc.product]}</dd>
        <dt>Format</dt>
        <dd>{format}</dd>
        <dt>Updated</dt>
        <dd>{fmtLong(doc.updatedAt)}</dd>
        <dt>Opened by your team</dt>
        <dd className="tnum">{doc.ownOpens ?? 0} times</dd>
      </dl>
      <div className="note note-violet">
        <Icon name="lock" />
        <span>Private to signed-in partners. Share the portal with colleagues, not the file.</span>
      </div>
    </Drawer>
  );
}
