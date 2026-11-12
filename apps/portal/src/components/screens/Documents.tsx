'use client';

import { useCallback, useMemo, useState } from 'react';
import { Icon } from '@/components/icon';
import { DocumentPreview } from '@/components/documents/DocumentPreview';
import { RequestMaterialDialog } from '@/components/documents/RequestMaterialDialog';
import { TYPE_ICON, TYPE_TONE } from '@/components/documents/doc-style';
import { Badge, ProductChip, type Product } from '@/components/ui/badge';
import { Dropdown } from '@/components/ui/dropdown';
import { useToast } from '@/components/ui/toast';
import {
  canPartnerOpen,
  useDocuments,
  VIEWER_PARTNER,
  type DocType,
  type PortalDocument,
} from '@/data/documents';

const PRODUCT_FILTER: readonly (Product | 'All products')[] = [
  'All products',
  'CleanStart Images',
  'Clean Libraries',
  'CleanSight',
];
const SORTS = ['Newest first', 'Most opened', 'Name'] as const;
type Sort = (typeof SORTS)[number];
const BASE_TABS: readonly DocType[] = [
  'Video',
  'Datasheet',
  'Solution sheet',
  'Battlecard',
  'Enablement guide',
];

export function Documents(): React.JSX.Element {
  const toast = useToast();
  const all = useDocuments();
  const visible = useMemo(() => all.filter((d) => canPartnerOpen(d, VIEWER_PARTNER)), [all]);

  const [type, setType] = useState<DocType | 'All'>('All');
  const [q, setQ] = useState('');
  const [product, setProduct] = useState<string>('All products');
  const [sort, setSort] = useState<Sort>('Newest first');
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);

  const tabTypes: DocType[] = [
    ...BASE_TABS,
    ...(visible.some((d) => d.type === 'Price list') ? (['Price list'] as const) : []),
  ];
  const needle = q.trim().toLowerCase();

  const rows = useMemo(() => {
    const filtered = visible.filter(
      (d) =>
        (type === 'All' || d.type === type) &&
        (needle === '' || d.title.toLowerCase().includes(needle)) &&
        (product === 'All products' || d.product === product),
    );
    if (sort === 'Most opened') return [...filtered].sort((a, b) => b.ownOpens - a.ownOpens);
    if (sort === 'Name') return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    return filtered;
  }, [visible, type, needle, product, sort]);

  const viewing = viewingId ? (visible.find((d) => d.id === viewingId) ?? null) : null;
  const closeView = useCallback((): void => setViewingId(null), []);
  const closeRequest = useCallback((): void => setRequestOpen(false), []);
  const download = (d: PortalDocument): void => toast(`Downloading ${d.title}, ${d.format}`);
  const clear = (): void => {
    setType('All');
    setQ('');
    setProduct('All products');
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
              {t === 'All' ? 'All' : `${t}s`}
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
                const isVideo = d.type === 'Video';
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
                            {d.fresh ? <Badge tone="violet">New</Badge> : null}
                          </span>
                          <span className="li-s">{d.summary ?? `${d.type}, ${d.format}`}</span>
                        </span>
                      </span>
                    </td>
                    <td className="t-sec">{d.type}</td>
                    <td>
                      <ProductChip product={d.product} />
                    </td>
                    <td className="tnum r t-sec">{d.updated}</td>
                    <td className="r">
                      <button
                        type="button"
                        className="act"
                        aria-label={`${isVideo ? 'Watch' : 'Download'} ${d.title}`}
                        data-tip={`${isVideo ? 'Watch' : 'Download'}, ${d.format}`}
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
          {rows.length === 0 ? (
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

      <DocumentPreview doc={viewing} onClose={closeView} onDownload={download} />
      <RequestMaterialDialog open={requestOpen} onClose={closeRequest} />
    </div>
  );
}
