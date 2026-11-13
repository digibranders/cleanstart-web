'use client';

import { useCallback, useMemo, useState } from 'react';
import { Icon } from '@/components/icon';
import { DocumentPreview } from '@/components/documents/DocumentPreview';
import { RequestMaterialDialog } from '@/components/documents/RequestMaterialDialog';
import { CHIP_PRODUCT, TYPE_ICON, TYPE_TONE } from '@/components/documents/doc-style';
import { isFresh } from '@/components/documents/doc-view';
import { Badge, ProductChip } from '@/components/ui/badge';
import { Dropdown } from '@/components/ui/dropdown';
import { useToast } from '@/components/ui/toast';
import { fmtLong } from '@/lib/dates';
import { DOCUMENT_TYPE_LABEL, type DocumentType, PRODUCT_LABEL, PRODUCTS } from '@/lib/domain';
import type { DocumentDto } from '@/lib/dto';
import type { PublicDatasheetDto } from '@/server/files/public-resources';
import { formatLabel } from '@/server/files/rules';

const ANY_PRODUCT = 'any';
const PRODUCT_FILTER = [
  { value: ANY_PRODUCT, label: 'All products' },
  ...PRODUCTS.map((p) => ({ value: p, label: PRODUCT_LABEL[p] })),
];
const SORTS = ['Newest first', 'Most opened', 'Name'] as const;
type Sort = (typeof SORTS)[number];
const BASE_TABS: readonly DocumentType[] = [
  'video',
  'datasheet',
  'solution_sheet',
  'battlecard',
  'enablement_guide',
];

export function Documents({
  docs,
  publicDatasheets,
  today,
}: {
  docs: readonly DocumentDto[];
  publicDatasheets: readonly PublicDatasheetDto[];
  today: string;
}): React.JSX.Element {
  const toast = useToast();
  // The server already limited the list to what this company's audience allows (repo/documents.ts, backed by RLS).
  const visible = docs;

  const [type, setType] = useState<DocumentType | 'All'>('All');
  const [q, setQ] = useState('');
  const [product, setProduct] = useState<string>(ANY_PRODUCT);
  const [sort, setSort] = useState<Sort>('Newest first');
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);

  const tabTypes: DocumentType[] = [
    ...BASE_TABS,
    ...(visible.some((d) => d.type === 'price_list') ? (['price_list'] as const) : []),
  ];
  const needle = q.trim().toLowerCase();

  const rows = useMemo(() => {
    const filtered = visible.filter(
      (d) =>
        (type === 'All' || d.type === type) &&
        (needle === '' || d.title.toLowerCase().includes(needle)) &&
        (product === ANY_PRODUCT || d.product === product),
    );
    if (sort === 'Most opened')
      return [...filtered].sort((a, b) => (b.ownOpens ?? 0) - (a.ownOpens ?? 0));
    if (sort === 'Name') return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    return filtered;
  }, [visible, type, needle, product, sort]);

  const viewing = viewingId ? (visible.find((d) => d.id === viewingId) ?? null) : null;
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
  const clear = (): void => {
    setType('All');
    setQ('');
    setProduct(ANY_PRODUCT);
  };

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <h1 className="h1">Documents</h1>
          <span className="h1-sub">
            Private to signed-in partners. Share the portal with colleagues, not the file.
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" className="btn btn-s" onClick={() => setRequestOpen(true)}>
            Request material
          </button>
        </div>
      </div>

      <section aria-label="Library" className="card clip">
        <div className="tabs" role="group" aria-label="Filter by type" style={{ padding: '0 8px' }}>
          {(['All', ...tabTypes] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`tab${t === type ? ' tab-on' : ''}`}
              aria-pressed={t === type}
              onClick={() => setType(t)}
            >
              {t === 'All' ? 'All' : `${DOCUMENT_TYPE_LABEL[t]}s`}
              <span className="cnt">
                {t === 'All' ? visible.length : visible.filter((d) => d.type === t).length}
              </span>
            </button>
          ))}
        </div>
        <div className="toolbar" data-tour="docs-filters">
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
              id="dp"
              ariaLabel="Product"
              value={product}
              options={PRODUCT_FILTER}
              onChange={setProduct}
            />
            <Dropdown
              id="ds"
              ariaLabel="Sort"
              value={sort}
              options={SORTS}
              onChange={(v) => setSort(v as Sort)}
            />
          </div>
          <span className="card-meta tnum">{rows.length} documents</span>
        </div>
        <div style={{ overflowX: 'auto' }} data-tour="docs-library">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Type</th>
                <th scope="col">Product</th>
                <th scope="col" className="r">
                  Updated
                </th>
                <th scope="col" className="r">
                  <span className="sr">Action</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => {
                const isVideo = d.type === 'video';
                return (
                  <tr key={d.id}>
                    <td style={{ whiteSpace: 'normal', minWidth: 320 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className={`li-ic ${TYPE_TONE[d.type]}`}>
                          <Icon name={TYPE_ICON[d.type]} />
                        </span>
                        <span className="li-t">
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              className="linkbtn li-n"
                              style={{ fontSize: 13 }}
                              onClick={() => setViewingId(d.id)}
                            >
                              {d.title}
                            </button>
                            {isFresh(d.updatedAt, today) ? <Badge tone="violet">New</Badge> : null}
                          </span>
                          <span className="li-s">
                            {d.summary ?? `${DOCUMENT_TYPE_LABEL[d.type]}, ${formatLabel(d)}`}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="t-sec">{DOCUMENT_TYPE_LABEL[d.type]}</td>
                    <td>
                      <ProductChip product={CHIP_PRODUCT[d.product]} />
                    </td>
                    <td className="tnum r t-sec">{fmtLong(d.updatedAt)}</td>
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
          </table>
          {visible.length === 0 ? (
            <div className="empty">No documents have been shared with your company yet.</div>
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
        </div>
      </section>

      {publicDatasheets.length > 0 ? (
        <section aria-labelledby="pub" className="card clip">
          <div className="card-h">
            <h2 id="pub" className="card-t">
              Public datasheets
            </h2>
            <span className="card-meta">On cleanstart.com, no sign-in needed</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col" className="r">
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
                    <td style={{ whiteSpace: 'normal', minWidth: 320 }}>
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
                    <td className="tnum r t-sec">{d.updatedAt ? fmtLong(d.updatedAt) : ''}</td>
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
          </div>
        </section>
      ) : null}

      <DocumentPreview doc={viewing} onClose={closeView} onDownload={download} />
      <RequestMaterialDialog open={requestOpen} onClose={closeRequest} />
    </div>
  );
}
