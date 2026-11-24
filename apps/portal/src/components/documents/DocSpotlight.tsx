import { DocCover } from '@/components/documents/DocCover';
import { coverStatus } from '@/components/documents/DocCard';
import { TYPE_ICON, TYPE_TONE } from '@/components/documents/doc-style';
import { Icon } from '@/components/icon';
import { fmtLong } from '@/lib/dates';
import { DOCUMENT_TYPE_LABEL } from '@/lib/domain';
import type { DocumentDto } from '@/lib/dto';

/** The wide card the library leads with. `actions` is the button row, so staff and partners get their own. */
export function DocSpotlight({
  doc,
  kicker,
  isNew,
  onOpen,
  actions,
}: {
  doc: DocumentDto;
  kicker: string;
  isNew: boolean;
  onOpen: (d: DocumentDto) => void;
  actions: React.ReactNode;
}): React.JSX.Element {
  return (
    <article className="dspot" data-product={doc.product} aria-label={`${kicker}: ${doc.title}`}>
      <button type="button" className="dspot-cover" aria-label={`${doc.type === 'video' ? 'Watch' : 'Open'} ${doc.title}`} onClick={() => onOpen(doc)}>
        <DocCover doc={doc} status={coverStatus(doc, isNew)} />
      </button>
      <div className="dspot-b">
        <span className="dspot-k">{kicker}</span>
        <h2 className="dspot-t">{doc.title}</h2>
        {doc.summary ? <p className="dspot-s">{doc.summary}</p> : null}
        <span className="dspot-m tnum">
          {DOCUMENT_TYPE_LABEL[doc.type]}, updated {fmtLong(doc.updatedAt)}
        </span>
        <div className="dspot-a">{actions}</div>
      </div>
    </article>
  );
}

export interface RailItem {
  doc: DocumentDto;
  note: string;
}

/** A short list beside the spotlight: what needs a look (staff) or what changed lately (partners). */
export function DocRail({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: readonly RailItem[];
  onSelect: (d: DocumentDto) => void;
}): React.JSX.Element {
  return (
    <section className="drail" aria-label={title}>
      <h2 className="drail-h">{title}</h2>
      <ul className="drail-l">
        {items.map(({ doc, note }) => (
          <li key={doc.id}>
            <button type="button" className="drail-i" onClick={() => onSelect(doc)}>
              <span className={`li-ic ${TYPE_TONE[doc.type]}`}>
                <Icon name={TYPE_ICON[doc.type]} />
              </span>
              <span className="li-t">
                <span className="li-n drail-n">{doc.title}</span>
                <span className="li-s">{note}</span>
              </span>
              <Icon name="caret" className="drail-c" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
