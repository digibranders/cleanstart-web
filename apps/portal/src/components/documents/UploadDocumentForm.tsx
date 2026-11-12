'use client';

import { useState } from 'react';
import { Icon } from '@/components/icon';
import { Dropdown } from '@/components/ui/dropdown';
import { useToast } from '@/components/ui/toast';
import {
  addDocument,
  DOC_PRODUCTS,
  DOC_TYPES,
  PARTNER_CATEGORIES,
  type DocAudience,
  type DocType,
} from '@/data/documents';
import type { Product } from '@/components/ui/badge';

type AudienceKind = DocAudience['kind'];

const AUDIENCES: ReadonlyArray<{ kind: AudienceKind; label: string }> = [
  { kind: 'all', label: 'Everyone' },
  { kind: 'categories', label: 'Categories' },
  { kind: 'partners', label: 'Named partners' },
];

const parseNames = (text: string): string[] =>
  text
    .split(',')
    .map((n) => n.trim())
    .filter((n) => n !== '');

export function UploadDocumentForm({ onClose }: { onClose: () => void }): React.JSX.Element {
  const toast = useToast();
  const [title, setTitle] = useState('Clean Libraries pricing guide for partners');
  const [docType, setDocType] = useState<DocType>('Datasheet');
  const [product, setProduct] = useState<Product>('Clean Libraries');
  const [kind, setKind] = useState<AudienceKind>('categories');
  const [cats, setCats] = useState<string[]>(['Distributors', 'Channel partners']);
  const [partnersText, setPartnersText] = useState('Kestrel Systems, Saffron Secure');
  const [fileName, setFileName] = useState('');
  const [tried, setTried] = useState(false);

  const titleErr = tried && title.trim() === '';
  const partnersErr = tried && kind === 'partners' && parseNames(partnersText).length === 0;

  const submit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setTried(true);
    if (title.trim() === '' || (kind === 'partners' && parseNames(partnersText).length === 0))
      return;
    const audience: DocAudience =
      kind === 'all'
        ? { kind: 'all' }
        : kind === 'categories'
          ? { kind: 'categories', categories: cats }
          : { kind: 'partners', partners: parseNames(partnersText) };
    const created = addDocument({ title: title.trim(), type: docType, product, audience });
    toast(`Uploaded ${created.title}`);
    onClose();
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-labelledby="up"
      className="card clip"
      style={{ flex: '0 1 340px', minWidth: 300 }}
    >
      <div className="card-h">
        <h2 id="up" className="card-t">
          Upload a document
        </h2>
        <button
          type="button"
          className="ibtn"
          onClick={onClose}
          aria-label="Close upload"
          style={{ width: 24, height: 24 }}
        >
          <Icon name="x" />
        </button>
      </div>
      <div className="card-b" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: 10,
            border: '1px dashed #CFC8EE',
            borderRadius: 8,
            background: '#FCFBFE',
            cursor: 'pointer',
          }}
        >
          <span className="li-ic tone-violet">
            <Icon name="upload" />
          </span>
          <span className="li-t">
            <span className="li-n">{fileName || 'Choose a file or drop it here'}</span>
            <span className="li-s">PDF, ZIP or MP4, up to 500 MB</span>
          </span>
          <input
            type="file"
            className="sr"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
          />
        </label>
        <div className="fg">
          <label htmlFor="dt" className="lbl">
            Title
          </label>
          <input
            id="dt"
            className={`field${titleErr ? ' field-err' : ''}`}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={titleErr ? true : undefined}
            aria-describedby={titleErr ? 'dt-err' : undefined}
          />
          {titleErr ? (
            <span id="dt-err" className="err">
              Give the document a title.
            </span>
          ) : null}
        </div>
        <div className="grid2" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <div className="fg">
            <label htmlFor="dty" className="lbl">
              Type
            </label>
            <Dropdown
              id="dty"
              variant="field"
              value={docType}
              options={DOC_TYPES}
              onChange={(v) => setDocType(v as DocType)}
            />
          </div>
          <div className="fg">
            <label htmlFor="dpr" className="lbl">
              Product
            </label>
            <Dropdown
              id="dpr"
              variant="field"
              value={product}
              options={DOC_PRODUCTS}
              onChange={(v) => setProduct(v as Product)}
            />
          </div>
        </div>
        <div className="fg">
          <span id="aud" className="lbl">
            Who can open it
          </span>
          <div
            className="seg"
            role="group"
            aria-labelledby="aud"
            style={{ alignSelf: 'flex-start' }}
          >
            {AUDIENCES.map((a) => (
              <button
                key={a.kind}
                type="button"
                className={`seg-b${a.kind === kind ? ' seg-on' : ''}`}
                aria-pressed={a.kind === kind}
                onClick={() => setKind(a.kind)}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
        {kind === 'categories' ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PARTNER_CATEGORIES.map((c) => {
              const on = cats.includes(c);
              return (
                <label
                  key={c}
                  className={`badge ${on ? 'b-violet' : 'b-neutral'}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 26,
                    padding: '0 8px',
                    borderRadius: 6,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => setCats(on ? cats.filter((x) => x !== c) : [...cats, c])}
                    style={{ width: 13, height: 13, margin: 0, accentColor: '#4B23C8' }}
                  />
                  {c}
                </label>
              );
            })}
          </div>
        ) : null}
        {kind === 'partners' ? (
          <div className="fg">
            <label htmlFor="dpa" className="lbl">
              Partners
            </label>
            <input
              id="dpa"
              className={`field${partnersErr ? ' field-err' : ''}`}
              type="text"
              value={partnersText}
              onChange={(e) => setPartnersText(e.target.value)}
              aria-invalid={partnersErr ? true : undefined}
              aria-describedby={partnersErr ? 'dpa-err' : 'dpa-hint'}
            />
            {partnersErr ? (
              <span id="dpa-err" className="err">
                Name at least one partner.
              </span>
            ) : (
              <span id="dpa-hint" className="hint">
                Separate partner names with commas.
              </span>
            )}
          </div>
        ) : null}
        <div className="note note-violet">
          <Icon name="lock" />
          <span>Partners get a short-lived link each time they open it.</span>
        </div>
        <button type="submit" className="btn btn-p" style={{ alignSelf: 'flex-start' }}>
          <Icon name="upload" />
          Upload document
        </button>
      </div>
    </form>
  );
}
