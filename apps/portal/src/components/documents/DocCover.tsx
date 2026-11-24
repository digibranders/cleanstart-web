import { Icon } from '@/components/icon';
import { TYPE_ICON } from '@/components/documents/doc-style';
import { DOC_PRODUCT_LABEL } from '@/lib/domain';
import type { DocumentDto } from '@/lib/dto';
import { formatLabel } from '@/server/files/rules';

/**
 * The artwork on a document card, generated so there is nothing to host or to go stale: a dark cover lit in the
 * product's colour, with a tilted sheet for a file or a play disc for a video. A video with a poster shows the poster.
 * It renders inside a button, so it is spans only. `status` is the top right chip (New, Draft, Expired).
 */
export function DocCover({ doc, status }: { doc: DocumentDto; status?: React.ReactNode }): React.JSX.Element {
  const isVideo = doc.type === 'video';
  return (
    <span className="dcover" data-type={doc.type}>
      {isVideo && doc.hasPoster ? <img className="dcover-img" src={`/api/files/${doc.id}/poster`} alt="" loading="lazy" decoding="async" /> : null}
      {isVideo ? (
        <span className="dcover-play">
          <Icon name="play" />
        </span>
      ) : (
        <span className="dcover-sheet">
          <Icon name={TYPE_ICON[doc.type]} />
        </span>
      )}
      <span className="dcover-chip dcover-product">{DOC_PRODUCT_LABEL[doc.product]}</span>
      <span className="dcover-chip dcover-fmt">{formatLabel(doc)}</span>
      {status ? <span className="dcover-st">{status}</span> : null}
    </span>
  );
}
