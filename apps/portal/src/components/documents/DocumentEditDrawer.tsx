'use client';

import { useId, useRef, useState } from 'react';
import { AudiencePicker } from '@/components/documents/AudiencePicker';
import { DocumentActivity, DocumentVersions, useDocumentDetail } from '@/components/documents/DocumentDetailSections';
import { DocumentMediaSection } from '@/components/documents/DocumentMediaSection';
import { TYPE_ICON } from '@/components/documents/doc-style';
import {
  adminUpdatedLabel,
  type AudienceDraft,
  audienceInputOf,
  draftFromAudience,
  draftToInput,
  sameAudience,
} from '@/components/documents/doc-view';
import { uploadFile } from '@/components/documents/upload-client';
import { Icon } from '@/components/icon';
import { DatePicker } from '@/components/ui/date-picker';
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
import { fmtLong } from '@/lib/dates';
import { formatLabel, UPLOAD_ACCEPT } from '@/server/files/rules';

const TYPE_OPTIONS = DOCUMENT_TYPES.map((t) => ({ value: t, label: DOCUMENT_TYPE_LABEL[t] }));
const DOCUMENT_STATUS_OPTIONS: ReadonlyArray<{ value: DocumentStatus; label: string }> = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];
const PRODUCT_OPTIONS = DOC_PRODUCTS.map((p) => ({ value: p, label: DOC_PRODUCT_LABEL[p] }));
const SUMMARY_MAX = 300;

const TABS = [
  { id: 'details', label: 'Details' },
  { id: 'file', label: 'File' },
  { id: 'activity', label: 'Activity' },
] as const;
type TabId = (typeof TABS)[number]['id'];
type Confirm = 'delete' | 'discard' | null;

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
  const [confirming, setConfirming] = useState<Confirm>(null);
  const [tab, setTab] = useState<TabId>('details');
  const tabsId = useId();
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
  const detail = useDocumentDetail(doc.id, fileRefresh);

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

  const reset = (): void => {
    setTitle(doc.title);
    setDocType(doc.type);
    setProduct(doc.product);
    setSummary(doc.summary ?? '');
    setStatus(doc.status);
    setExpiresOn(doc.expiresAt ? doc.expiresAt.slice(0, 10) : '');
    setDraft(draftFromAudience(doc.audience));
    setError(null);
  };
  // Escape, the X and a click outside all land here, so unsaved edits are never dropped without asking.
  const requestClose = (): void => {
    if (changed && !busy) setConfirming('discard');
    else onClose();
  };
  const titleBlank = title.trim() === '';

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
      setConfirming(null);
      setError(result.error.message);
      return;
    }
    onClose();
    toast(`Deleted ${doc.title}`);
  };

  const dangerFooter =
    confirming === 'delete' ? (
      <>
        <p className="hint ded-fmsg" role="alert">
          Delete {doc.title}? Partners lose access at once. The file is kept for 30 days, then removed.
        </p>
        <button type="button" className="btn btn-s" onClick={() => setConfirming(null)} disabled={busy}>
          Keep it
        </button>
        <button type="button" className="btn btn-dd" onClick={() => void remove()} disabled={busy}>
          Delete document
        </button>
      </>
    ) : confirming === 'discard' ? (
      <>
        <p className="hint ded-fmsg" role="alert">
          You have unsaved changes. Close without saving them?
        </p>
        <button type="button" className="btn btn-s" onClick={() => setConfirming(null)}>
          Keep editing
        </button>
        <button type="button" className="btn btn-d" onClick={onClose}>
          Discard and close
        </button>
      </>
    ) : null;

  const isVideo = doc.type === 'video';
  return (
    <Drawer
      open
      onClose={requestClose}
      initialFocus={titleRef}
      className="drawer-doc"
      lead={
        <span className="dthumb" data-product={doc.product} aria-hidden="true">
          <Icon name={TYPE_ICON[doc.type]} />
        </span>
      }
      title={doc.title}
      subtitle={`${DOCUMENT_TYPE_LABEL[doc.type]}, ${formatLabel(doc)}`}
      footer={
        dangerFooter ?? (
          <>
            {changed ? (
              <span className="ded-dirty" role="status">
                Unsaved changes
              </span>
            ) : null}
            {changed ? (
              <button type="button" className="btn btn-g" onClick={reset} disabled={busy}>
                Discard changes
              </button>
            ) : null}
            <button
              type="button"
              className={`btn ${changed ? 'btn-p' : 'btn-s'}`}
              onClick={() => (changed ? void save() : onClose())}
              disabled={busy}
            >
              {changed ? (busy ? 'Saving' : 'Save changes') : 'Close'}
            </button>
          </>
        )
      }
    >
      {error ? (
        <div className="note note-amber ded-error" role="alert">
          <span>{error}</span>
        </div>
      ) : null}
      <div
        className="tabs ded-tabs"
        role="tablist"
        aria-label="Document sections"
        onKeyDown={(e) => {
          const at = TABS.findIndex((t) => t.id === tab);
          const next = e.key === 'ArrowRight' ? at + 1 : e.key === 'ArrowLeft' ? at - 1 : null;
          if (next === null) return;
          e.preventDefault();
          const target = TABS[(next + TABS.length) % TABS.length];
          if (!target) return;
          setTab(target.id);
          document.getElementById(`${tabsId}-t-${target.id}`)?.focus();
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`${tabsId}-t-${t.id}`}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`${tabsId}-p-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            className={`tab${tab === t.id ? ' tab-on' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === 'activity' ? <span className="cnt">{doc.opens ?? 0}</span> : null}
          </button>
        ))}
      </div>

      <div id={`${tabsId}-p-details`} role="tabpanel" aria-labelledby={`${tabsId}-t-details`} className="ded-panel" hidden={tab !== 'details'}>
        {doc.expired ? (
          <div className="note note-amber">
            <span>Expired{doc.expiresAt ? ` on ${fmtLong(doc.expiresAt)}` : ''}. Partners no longer see it. Clear the date under Visibility to bring it back.</span>
          </div>
        ) : null}
        <div className="fg">
          <label htmlFor="ed-title" className="lbl">
            Title
          </label>
          <input
            id="ed-title"
            ref={titleRef}
            className={`field${titleBlank ? ' field-err' : ''}`}
            type="text"
            value={title}
            disabled={busy}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={titleBlank ? true : undefined}
            aria-describedby={titleBlank ? 'ed-title-err' : undefined}
          />
          {titleBlank ? (
            <span id="ed-title-err" className="err">
              Give the document a title.
            </span>
          ) : null}
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
          <textarea id="ed-summary" className="field" rows={3} maxLength={SUMMARY_MAX} value={summary} disabled={busy} onChange={(e) => setSummary(e.target.value)} aria-describedby="ed-summary-n" />
          <span id="ed-summary-n" className="hint tnum" style={{ alignSelf: 'flex-end' }}>
            {summary.length} of {SUMMARY_MAX}
          </span>
        </div>

        <h3 className="dsec-h">Visibility</h3>
        <div className="grid2" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <div className="fg">
            <span id="ed-status" className="lbl">
              Status
            </span>
            <div className="seg" role="group" aria-labelledby="ed-status" style={{ alignSelf: 'flex-start' }}>
              {DOCUMENT_STATUS_OPTIONS.map((o) => (
                <button key={o.value} type="button" className={`seg-b${o.value === status ? ' seg-on' : ''}`} aria-pressed={o.value === status} disabled={busy} onClick={() => setStatus(o.value)}>
                  {o.label}
                </button>
              ))}
            </div>
            <span className="hint">{status === 'draft' ? 'Partners cannot see a draft. Publishing tells the partners it reaches.' : 'Visible to the partners chosen below.'}</span>
          </div>
          <div className="fg">
            <label htmlFor="ed-expires" className="lbl">
              Hide from partners on
            </label>
            <DatePicker id="ed-expires" value={expiresOn} disabled={busy} clearable onChange={setExpiresOn} />
            <span className="hint">{expiresOn === '' ? 'Optional. Leave empty for no expiry.' : 'From that day partners no longer see it. You still do, marked Expired.'}</span>
          </div>
        </div>
        <AudiencePicker idPrefix="ed" draft={draft} onChange={setDraft} error={audience.ok ? null : audience.error} disabled={busy} />

        <div className="ded-danger">
          <span className="li-t">
            <span className="li-n">Delete this document</span>
            <span className="li-s">Partners lose access at once. The file is kept for 30 days.</span>
          </span>
          <button type="button" className="btn btn-d" onClick={() => setConfirming('delete')} disabled={busy}>
            <Icon name="trash" />
            Delete
          </button>
        </div>
      </div>

      <div id={`${tabsId}-p-file`} role="tabpanel" aria-labelledby={`${tabsId}-t-file`} className="ded-panel" hidden={tab !== 'file'}>
        <div className="dfile">
          <span className="dthumb dthumb-lg" data-product={doc.product} aria-hidden="true">
            <Icon name={TYPE_ICON[doc.type]} />
          </span>
          <span className="li-t">
            <span className="li-n" style={{ overflowWrap: 'anywhere' }}>
              {doc.originalName}
            </span>
            <span className="li-s">
              {formatLabel(doc)}, version {doc.version}, updated {adminUpdatedLabel(doc.updatedAt, today)}
            </span>
          </span>
        </div>
        <div className="fg">
          <label htmlFor="ed-note" className="lbl">
            What is different in the new file
          </label>
          <input id="ed-note" className="field" type="text" maxLength={300} value={changeNote} disabled={busy} placeholder="Optional. Shown in the file history" onChange={(e) => setChangeNote(e.target.value)} />
          <span className="hint">Replacing the file keeps this link and the open count. Partners get a short-lived link each time they open it.</span>
        </div>
        <div className="ded-replace">
          <label className={`btn btn-s${busy ? ' btn-off' : ''}`} style={{ cursor: busy ? 'default' : 'pointer' }}>
            <Icon name="upload" />
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
          {progress !== null ? (
            <progress className="dprog" max={100} value={progress} aria-label="Upload progress" />
          ) : null}
        </div>
        {isVideo ? <DocumentMediaSection doc={doc} onChanged={() => setFileRefresh((n) => n + 1)} /> : null}
        <DocumentVersions documentId={doc.id} state={detail} canRestore={!busy} onChanged={() => setFileRefresh((n) => n + 1)} />
      </div>

      <div id={`${tabsId}-p-activity`} role="tabpanel" aria-labelledby={`${tabsId}-t-activity`} className="ded-panel" hidden={tab !== 'activity'}>
        <dl className="dstats">
          <div>
            <dt>Opens</dt>
            <dd>{doc.opens ?? 0}</dd>
          </div>
          <div>
            <dt>Partners</dt>
            <dd>{doc.partnerCount ?? 0}</dd>
          </div>
          <div>
            <dt>Last opened</dt>
            <dd className={doc.lastOpenedAt ? undefined : 'dstat-warn'}>{doc.lastOpenedAt ? adminUpdatedLabel(doc.lastOpenedAt, today) : 'Never'}</dd>
          </div>
        </dl>
        <DocumentActivity state={detail} />
      </div>
    </Drawer>
  );
}
