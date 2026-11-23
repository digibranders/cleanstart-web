'use client';

import { useRef, useState } from 'react';
import { AudiencePicker } from '@/components/documents/AudiencePicker';
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
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    toast(`Saved ${result.data.title}`);
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
    const result = await replaceDocumentFileAction({ id: doc.id, file: uploaded.data });
    setBusy(false);
    setProgress(null);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
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
      <AudiencePicker
        idPrefix="ed"
        draft={draft}
        onChange={setDraft}
        error={audience.ok ? null : audience.error}
        disabled={busy}
      />
      <div className="note note-violet">
        <Icon name="lock" />
        <span>
          Partners get a short-lived link each time they open it. Replacing the file keeps this link
          and the open count.
        </span>
      </div>
      {confirming ? (
        <div className="note note-amber" role="alert">
          <span>Delete {doc.title}? Partners lose access at once. This cannot be undone.</span>
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
