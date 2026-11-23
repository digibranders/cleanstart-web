import { Icon } from '@/components/icon';
import { PRODUCT_COLOR } from '@/components/charts/palette';
import { CHIP_PRODUCT, TYPE_ICON } from '@/components/documents/doc-style';
import { Badge } from '@/components/ui/badge';
import { fmtLong } from '@/lib/dates';
import { DOCUMENT_TYPE_LABEL } from '@/lib/domain';
import type { DocumentDto } from '@/lib/dto';
import { formatLabel } from '@/server/files/rules';

/** A generated cover: the type icon on the product colour, so there are no images to host or to go stale. */
export function DocCard({
  doc,
  isNew,
  onOpen,
  onDownload,
}: {
  doc: DocumentDto;
  isNew: boolean;
  onOpen: (d: DocumentDto) => void;
  onDownload: (d: DocumentDto) => void;
}): React.JSX.Element {
  const isVideo = doc.type === 'video';
  const color = PRODUCT_COLOR[CHIP_PRODUCT[doc.product]];
  return (
    <article className="dcard">
      <button
        type="button"
        className="dcard-cover"
        style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)` }}
        aria-label={`${isVideo ? 'Watch' : 'Preview'} ${doc.title}`}
        onClick={() => onOpen(doc)}
      >
        <Icon name={TYPE_ICON[doc.type]} />
        <span className="dcard-fmt">{formatLabel(doc)}</span>
        {isNew ? (
          <span className="dcard-new">
            <Badge tone="violet">New</Badge>
          </span>
        ) : null}
      </button>
      <div className="dcard-b">
        <button type="button" className="linkbtn dcard-t" onClick={() => onOpen(doc)}>
          {doc.title}
        </button>
        <span className="dcard-m">
          {DOCUMENT_TYPE_LABEL[doc.type]}, {formatLabel(doc)}
        </span>
        {doc.summary ? <p className="dcard-s">{doc.summary}</p> : null}
        <div className="dcard-f">
          <span className="t-sec tnum">{fmtLong(doc.updatedAt)}</span>
          <button type="button" className="btn btn-s" onClick={() => (isVideo ? onOpen(doc) : onDownload(doc))}>
            <Icon name={isVideo ? 'play' : 'dl'} />
            {isVideo ? 'Watch' : 'Download'}
          </button>
        </div>
      </div>
    </article>
  );
}
