'use client';

import { useState } from 'react';
import { AudiencePicker } from '@/components/documents/AudiencePicker';
import { type AudienceDraft, draftToInput, emptyAudienceDraft } from '@/components/documents/doc-view';
import { uploadFile } from '@/components/documents/upload-client';
import { Icon } from '@/components/icon';
import { Dropdown } from '@/components/ui/dropdown';
import { useToast } from '@/components/ui/toast';
import type { AudiencePartnerDto } from '@/lib/document-upload';
import {
  DOC_PRODUCT_LABEL,
  DOC_PRODUCTS,
  DOCUMENT_TYPE_LABEL,
  DOCUMENT_TYPES,
  type DocProduct,
  type DocumentType,
  isOneOf,
} from '@/lib/domain';
import { createDocumentAction, createUploadTicketAction } from '@/server/actions/documents';
import { issuesToErrors } from '@/server/actions/result';
import { UPLOAD_ACCEPT } from '@/server/files/rules';

const TYPE_OPTIONS = DOCUMENT_TYPES.map((t) => ({ value: t, label: DOCUMENT_TYPE_LABEL[t] }));
const PRODUCT_OPTIONS = DOC_PRODUCTS.map((p) => ({ value: p, label: DOC_PRODUCT_LABEL[p] }));

export function UploadDocumentForm({
  onClose,
  partners,
}: {
  onClose: () => void;
  partners: readonly AudiencePartnerDto[];
}): React.JSX.Element {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<DocumentType>('datasheet');
  const [product, setProduct] = useState<DocProduct>('all');
  const [draft, setDraft] = useState<AudienceDraft>(emptyAudienceDraft);
  const [file, setFile] = useState<File | null>(null);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const audience = draftToInput(draft, partners);
  const titleErr =
    serverErrors.title ?? (tried && title.trim() === '' ? 'Give the document a title.' : null);
  const fileErr = serverErrors.file ?? (tried && file === null ? 'Choose a file to upload.' : null);
  const audienceErr =
    tried && !audience.ok
      ? audience.error
      : (serverErrors['audience.categories'] ?? serverErrors['audience.partnerIds'] ?? null);

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setTried(true);
    setFormError(null);
    setServerErrors({});
    if (busy || title.trim() === '' || file === null || !audience.ok) return;
    setBusy(true);
    setProgress(0);
    const uploaded = await uploadFile({
      file,
      requestTicket: () =>
        createUploadTicketAction({ mode: 'create', originalName: file.name, size: file.size }),
      onProgress: setProgress,
    });
    if (!uploaded.ok) {
      setBusy(false);
      setFormError(uploaded.error.message);
      return;
    }
    const created = await createDocumentAction({
      title: title.trim(),
      type: docType,
      product,
      summary: null,
      durationMinutes: null,
      audience: audience.audience,
      file: uploaded.data,
    });
    setBusy(false);
    if (!created.ok) {
      setServerErrors(issuesToErrors(created.error));
      setFormError(created.error.message);
      return;
    }
    toast(`Uploaded ${created.data.title}`);
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
            <span className="li-n">
              {busy
                ? `Uploading ${file?.name ?? ''}, ${progress}%`
                : file
                  ? file.name
                  : 'Choose a file or drop it here'}
            </span>
            <span className="li-s">PDF, PPTX, DOCX, XLSX, MP4 or ZIP, up to 100 MB</span>
          </span>
          <input
            type="file"
            className="sr"
            accept={UPLOAD_ACCEPT}
            disabled={busy}
            aria-invalid={fileErr ? true : undefined}
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setServerErrors({});
            }}
          />
        </label>
        {fileErr ? (
          <span className="err" role="alert">
            {fileErr}
          </span>
        ) : null}
        <div className="fg">
          <label htmlFor="dt" className="lbl">
            Title
          </label>
          <input
            id="dt"
            className={`field${titleErr ? ' field-err' : ''}`}
            type="text"
            value={title}
            placeholder="The name partners will see"
            onChange={(e) => setTitle(e.target.value)}
            disabled={busy}
            aria-invalid={titleErr ? true : undefined}
            aria-describedby={titleErr ? 'dt-err' : undefined}
          />
          {titleErr ? (
            <span id="dt-err" className="err">
              {titleErr}
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
              options={TYPE_OPTIONS}
              onChange={(v) => {
                if (isOneOf(DOCUMENT_TYPES, v)) setDocType(v);
              }}
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
              options={PRODUCT_OPTIONS}
              onChange={(v) => {
                if (isOneOf(DOC_PRODUCTS, v)) setProduct(v);
              }}
            />
          </div>
        </div>
        <AudiencePicker
          idPrefix="up"
          draft={draft}
          onChange={setDraft}
          error={audienceErr}
          disabled={busy}
        />
        {draft.kind === 'categories' && draft.categories.length === 0 && !audienceErr ? (
          <span className="hint">Nobody can open this until you choose who.</span>
        ) : null}
        <div className="note note-violet">
          <Icon name="lock" />
          <span>Partners get a short-lived link each time they open it.</span>
        </div>
        {formError ? (
          <div className="note note-amber" role="alert">
            <span>{formError}</span>
          </div>
        ) : null}
        <button
          type="submit"
          className="btn btn-p"
          style={{ alignSelf: 'flex-start' }}
          disabled={busy}
        >
          <Icon name="upload" />
          {busy ? 'Uploading' : 'Upload document'}
        </button>
      </div>
    </form>
  );
}
