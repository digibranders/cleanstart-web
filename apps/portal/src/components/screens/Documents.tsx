'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { DocCard } from '@/components/documents/DocCard';
import { MyRequests } from '@/components/documents/MyRequests';
import { DocumentPreview } from '@/components/documents/DocumentPreview';
import { RequestMaterialDialog } from '@/components/documents/RequestMaterialDialog';
import { CHIP_PRODUCT, TYPE_ICON, TYPE_TONE } from '@/components/documents/doc-style';
import {
  DOC_GROUP_LABEL,
  DOC_GROUP_TAB,
  DOC_GROUPS,
  DOC_SORT_LABEL,
  DOC_SORTS,
  type DocGroup,
  type DocLibraryLayout,
  type DocumentsView,
  documentsViewToQuery,
  groupDocuments,
  hasDocumentFilters,
  isNewDocument,
} from '@/components/documents/doc-view';
import { Icon } from '@/components/icon';
import { Badge, ProductChip } from '@/components/ui/badge';
import { Dropdown } from '@/components/ui/dropdown';
import { ScrollRegion } from '@/components/ui/scroll-region';
import { useToast } from '@/components/ui/toast';
import { fmtLong } from '@/lib/dates';
import { DOC_PRODUCT_LABEL, DOC_PRODUCTS, DOCUMENT_TYPE_LABEL, DOCUMENT_TYPES } from '@/lib/domain';
import type { DocumentDto, MaterialRequestDto } from '@/lib/dto';
import type { PublicDatasheetDto } from '@/server/files/public-resources';
import { formatLabel } from '@/server/files/rules';

const ANY = 'any';
const PRODUCT_FILTER = [{ value: ANY, label: 'All products' }, ...DOC_PRODUCTS.map((p) => ({ value: p, label: DOC_PRODUCT_LABEL[p] }))];
const TYPE_FILTER = [{ value: ANY, label: 'All types' }, ...DOCUMENT_TYPES.map((t) => ({ value: t, label: DOCUMENT_TYPE_LABEL[t] }))];
const SORT_OPTIONS = DOC_SORTS.map((s) => ({ value: s, label: DOC_SORT_LABEL[s] }));
const LAYOUTS: ReadonlyArray<{ value: DocLibraryLayout; label: string }> = [
  { value: 'list', label: 'List' },
  { value: 'cards', label: 'Cards' },
];
const SEARCH_DEBOUNCE_MS = 350;

export function Documents({
  docs,
  counts,
  view,
  publicDatasheets,
  requests,
  today,
}: {
  /** Already filtered, grouped and sorted by the server from the URL. */
  docs: readonly DocumentDto[];
  /** Matches per purpose for the current search, type and product, before the purpose tab narrows them. */
  counts: Record<DocGroup, number>;
  view: DocumentsView;
  publicDatasheets: readonly PublicDatasheetDto[];
  requests: readonly MaterialRequestDto[];
  today: string;
}): React.JSX.Element {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(view.q);
  // Search hits and notifications link here with ?doc=<id> to open that document's preview.
  const [viewingId, setViewingId] = useState<string | null>(useSearchParams().get('doc'));
  const [requestOpen, setRequestOpen] = useState(false);

  const go = useCallback(
    (next: DocumentsView): void => startTransition(() => router.replace(`${pathname}${documentsViewToQuery(next)}`, { scroll: false })),
    [router, pathname],
  );

  // After a navigation (Clear filters, browser back) show the URL's search text.
  useEffect(() => setQ(view.q), [view.q]);
  useEffect(() => {
    const text = q.trim();
    if (text === view.q) return undefined;
    const timer = setTimeout(() => go({ ...view, q: text }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [q, view, go]);

  const matched = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const filtered = hasDocumentFilters(view);
  const grouped = groupDocuments(docs);
  const viewing = viewingId ? (docs.find((d) => d.id === viewingId) ?? null) : null;
  const closeView = useCallback((): void => setViewingId(null), []);
  const closeRequest = useCallback((): void => setRequestOpen(false), []);
  const download = (d: DocumentDto): void => {
    // The route checks the audience, records the open and redirects to a 60 second signed URL.
    const link = document.createElement('a');
    link.href = `/api/files/${d.id}`;
    link.download = '';
    document.body.append(link);
    link.click();
    link.remove();
    toast(`Downloading ${d.title}, ${formatLabel(d)}`);
  };
  const clear = (): void => go({ ...view, q: '', type: null, product: null, group: null });

  const tabs: Array<{ group: DocGroup | null; label: string; count: number }> = [
    { group: null, label: 'All', count: matched },
    ...DOC_GROUPS.filter((g) => g !== 'other' || counts.other > 0).map((g) => ({ group: g, label: DOC_GROUP_TAB[g], count: counts[g] })),
  ];

  const openCell = (d: DocumentDto): React.JSX.Element => (
    <td style={{ whiteSpace: 'normal', minWidth: 'min(320px, 62vw)' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className={`li-ic ${TYPE_TONE[d.type]}`}>
          <Icon name={TYPE_ICON[d.type]} />
        </span>
        <span className="li-t">
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button type="button" className="linkbtn li-n" style={{ fontSize: 13 }} onClick={() => setViewingId(d.id)}>
              {d.title}
            </button>
            {isNewDocument(d, today) ? <Badge tone="violet">New</Badge> : null}
          </span>
          <span className="li-s">
            {d.summary ? `${d.summary} (${formatLabel(d)})` : `${DOCUMENT_TYPE_LABEL[d.type]}, ${formatLabel(d)}`}
          </span>
        </span>
      </span>
    </td>
  );

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <h1 className="h1">Documents</h1>
          <span className="h1-sub">Private to signed-in partners. Share the portal with colleagues, not the file.</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" className="btn btn-s" onClick={() => setRequestOpen(true)}>
            Request material
          </button>
        </div>
      </div>

      <section aria-label="Library" className="card clip">
        <div className="tabs" role="group" aria-label="Filter by purpose" style={{ padding: '0 8px' }}>
          {tabs.map((t) => (
            <button
              key={t.label}
              type="button"
              className={`tab${t.group === view.group ? ' tab-on' : ''}`}
              aria-pressed={t.group === view.group}
              onClick={() => go({ ...view, group: t.group })}
            >
              {t.label}
              <span className="cnt">{t.count}</span>
            </button>
          ))}
        </div>
        <div className="toolbar">
          <div className="filters">
            <label className="sr" htmlFor="dq">
              Search documents
            </label>
            <input
              id="dq"
              className="finput"
              type="search"
              placeholder="Filter by name"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Dropdown
              id="dt"
              ariaLabel="Document type"
              value={view.type ?? ANY}
              options={TYPE_FILTER}
              onChange={(v) => go({ ...view, type: DOCUMENT_TYPES.find((t) => t === v) ?? null })}
            />
            <Dropdown
              id="dp"
              ariaLabel="Product"
              value={view.product ?? ANY}
              options={PRODUCT_FILTER}
              onChange={(v) => go({ ...view, product: DOC_PRODUCTS.find((p) => p === v) ?? null })}
            />
            <Dropdown
              id="ds"
              ariaLabel="Sort"
              value={view.sort}
              options={SORT_OPTIONS}
              onChange={(v) => go({ ...view, sort: DOC_SORTS.find((s) => s === v) ?? 'new' })}
            />
            <div className="seg" role="group" aria-label="Layout">
              {LAYOUTS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  className={`seg-b${view.layout === l.value ? ' seg-on' : ''}`}
                  aria-pressed={view.layout === l.value}
                  onClick={() => go({ ...view, layout: l.value })}
                >
                  {l.label}
                </button>
              ))}
            </div>
            {filtered ? (
              <button type="button" className="btn btn-g" onClick={clear} style={{ height: 28, padding: '0 8px', fontSize: 12 }}>
                Clear filters
              </button>
            ) : null}
          </div>
          <span className="card-meta tnum" role="status">
            {docs.length} {docs.length === 1 ? 'document' : 'documents'}
          </span>
        </div>

        {docs.length === 0 ? (
          <div className="empty">
            {filtered ? (
              <>
                {view.q ? `No documents match "${view.q}" with these filters.` : 'No documents match these filters.'}{' '}
                <button type="button" className="btn btn-g" onClick={clear} style={{ height: 24, padding: '0 6px', fontSize: 12 }}>
                  Clear filters
                </button>
              </>
            ) : (
              'No documents have been shared with your company yet.'
            )}
          </div>
        ) : view.layout === 'cards' ? (
          <div className="dsections">
            {grouped.map((g) => (
              <section key={g.group} aria-label={DOC_GROUP_LABEL[g.group]}>
                {view.group === null ? (
                  <h2 className="dgroup">
                    {DOC_GROUP_LABEL[g.group]} <span className="cnt">{g.docs.length}</span>
                  </h2>
                ) : null}
                <div className="dcards">
                  {g.docs.map((d) => (
                    <DocCard key={d.id} doc={d} isNew={isNewDocument(d, today)} onOpen={(x) => setViewingId(x.id)} onDownload={download} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <ScrollRegion label="Documents">
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col" className="hide-sm">
                    Type
                  </th>
                  <th scope="col" className="hide-sm">
                    Product
                  </th>
                  <th scope="col" className="r hide-sm">
                    Updated
                  </th>
                  <th scope="col" className="r">
                    <span className="sr">Action</span>
                  </th>
                </tr>
              </thead>
              {grouped.map((g) => (
                <tbody key={g.group}>
                  {view.group === null ? (
                    <tr className="dgroup-row">
                      <th scope="colgroup" colSpan={5}>
                        {DOC_GROUP_LABEL[g.group]} <span className="cnt">{g.docs.length}</span>
                      </th>
                    </tr>
                  ) : null}
                  {g.docs.map((d) => {
                    const isVideo = d.type === 'video';
                    return (
                      <tr key={d.id}>
                        {openCell(d)}
                        <td className="t-sec hide-sm">{DOCUMENT_TYPE_LABEL[d.type]}</td>
                        <td className="hide-sm">
                          <ProductChip product={CHIP_PRODUCT[d.product]} />
                        </td>
                        <td className="tnum r t-sec hide-sm">{fmtLong(d.updatedAt)}</td>
                        <td className="r">
                          <button
                            type="button"
                            className="act"
                            aria-label={`${isVideo ? 'Watch' : 'Download'} ${d.title}`}
                            data-tip={`${isVideo ? 'Watch' : 'Download'}, ${formatLabel(d)}`}
                            onClick={() => (isVideo ? setViewingId(d.id) : download(d))}
                          >
                            <Icon name={isVideo ? 'play' : 'dl'} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              ))}
            </table>
          </ScrollRegion>
        )}
      </section>

      <MyRequests requests={requests} />

      {publicDatasheets.length > 0 ? (
        <section aria-labelledby="pub" className="card clip">
          <div className="card-h">
            <h2 id="pub" className="card-t">
              Public datasheets
            </h2>
            <span className="card-meta">On cleanstart.com, no sign-in needed</span>
          </div>
          <ScrollRegion label="Public datasheets">
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col" className="r hide-sm">
                    Updated
                  </th>
                  <th scope="col" className="r">
                    <span className="sr">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {publicDatasheets.map((d) => (
                  <tr key={d.id}>
                    <td style={{ whiteSpace: 'normal', minWidth: 'min(320px, 40vw)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="li-ic tone-blue">
                          <Icon name="file" />
                        </span>
                        <span className="li-t">
                          <a
                            className="linkbtn li-n"
                            style={{ fontSize: 13 }}
                            href={d.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {d.title}
                          </a>
                          {d.summary ? <span className="li-s">{d.summary}</span> : null}
                        </span>
                      </span>
                    </td>
                    <td className="tnum r t-sec hide-sm">{d.updatedAt ? fmtLong(d.updatedAt) : ''}</td>
                    <td className="r">
                      <a
                        className="btn btn-s"
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open on cleanstart.com
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollRegion>
        </section>
      ) : null}

      <DocumentPreview doc={viewing} onClose={closeView} onDownload={download} />
      <RequestMaterialDialog open={requestOpen} onClose={closeRequest} />
    </div>
  );
}
