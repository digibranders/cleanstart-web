'use client';

import { useMemo, useState } from 'react';
import { once } from '@/components/documents/doc-view';
import { Icon } from '@/components/icon';
import { Drawer } from '@/components/ui/overlay';
import { fmtLong } from '@/lib/dates';
import { DOC_PRODUCT_LABEL, DOCUMENT_TYPE_LABEL } from '@/lib/domain';
import type { DocumentDto } from '@/lib/dto';
import { formatLabel } from '@/server/files/rules';

/** Counts one open for this viewing. Failing to count never stops the file from showing. */
function useCountOnce(id: string): () => void {
  return useMemo(
    () =>
      once(() => {
        void fetch(`/api/files/${id}/played`, { method: 'POST' }).catch(() => undefined);
      }),
    [id],
  );
}

const frame: React.CSSProperties = { width: '100%', borderRadius: 8, background: '#120E20' };

/** A private file played by the browser's own player; each range request is a new signed redirect from the stream route. */
function VideoPlayer({ doc }: { doc: DocumentDto }): React.JSX.Element {
  const [failed, setFailed] = useState(false);
  const count = useCountOnce(doc.id);
  if (!doc.mime.startsWith('video/') || failed) {
    return (
      <div className="note note-violet" role="status">
        <Icon name="play" />
        <span>This preview file is a placeholder or cannot be played in your browser. Use Download to get the file.</span>
      </div>
    );
  }
  return (
    // biome-ignore lint/a11y/useMediaCaption: partner videos have no caption files yet
    <video
      controls
      preload="metadata"
      playsInline
      aria-label={doc.title}
      src={`/api/files/${doc.id}/stream`}
      style={{ ...frame, aspectRatio: '16 / 9' }}
      onPlay={count}
      onError={() => setFailed(true)}
    />
  );
}

/** The browser's own PDF viewer on the first page. Showing it counts as an open, like a download does. */
function PdfPreview({ doc }: { doc: DocumentDto }): React.JSX.Element {
  const count = useCountOnce(doc.id);
  return (
    <>
      <iframe
        onLoad={count}
        title={`Preview of ${doc.title}`}
        src={`/api/files/${doc.id}/stream#view=FitH`}
        style={{ ...frame, height: 'min(60vh, 520px)', border: '1px solid #E6E4EC', background: '#FFFFFF' }}
      >
        This browser cannot show the PDF here. Use Download.
      </iframe>
      <span className="hint">If the preview stays blank, use Download.</span>
    </>
  );
}

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
      {doc.type === 'video' ? <VideoPlayer key={doc.id} doc={doc} /> : null}
      {doc.type !== 'video' && doc.mime === 'application/pdf' ? <PdfPreview key={doc.id} doc={doc} /> : null}
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
