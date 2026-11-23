'use client';

import { useRef, useState } from 'react';
import { AudiencePicker } from '@/components/documents/AudiencePicker';
import { DocumentDetailSections } from '@/components/documents/DocumentDetailSections';
import { DocumentMediaSection } from '@/components/documents/DocumentMediaSection';
import {
  adminUpdatedLabel,
  type AudienceDraft,
  audienceInputOf,
  audienceTone,
  draftFromAudience,
  draftToInput,
  sameAudience,
} from '@/components/documents/doc-view';
import { uploadFile } from '@/components/documents/upload-client';
import { Icon } from '@/components/icon';
import { Badge } from '@/components/ui/badge';
import { Dropdown } from '@/components/ui/dropdown';
import { Drawer } from '@/components/ui/overlay';
import { useToast } from '@/components/ui/toast';
import type { AudiencePartnerDto } from '@/lib/document-upload';
import {
  DOC_PRODUCT_LABEL,
  DOC_PRODUCTS,
  DOCUMENT_TYPE_LABEL,
  DOCUMENT_TYPES,
  type DocProduct,
  type DocumentStatus,
  type DocumentType,
  isOneOf,
} from '@/lib/domain';
import type { DocumentDto } from '@/lib/dto';
import {
  createUploadTicketAction,
  deleteDocumentAction,
  replaceDocumentFileAction,
  updateDocumentAction,
} from '@/server/actions/documents';
import { audienceLabel, formatLabel, UPLOAD_ACCEPT } from '@/server/files/rules';

const TYPE_OPTIONS = DOCUMENT_TYPES.map((t) => ({ value: t, label: DOCUMENT_TYPE_LABEL[t] }));
const DOCUMENT_STATUS_OPTIONS: ReadonlyArray<{ value: DocumentStatus; label: string }> = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];
const PRODUCT_OPTIONS = DOC_PRODUCTS.map((p) => ({ value: p, label: DOC_PRODUCT_LABEL[p] }));

export function DocumentEditDrawer({
  doc,
  partners,
  today,
  onClose,
}: {
  doc: DocumentDto;
  partners: readonly AudiencePartnerDto[];
  today: string;
  onClose: () => void;
}): React.JSX.Element {
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(doc.title);
  const [docType, setDocType] = useState<DocumentType>(doc.type);
  const [product, setProduct] = useState<DocProduct>(doc.product);
  const [summary, setSummary] = useState(doc.summary ?? '');
  const [status, setStatus] = useState<DocumentStatus>(doc.status);
  const [expiresOn, setExpiresOn] = useState(doc.expiresAt ? doc.expiresAt.slice(0, 10) : '');
  const [changeNote, setChangeNote] = useState('');
  const [fileRefresh, setFileRefresh] = useState(0);
  const titleRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<AudienceDraft>(() => draftFromAudience(doc.audience));

  const audience = draftToInput(draft, partners);
  const fieldError =
    title.trim() === '' ? 'Give the document a title.' : audience.ok ? null : audience.error;
  const changed =
    title.trim() !== doc.title ||
    docType !== doc.type ||
    product !== doc.product ||
    summary.trim() !== (doc.summary ?? '') ||
    status !== doc.status ||
    expiresOn !== (doc.expiresAt ? doc.expiresAt.slice(0, 10) : '') ||
    !audience.ok ||
    !sameAudience(audience.audience, audienceInputOf(doc.audience));

  const save = async (): Promise<void> => {
    if (busy) return;
    if (fieldError || !audience.ok) {
      setError(fieldError);
      return;
    }
    setBusy(true);
    setError(null);
    const result = await updateDocumentAction({
      id: doc.id,
      title: title.trim(),
      type: docType,
      product,
      summary: summary.trim() === '' ? null : summary.trim(),
      audience: audience.audience,
      status,
      expiresOn: expiresOn === '' ? null : expiresOn,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    toast(status !== doc.status && status === 'published' ? `Published ${result.data.title}` : `Saved ${result.data.title}`);
    onClose();
  };

  const replace = async (file: File): Promise<void> => {
    setBusy(true);
    setError(null);
    setProgress(0);
    const uploaded = await uploadFile({
      file,
      requestTicket: () =>
        createUploadTicketAction({
          mode: 'replace',
          documentId: doc.id,
          originalName: file.name,
          size: file.size,
        }),
      onProgress: setProgress,
    });
    if (!uploaded.ok) {
      setBusy(false);
      setProgress(null);
      setError(uploaded.error.message);
      return;
    }
    const result = await replaceDocumentFileAction({ id: doc.id, file: uploaded.data, changeNote: changeNote.trim() === '' ? null : changeNote.trim() });
    setBusy(false);
    setProgress(null);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setChangeNote('');
    setFileRefresh((n) => n + 1);
    toast(`New version of ${doc.title} uploaded`);
  };

  const remove = async (): Promise<void> => {
    if (busy) return;
    setBusy(true);
    const result = await deleteDocumentAction({ id: doc.id });
    setBusy(false);
    if (!result.ok) {
      setConfirming(false);
      setError(result.error.message);
      return;
    }
    onClose();
    toast(`Deleted ${doc.title}`);
  };

  return (
    <Drawer
      open
      onClose={onClose}
      initialFocus={titleRef}
      title={doc.title}
      subtitle={`${DOCUMENT_TYPE_LABEL[doc.type]}, ${formatLabel(doc)}`}
      footer={
        confirming ? (
          <>
            <button
              type="button"
              className="btn btn-s"
              onClick={() => setConfirming(false)}
              disabled={busy}
            >
              Keep it
            </button>
            <button
              type="button"
              className="btn btn-dd"
              onClick={() => void remove()}
              disabled={busy}
            >
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
              disabled={busy}
            >
              <Icon name="trash" />
              Delete
            </button>
            <label className="btn btn-s" style={{ cursor: busy ? 'default' : 'pointer' }}>
              {progress === null ? 'Replace file' : `Uploading ${progress}%`}
              <input
                type="file"
                className="sr"
                accept={UPLOAD_ACCEPT}
                disabled={busy}
                onChange={(e) => {
                  const picked = e.target.files?.[0];
                  e.target.value = '';
                  if (picked) void replace(picked);
                }}
              />
            </label>
            <button
              type="button"
              className="btn btn-p"
              onClick={() => (changed ? void save() : onClose())}
              disabled={busy}
            >
              {changed ? 'Save changes' : 'Close'}
            </button>
          </>
        )
      }
    >
      <dl className="dl">
        <dt>Who can open it</dt>
        <dd>
          <Badge tone={audienceTone(doc.audience.kind)}>{audienceLabel(doc.audience)}</Badge>
        </dd>
        <dt>Status</dt>
        <dd>
          {doc.status === 'draft' ? <Badge tone="pending">Draft</Badge> : <Badge tone="accepted">Published</Badge>}{' '}
          {doc.expired ? <Badge tone="expired">Expired</Badge> : null}
        </dd>
        <dt>Updated</dt>
        <dd>{adminUpdatedLabel(doc.updatedAt, today)}</dd>
        <dt>Opens</dt>
        <dd className="tnum">
          {doc.opens ?? 0}, by people at {doc.partnerCount ?? 0} partners
        </dd>
      </dl>
      <div className="fg">
        <label htmlFor="ed-title" className="lbl">
          Title
        </label>
        <input
          id="ed-title"
          ref={titleRef}
          className={`field${title.trim() === '' ? ' field-err' : ''}`}
          type="text"
          value={title}
          disabled={busy}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={title.trim() === '' ? true : undefined}
        />
      </div>
      <div className="grid2" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        <div className="fg">
          <label htmlFor="ed-type" className="lbl">
            Type
          </label>
          <Dropdown
            id="ed-type"
            variant="field"
            value={docType}
            options={TYPE_OPTIONS}
            onChange={(v) => {
              if (isOneOf(DOCUMENT_TYPES, v)) setDocType(v);
            }}
          />
        </div>
        <div className="fg">
          <label htmlFor="ed-product" className="lbl">
            Product
          </label>
          <Dropdown
            id="ed-product"
            variant="field"
            value={product}
            options={PRODUCT_OPTIONS}
            onChange={(v) => {
              if (isOneOf(DOC_PRODUCTS, v)) setProduct(v);
            }}
          />
        </div>
      </div>
      <div className="fg">
        <label htmlFor="ed-summary" className="lbl">
          Summary
        </label>
        <textarea
          id="ed-summary"
          className="field"
          rows={2}
          maxLength={300}
          value={summary}
          disabled={busy}
          onChange={(e) => setSummary(e.target.value)}
        />
      </div>
      <div className="grid2" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        <div className="fg">
          <span id="ed-status" className="lbl">
            Status
          </span>
          <div className="seg" role="group" aria-labelledby="ed-status" style={{ alignSelf: 'flex-start' }}>
            {DOCUMENT_STATUS_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`seg-b${o.value === status ? ' seg-on' : ''}`}
                aria-pressed={o.value === status}
                disabled={busy}
                onClick={() => setStatus(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
          {status === 'draft' ? <span className="hint">Partners cannot see a draft. Publishing tells the partners it reaches.</span> : null}
        </div>
        <div className="fg">
          <label htmlFor="ed-expires" className="lbl">
            Hide from partners on
          </label>
          <input
            id="ed-expires"
            className="field"
            type="date"
            value={expiresOn}
            disabled={busy}
            onChange={(e) => setExpiresOn(e.target.value)}
          />
          <span className="hint">{expiresOn === '' ? 'Optional. Leave empty for no expiry.' : 'From that day partners no longer see it. You still do, marked Expired.'}</span>
        </div>
      </div>
      <AudiencePicker
        idPrefix="ed"
        draft={draft}
        onChange={setDraft}
        error={audience.ok ? null : audience.error}
        disabled={busy}
      />
      <div className="fg">
        <label htmlFor="ed-note" className="lbl">
          Change note for the next file you replace it with
        </label>
        <input
          id="ed-note"
          className="field"
          type="text"
          maxLength={300}
          value={changeNote}
          disabled={busy}
          placeholder="What is different in the new file"
          onChange={(e) => setChangeNote(e.target.value)}
        />
      </div>
      {doc.type === 'video' ? <DocumentMediaSection doc={doc} onChanged={() => setFileRefresh((n) => n + 1)} /> : null}
      <DocumentDetailSections documentId={doc.id} refreshKey={fileRefresh} canRestore={!busy} onChanged={() => setFileRefresh((n) => n + 1)} />
      <div className="note note-violet">
        <Icon name="lock" />
        <span>
          Partners get a short-lived link each time they open it. Replacing the file keeps this link
          and the open count.
        </span>
      </div>
      {confirming ? (
        <div className="note note-amber" role="alert">
          <span>Delete {doc.title}? Partners lose access at once. The file is kept for 30 days, then removed.</span>
        </div>
      ) : null}
      {error ? (
        <div className="note note-amber" role="alert">
          <span>{error}</span>
        </div>
      ) : null}
    </Drawer>
  );
}
