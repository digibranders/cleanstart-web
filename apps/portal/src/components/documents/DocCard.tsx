import { DocCover } from '@/components/documents/DocCover';
import { adminUpdatedLabel, audienceTone } from '@/components/documents/doc-view';
import { Icon } from '@/components/icon';
import { ActionMenu } from '@/components/ui/action-menu';
import { Badge } from '@/components/ui/badge';
import { fmtLong } from '@/lib/dates';
import { DOCUMENT_TYPE_LABEL } from '@/lib/domain';
import type { DocumentDto } from '@/lib/dto';
import { audienceLabel } from '@/server/files/rules';

/** What only staff get on a card: how the document is doing, who can open it, and the way to edit it. */
export interface DocCardStaff {
  today: string;
  onEdit: (d: DocumentDto) => void;
}

/** The chip on the cover: a state a person should notice, never decoration. */
export function coverStatus(doc: DocumentDto, isNew: boolean): React.ReactNode {
  if (doc.expired) return <Badge tone="expired">Expired</Badge>;
  if (doc.status === 'draft') return <Badge tone="pending">Draft</Badge>;
  return isNew ? <Badge tone="violet">New</Badge> : null;
}

export function DocCard({
  doc,
  isNew,
  index,
  onOpen,
  onDownload,
  staff,
}: {
  doc: DocumentDto;
  isNew: boolean;
  /** Position in the library, for the staggered entrance. */
  index: number;
  onOpen: (d: DocumentDto) => void;
  onDownload: (d: DocumentDto) => void;
  staff?: DocCardStaff;
}): React.JSX.Element {
  const isVideo = doc.type === 'video';
  const state = doc.expired ? 'expired' : doc.status === 'draft' ? 'draft' : 'live';
  const opens = doc.opens ?? 0;
  return (
    <article
      className="dcard"
      data-product={doc.product}
      data-state={state}
      style={{ '--i': Math.min(index, 11) } as React.CSSProperties}
    >
      <button type="button" className="dcard-cover" aria-label={`${isVideo ? 'Watch' : 'Open'} ${doc.title}`} onClick={() => onOpen(doc)}>
        <DocCover doc={doc} status={coverStatus(doc, isNew)} />
      </button>
      <div className="dcard-b">
        <span className="dcard-k">{DOCUMENT_TYPE_LABEL[doc.type]}</span>
        <button type="button" className="linkbtn dcard-t" onClick={() => onOpen(doc)}>
          {doc.title}
        </button>
        {doc.summary ? <p className="dcard-s">{doc.summary}</p> : null}
        {staff ? (
          <>
            <dl className="dstats">
              <div>
                <dt>Opens</dt>
                <dd>{opens}</dd>
              </div>
              <div>
                <dt>Partners</dt>
                <dd>{doc.partnerCount ?? 0}</dd>
              </div>
              <div>
                <dt>Last opened</dt>
                <dd className={doc.lastOpenedAt ? undefined : 'dstat-warn'}>{doc.lastOpenedAt ? adminUpdatedLabel(doc.lastOpenedAt, staff.today) : 'Never'}</dd>
              </div>
            </dl>
            <div className="dcard-aud">
              <Icon name="lock" />
              <Badge tone={audienceTone(doc.audience.kind)}>{audienceLabel(doc.audience)}</Badge>
            </div>
          </>
        ) : null}
        <div className="dcard-f">
          <span className="t-sec tnum">{staff ? `Updated ${adminUpdatedLabel(doc.updatedAt, staff.today)}` : fmtLong(doc.updatedAt)}</span>
          {staff ? (
            <div className="dcard-acts">
              <button type="button" className="btn btn-s" onClick={() => staff.onEdit(doc)}>
                Edit
              </button>
              <ActionMenu
                label="More"
                ariaLabel={`More actions for ${doc.title}`}
                items={[
                  { label: isVideo ? 'Watch' : 'Open', onSelect: () => onOpen(doc) },
                  { label: 'Download', onSelect: () => onDownload(doc) },
                ]}
              />
            </div>
          ) : (
            <button type="button" className="btn btn-s" onClick={() => (isVideo ? onOpen(doc) : onDownload(doc))}>
              <Icon name={isVideo ? 'play' : 'dl'} />
              {isVideo ? 'Watch' : 'Download'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
