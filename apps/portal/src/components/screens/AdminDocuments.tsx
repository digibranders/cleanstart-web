'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { Icon } from '@/components/icon';
import { DocCard } from '@/components/documents/DocCard';
import { DocRail, DocSpotlight, type RailItem } from '@/components/documents/DocSpotlight';
import { DocumentEditDrawer } from '@/components/documents/DocumentEditDrawer';
import { DocumentPreview } from '@/components/documents/DocumentPreview';
import { RequestsInbox, type RequestPerson } from '@/components/documents/RequestsInbox';
import { UploadDocumentForm } from '@/components/documents/UploadDocumentForm';
import { trackGlow } from '@/components/documents/card-glow';
import { ATTENTION_NOTE, DOC_GROUP_LABEL, attentionReason, groupDocuments, pickSpotlight } from '@/components/documents/doc-view';
import { Dropdown } from '@/components/ui/dropdown';
import { useToast } from '@/components/ui/toast';
import type { AudiencePartnerDto } from '@/lib/document-upload';
import type { MaterialRequestDto } from '@/lib/dto';
import { plural } from '@/lib/dates';
import { DOC_PRODUCT_LABEL, DOC_PRODUCTS, DOCUMENT_TYPE_LABEL, DOCUMENT_TYPES } from '@/lib/domain';
import type { DocumentDto } from '@/lib/dto';
import { formatLabel } from '@/server/files/rules';

const ANY = 'any';
const TYPE_FILTER = [
  { value: ANY, label: 'All types' },
  ...DOCUMENT_TYPES.map((t) => ({ value: t, label: DOCUMENT_TYPE_LABEL[t] })),
];
const PRODUCT_FILTER = [
  { value: ANY, label: 'All products' },
  ...DOC_PRODUCTS.map((p) => ({ value: p, label: DOC_PRODUCT_LABEL[p] })),
];

export function AdminDocuments({
  docs,
  partners,
  requests,
  assignees,
  openRequestCount,
  today,
}: {
  docs: readonly DocumentDto[];
  partners: readonly AudiencePartnerDto[];
  /** Null for a role that cannot work requests: the tab is not shown. */
  requests: readonly MaterialRequestDto[] | null;
  assignees: readonly RequestPerson[];
  openRequestCount: number;
  today: string;
}): React.JSX.Element {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [tab, setTab] = useState<'library' | 'requests'>(useSearchParams().get('tab') === 'requests' && requests ? 'requests' : 'library');
  // The Audit log links here with ?doc=<id> to open that document's edit drawer.
  const [editingId, setEditingId] = useState<string | null>(useSearchParams().get('doc'));
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState(ANY);
  const [productFilter, setProductFilter] = useState(ANY);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const toast = useToast();
  const closeUpload = useCallback((): void => setUploadOpen(false), []);
  const closeEdit = useCallback((): void => setEditingId(null), []);
  const closeView = useCallback((): void => setViewingId(null), []);

  const needle = q.trim().toLowerCase();
  const rows = useMemo(
    () =>
      docs.filter(
        (d) =>
          (typeFilter === ANY || d.type === typeFilter) &&
          (productFilter === ANY || d.product === productFilter) &&
          (needle === '' || `${d.title} ${d.summary ?? ''}`.toLowerCase().includes(needle)),
      ),
    [docs, typeFilter, productFilter, needle],
  );
  const clear = (): void => {
    setQ('');
    setTypeFilter(ANY);
    setProductFilter(ANY);
  };

  const grouped = groupDocuments(rows);
  const starts = grouped.map((_, i) => grouped.slice(0, i).reduce((n, g) => n + g.docs.length, 0));
  const filtered = q.trim() !== '' || typeFilter !== ANY || productFilter !== ANY;
  const feature = !filtered && docs.length >= 4 ? pickSpotlight(docs, true, today) : null;
  const attention: RailItem[] = feature
    ? docs.flatMap((doc) => {
        const reason = doc.id === feature.doc.id ? null : attentionReason(doc);
        return reason ? [{ doc, note: ATTENTION_NOTE[reason] }] : [];
      })
    : [];
  const opensTotal = docs.reduce((n, d) => n + (d.opens ?? 0), 0);
  const editing = editingId ? (docs.find((d) => d.id === editingId) ?? null) : null;
  const viewing = viewingId ? (docs.find((d) => d.id === viewingId) ?? null) : null;

  // The file route checks the audience and redirects to a 60 second signed URL. Staff opens are not counted.
  const download = (d: DocumentDto): void => {
    const link = document.createElement('a');
    link.href = `/api/files/${d.id}`;
    link.download = '';
    document.body.append(link);
    link.click();
    link.remove();
    toast(`Downloading ${d.title}, ${formatLabel(d)}`);
  };
  const openDocument = (d: DocumentDto): void => {
    if (d.type === 'video') setViewingId(d.id);
    else window.open(`/api/files/${d.id}`, '_blank', 'noopener');
  };

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <h1 className="h1">Documents</h1>
          <span className="h1-sub">
            {docs.length} documents, opened {opensTotal} times in total. Stored only in the portal,
            never on cleanstart.com.
          </span>
        </div>
        {uploadOpen ? null : (
          <button
            type="button"
            className="btn btn-p"
            onClick={() => setUploadOpen(true)}
          >
            <Icon name="upload" />
            Upload document
          </button>
        )}
      </div>

      {requests ? (
        <div className="tabs" role="group" aria-label="Documents sections" style={{ padding: '0 8px' }}>
          <button type="button" className={`tab${tab === 'library' ? ' tab-on' : ''}`} aria-pressed={tab === 'library'} onClick={() => setTab('library')}>
            Library
            <span className="cnt">{docs.length}</span>
          </button>
          <button type="button" className={`tab${tab === 'requests' ? ' tab-on' : ''}`} aria-pressed={tab === 'requests'} onClick={() => setTab('requests')}>
            Requests
            <span className="cnt" aria-label={`${openRequestCount} open`}>
              {openRequestCount}
            </span>
          </button>
        </div>
      ) : null}

      {tab === 'requests' && requests ? <RequestsInbox requests={requests} assignees={assignees} docs={docs} /> : null}

      <div className="row" style={tab === 'requests' ? { display: 'none' } : undefined}>
        {uploadOpen ? <UploadDocumentForm onClose={closeUpload} partners={partners} /> : null}

        <section
          aria-labelledby="lib"
          className="card clip"
          style={{ flex: '1 1 620px', minWidth: 0 }}
        >
          <div className="card-h">
            <h2 id="lib" className="card-t">
              Library
            </h2>
            <span className="card-meta tnum">
              {rows.length === docs.length ? plural(docs.length, 'document') : `${rows.length} of ${docs.length}`}, newest first
            </span>
          </div>
          <div className="toolbar">
            <div className="filters">
              <label className="sr" htmlFor="adq">
                Search documents
              </label>
              <input
                id="adq"
                className="finput"
                type="search"
                placeholder="Search title or summary"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Dropdown ariaLabel="Type" value={typeFilter} options={TYPE_FILTER} onChange={setTypeFilter} />
              <Dropdown ariaLabel="Product" value={productFilter} options={PRODUCT_FILTER} onChange={setProductFilter} />
            </div>
          </div>
          {docs.length === 0 ? (
            <div className="empty">No documents yet. Upload the first one.</div>
          ) : rows.length === 0 ? (
            <div className="empty">
              No documents match these filters.{' '}
              <button type="button" className="btn btn-g" onClick={clear} style={{ height: 24, padding: '0 6px', fontSize: 12 }}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="dsections" onPointerMove={trackGlow}>
              {feature ? (
                <div className={`dfeature${attention.length === 0 ? ' dfeature-solo' : ''}`}>
                  <DocSpotlight
                    doc={feature.doc}
                    kicker={feature.kicker}
                    isNew={false}
                    onOpen={openDocument}
                    actions={
                      <>
                        <button type="button" className="btn btn-s btn-lg" onClick={() => openDocument(feature.doc)}>
                          {feature.doc.type === 'video' ? 'Watch' : 'Open'}
                        </button>
                        <button type="button" className="btn btn-g btn-lg" onClick={() => setEditingId(feature.doc.id)}>
                          Edit
                        </button>
                      </>
                    }
                  />
                  {attention.length > 0 ? <DocRail title="Needs attention" items={attention.slice(0, 4)} onSelect={(d) => setEditingId(d.id)} /> : null}
                </div>
              ) : null}
              {grouped.map((g, gi) => (
                <section key={g.group} aria-label={DOC_GROUP_LABEL[g.group]}>
                  <h2 className="dgroup">
                    {DOC_GROUP_LABEL[g.group]} <span className="cnt">{g.docs.length}</span>
                  </h2>
                  <div className="dcards">
                    {g.docs.map((d, i) => (
                      <DocCard
                        key={d.id}
                        doc={d}
                        isNew={false}
                        index={(starts[gi] ?? 0) + i}
                        onOpen={openDocument}
                        onDownload={download}
                        staff={{ today, onEdit: (x) => setEditingId(x.id) }}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>
      </div>

      <DocumentPreview doc={viewing} onClose={closeView} onDownload={download} />

      {editing ? (
        <DocumentEditDrawer
          key={editing.id}
          doc={editing}
          partners={partners}
          today={today}
          onClose={closeEdit}
        />
      ) : null}
    </div>
  );
}
