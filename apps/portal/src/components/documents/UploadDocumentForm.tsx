'use client';

import { useState } from 'react';
import { AudiencePicker } from '@/components/documents/AudiencePicker';
import { type AudienceDraft, draftToInput, emptyAudienceDraft } from '@/components/documents/doc-view';
import { uploadFile } from '@/components/documents/upload-client';
import { defaultTypeFor, MAX_FILES_PER_BATCH, sortBatch, titleFromFileName } from '@/components/documents/upload-rows';
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

interface UploadRow {
  id: string;
  file: File;
  title: string;
  docType: DocumentType;
  product: DocProduct;
  summary: string;
  minutes: string;
  draft: AudienceDraft;
  state: 'idle' | 'uploading' | 'failed';
  progress: number;
  error: string | null;
  fieldErrors: Record<string, string>;
}

let rowCounter = 0;
const newRow = (file: File, previous: UploadRow | undefined): UploadRow => {
  rowCounter += 1;
  return {
    id: `r${rowCounter}`,
    file,
    title: titleFromFileName(file.name),
    docType: defaultTypeFor(file.name),
    // A later file starts from the row above it: a batch usually shares a product and an audience.
    product: previous?.product ?? 'all',
    summary: '',
    minutes: '',
    draft: previous ? { ...previous.draft, categories: [...previous.draft.categories] } : emptyAudienceDraft,
    state: 'idle',
    progress: 0,
    error: null,
    fieldErrors: {},
  };
};

const minutesError = (row: UploadRow): string | null => {
  if (row.docType !== 'video' || row.minutes.trim() === '') return null;
  const n = Number(row.minutes);
  return Number.isInteger(n) && n >= 1 && n <= 600 ? null : 'Enter whole minutes, 1 to 600.';
};

export function UploadDocumentForm({
  onClose,
  partners,
}: {
  onClose: () => void;
  partners: readonly AudiencePartnerDto[];
}): React.JSX.Element {
  const toast = useToast();
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [asDraft, setAsDraft] = useState(false);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const patch = (id: string, change: Partial<UploadRow>): void =>
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...change } : row)));

  const addFiles = (incoming: readonly File[]): void => {
    if (incoming.length === 0) return;
    const { accepted, problems } = sortBatch(incoming, MAX_FILES_PER_BATCH - rows.length);
    setNotes(problems);
    setFormError(null);
    setRows((current) => {
      const next = [...current];
      for (const file of accepted) next.push(newRow(file, next[next.length - 1]));
      return next;
    });
  };

  const rowProblem = (row: UploadRow): string | null => {
    if (row.title.trim() === '') return 'Give the document a title.';
    if (minutesError(row)) return minutesError(row);
    const audience = draftToInput(row.draft, partners);
    return audience.ok ? null : audience.error;
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (busy) return;
    setTried(true);
    setFormError(null);
    if (rows.length === 0) {
      setFormError('Choose at least one file to upload.');
      return;
    }
    if (rows.some((row) => rowProblem(row) !== null)) return;
    setBusy(true);
    let done = 0;
    for (const row of rows) {
      patch(row.id, { state: 'uploading', progress: 0, error: null, fieldErrors: {} });
      const audience = draftToInput(row.draft, partners);
      if (!audience.ok) continue;
      const uploaded = await uploadFile({
        file: row.file,
        requestTicket: () => createUploadTicketAction({ mode: 'create', originalName: row.file.name, size: row.file.size }),
        onProgress: (progress) => patch(row.id, { progress }),
      });
      if (!uploaded.ok) {
        patch(row.id, { state: 'failed', error: uploaded.error.message });
        continue;
      }
      const minutes = row.minutes.trim() === '' ? null : Number(row.minutes);
      const created = await createDocumentAction({
        title: row.title.trim(),
        type: row.docType,
        product: row.product,
        summary: row.summary.trim() === '' ? null : row.summary.trim(),
        durationMinutes: row.docType === 'video' ? minutes : null,
        audience: audience.audience,
        file: uploaded.data,
        status: asDraft ? 'draft' : 'published',
      });
      if (!created.ok) {
        patch(row.id, { state: 'failed', error: created.error.message, fieldErrors: issuesToErrors(created.error) });
        continue;
      }
      done += 1;
      setRows((current) => current.filter((r) => r.id !== row.id));
    }
    setBusy(false);
    if (done > 0) toast(done === 1 ? 'Uploaded 1 document' : `Uploaded ${done} documents`);
    if (done === rows.length) onClose();
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-labelledby="up"
      className="card clip"
      style={{ flex: rows.length > 1 ? '1 1 100%' : '0 1 340px', minWidth: 300 }}
    >
      <div className="card-h">
        <h2 id="up" className="card-t">
          Upload documents
        </h2>
        <button type="button" className="ibtn" onClick={onClose} aria-label="Close upload" style={{ width: 24, height: 24 }}>
          <Icon name="x" />
        </button>
      </div>
      <div className="card-b" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label
          onDragOver={(e) => {
            e.preventDefault();
            if (!busy) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!busy) addFiles([...e.dataTransfer.files]);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: 10,
            border: `1px dashed ${dragging ? '#6D4FD8' : '#CFC8EE'}`,
            borderRadius: 8,
            background: dragging ? '#F3F0FD' : '#FCFBFE',
            cursor: busy ? 'default' : 'pointer',
          }}
        >
          <span className="li-ic tone-violet">
            <Icon name="upload" />
          </span>
          <span className="li-t">
            <span className="li-n">{rows.length > 0 ? 'Add more files or drop them here' : 'Choose files or drop them here'}</span>
            <span className="li-s">PDF, PPTX, DOCX, XLSX, MP4 or ZIP, up to 100 MB each, {MAX_FILES_PER_BATCH} at a time</span>
          </span>
          <input
            type="file"
            multiple
            className="sr"
            accept={UPLOAD_ACCEPT}
            disabled={busy}
            onChange={(e) => {
              addFiles([...(e.target.files ?? [])]);
              e.target.value = '';
            }}
          />
        </label>
        {notes.length > 0 ? (
          <div className="note note-amber" role="alert">
            <span>{notes.join(' ')}</span>
          </div>
        ) : null}

        {rows.map((row, index) => {
          const titleErr = row.fieldErrors.title ?? (tried && row.title.trim() === '' ? 'Give the document a title.' : null);
          const minutesErr = row.fieldErrors.durationMinutes ?? minutesError(row);
          const audience = draftToInput(row.draft, partners);
          const audienceErr =
            tried && !audience.ok ? audience.error : (row.fieldErrors['audience.categories'] ?? row.fieldErrors['audience.partnerIds'] ?? null);
          const locked = busy;
          return (
            <fieldset
              key={row.id}
              aria-label={`File ${index + 1}: ${row.file.name}`}
              style={{ border: '1px solid var(--line, #E6E3F2)', borderRadius: 8, padding: 10, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span className="li-n" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.file.name}
                </span>
                <span className="li-s tnum" role="status">
                  {row.state === 'uploading' ? `Uploading ${row.progress}%` : row.state === 'failed' ? 'Failed' : ''}
                </span>
                <button
                  type="button"
                  className="ibtn"
                  aria-label={`Remove ${row.file.name}`}
                  disabled={locked}
                  onClick={() => setRows((current) => current.filter((r) => r.id !== row.id))}
                  style={{ width: 24, height: 24 }}
                >
                  <Icon name="x" />
                </button>
              </div>
              <div className="fg">
                <label htmlFor={`${row.id}-t`} className="lbl">
                  Title
                </label>
                <input
                  id={`${row.id}-t`}
                  className={`field${titleErr ? ' field-err' : ''}`}
                  type="text"
                  value={row.title}
                  placeholder="The name partners will see"
                  disabled={locked}
                  onChange={(e) => patch(row.id, { title: e.target.value, fieldErrors: {} })}
                  aria-invalid={titleErr ? true : undefined}
                  aria-describedby={titleErr ? `${row.id}-t-err` : undefined}
                />
                {titleErr ? (
                  <span id={`${row.id}-t-err`} className="err">
                    {titleErr}
                  </span>
                ) : null}
              </div>
              <div className="grid2" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                <div className="fg">
                  <label htmlFor={`${row.id}-ty`} className="lbl">
                    Type
                  </label>
                  <Dropdown
                    id={`${row.id}-ty`}
                    variant="field"
                    value={row.docType}
                    options={TYPE_OPTIONS}
                    onChange={(v) => {
                      if (isOneOf(DOCUMENT_TYPES, v)) patch(row.id, { docType: v });
                    }}
                  />
                </div>
                <div className="fg">
                  <label htmlFor={`${row.id}-pr`} className="lbl">
                    Product
                  </label>
                  <Dropdown
                    id={`${row.id}-pr`}
                    variant="field"
                    value={row.product}
                    options={PRODUCT_OPTIONS}
                    onChange={(v) => {
                      if (isOneOf(DOC_PRODUCTS, v)) patch(row.id, { product: v });
                    }}
                  />
                </div>
              </div>
              <div className="fg">
                <label htmlFor={`${row.id}-su`} className="lbl">
                  Summary
                </label>
                <textarea
                  id={`${row.id}-su`}
                  className="field"
                  rows={2}
                  maxLength={300}
                  value={row.summary}
                  placeholder="One line partners see under the title"
                  disabled={locked}
                  onChange={(e) => patch(row.id, { summary: e.target.value })}
                />
              </div>
              {row.docType === 'video' ? (
                <div className="fg">
                  <label htmlFor={`${row.id}-du`} className="lbl">
                    Length in minutes
                  </label>
                  <input
                    id={`${row.id}-du`}
                    className={`field${minutesErr ? ' field-err' : ''}`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={600}
                    value={row.minutes}
                    disabled={locked}
                    onChange={(e) => patch(row.id, { minutes: e.target.value })}
                    aria-invalid={minutesErr ? true : undefined}
                  />
                  {minutesErr ? <span className="err">{minutesErr}</span> : null}
                </div>
              ) : null}
              <AudiencePicker
                idPrefix={row.id}
                draft={row.draft}
                onChange={(draft) => patch(row.id, { draft, fieldErrors: {} })}
                error={audienceErr}
                disabled={locked}
              />
              {row.draft.kind === 'categories' && row.draft.categories.length === 0 && !audienceErr ? (
                <span className="hint">Nobody can open this until you choose who.</span>
              ) : null}
              {row.error ? (
                <div className="note note-amber" role="alert">
                  <span>{row.error}</span>
                </div>
              ) : null}
            </fieldset>
          );
        })}

        {rows.length > 0 ? (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={asDraft} disabled={busy} onChange={(e) => setAsDraft(e.target.checked)} />
            Save as draft. Partners are not told and cannot open it until you publish.
          </label>
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
        <button type="submit" className="btn btn-p" style={{ alignSelf: 'flex-start' }} disabled={busy}>
          <Icon name="upload" />
          {busy ? 'Uploading' : rows.length > 1 ? `Upload ${rows.length} documents` : 'Upload document'}
        </button>
      </div>
    </form>
  );
}
