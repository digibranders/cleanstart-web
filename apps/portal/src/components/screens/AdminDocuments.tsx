'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { Icon } from '@/components/icon';
import { DocumentEditDrawer } from '@/components/documents/DocumentEditDrawer';
import { DocumentPreview } from '@/components/documents/DocumentPreview';
import { RequestsInbox, type RequestPerson } from '@/components/documents/RequestsInbox';
import { UploadDocumentForm } from '@/components/documents/UploadDocumentForm';
import { CHIP_PRODUCT, TYPE_ICON, TYPE_TONE } from '@/components/documents/doc-style';
import { adminUpdatedLabel, audienceTone } from '@/components/documents/doc-view';
import { ActionMenu } from '@/components/ui/action-menu';
import { Badge, ProductChip } from '@/components/ui/badge';
import { Dropdown } from '@/components/ui/dropdown';
import { useToast } from '@/components/ui/toast';
import type { AudiencePartnerDto } from '@/lib/document-upload';
import type { MaterialRequestDto } from '@/lib/dto';
import { plural } from '@/lib/dates';
import { DOC_PRODUCT_LABEL, DOC_PRODUCTS, DOCUMENT_TYPE_LABEL, DOCUMENT_TYPES } from '@/lib/domain';
import type { DocumentDto } from '@/lib/dto';
import { audienceLabel, formatLabel } from '@/server/files/rules';
import { ScrollRegion } from "@/components/ui/scroll-region";

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
          <ScrollRegion label="Document library">
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Document</th>
                  <th scope="col" className="hide-sm">
                    Product
                  </th>
                  <th scope="col">Who can open it</th>
                  <th scope="col" className="r hide-sm">
                    Updated
                  </th>
                  <th scope="col" className="r">
                    Opens
                  </th>
                  <th scope="col" className="r hide-sm">
                    Opened by
                  </th>
                  <th scope="col" className="r hide-sm">
                    Last opened
                  </th>
                  <th scope="col" className="r">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id}>
                    <td style={{ whiteSpace: 'normal', minWidth: 150 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className={`li-ic ${TYPE_TONE[d.type]}`}>
                          <Icon name={TYPE_ICON[d.type]} />
                        </span>
                        <span className="li-t">
                          <button
                            type="button"
                            className="linkbtn li-n"
                            style={{ fontSize: 13 }}
                            onClick={() => openDocument(d)}
                          >
                            {d.title}
                          </button>
                          <span className="li-s">
                            {DOCUMENT_TYPE_LABEL[d.type]}, {formatLabel(d)}
                          </span>
                          {d.summary ? <span className="li-s">{d.summary}</span> : null}
                        </span>
                      </span>
                    </td>
                    <td className="hide-sm">
                      <ProductChip product={CHIP_PRODUCT[d.product]} />
                    </td>
                    <td>
                      <Badge tone={audienceTone(d.audience.kind)}>{audienceLabel(d.audience)}</Badge>
                      {d.status === 'draft' ? (
                        <>
                          {' '}
                          <Badge tone="pending">Draft</Badge>
                        </>
                      ) : null}
                      {d.expired ? (
                        <>
                          {' '}
                          <Badge tone="expired">Expired</Badge>
                        </>
                      ) : null}
                    </td>
                    <td className="tnum r t-sec hide-sm">{adminUpdatedLabel(d.updatedAt, today)}</td>
                    <td className="tnum r">{d.opens ?? 0}</td>
                    <td className="tnum r t-sec hide-sm">{plural(d.partnerCount ?? 0, 'partner')}</td>
                    <td className="tnum r t-sec hide-sm">{d.lastOpenedAt ? adminUpdatedLabel(d.lastOpenedAt, today) : 'Never'}</td>
                    <td className="r">
                      <ActionMenu
                        label="Actions"
                        ariaLabel={`Actions for ${d.title}`}
                        items={[
                          { label: d.type === 'video' ? 'Watch' : 'Open', onSelect: () => openDocument(d) },
                          { label: 'Download', onSelect: () => download(d) },
                          { label: 'Edit', onSelect: () => setEditingId(d.id) },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {docs.length === 0 ? (
              <div className="empty">No documents yet. Upload the first one.</div>
            ) : rows.length === 0 ? (
              <div className="empty">
                No documents match these filters.{' '}
                <button
                  type="button"
                  className="btn btn-g"
                  onClick={clear}
                  style={{ height: 24, padding: '0 6px', fontSize: 12 }}
                >
                  Clear filters
                </button>
              </div>
            ) : null}
          </ScrollRegion>
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
