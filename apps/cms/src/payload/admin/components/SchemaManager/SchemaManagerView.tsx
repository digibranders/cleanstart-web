import type { AdminViewServerProps, Payload } from 'payload';
import type { ReactElement } from 'react';

/**
 * Schema Manager — a dedicated admin view listing every website route (from the
 * pageRegistry collection) with its Schema.org override status, grouped by kind
 * and filterable. One place to see every page's structured-data state and jump
 * to its editor.
 *
 * - Static + listing rows link to their pageRegistry editor (they own a schema
 *   override directly).
 * - Detail (template) rows link INTO their collection — those pages are
 *   per-document, so their schema is edited on each blog/news/etc. document, not
 *   here. The template row is a gateway, not a single page.
 *
 * Server-rendered (no @payloadcms/ui render imports — data-layer rule).
 * Filters are URL params (?type=&status=) so each is a plain link.
 */

type Kind = 'static' | 'cms-listing' | 'cms-template';

interface RegistryRow {
  id: string | number;
  path: string;
  title: string;
  kind: Kind;
  backingCollection?: string | null;
  additionalSchema?: unknown;
}

const KIND_SECTIONS: { kind: Kind; label: string; hint: string }[] = [
  { kind: 'static', label: 'Static pages', hint: 'Hardcoded pages — edit the override here.' },
  { kind: 'cms-listing', label: 'Listing pages', hint: 'Collection index pages — edit the override here.' },
  {
    kind: 'cms-template',
    label: 'Detail pages (CMS)',
    hint: 'Per-document routes — open the collection and edit each document’s schema.',
  },
];

const TYPE_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'static', label: 'Static' },
  { value: 'cms-listing', label: 'Listings' },
  { value: 'cms-template', label: 'Detail (CMS)' },
];

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'customized', label: 'Customized' },
  { value: 'auto', label: 'Auto (default)' },
];

const asStr = (v: unknown): string =>
  typeof v === 'string' ? v : Array.isArray(v) && typeof v[0] === 'string' ? v[0] : '';

const overrideTypes = (value: unknown): string[] => {
  const blobs = Array.isArray(value) ? value : value != null ? [value] : [];
  const out: string[] = [];
  for (const blob of blobs) {
    if (blob != null && typeof blob === 'object') {
      const t = (blob as { '@type'?: unknown })['@type'];
      if (typeof t === 'string') out.push(t);
      else if (Array.isArray(t)) for (const e of t) if (typeof e === 'string') out.push(e);
    }
  }
  return out;
};

const fetchRows = async (payload: Payload): Promise<RegistryRow[]> => {
  try {
    const res = await payload.find({
      collection: 'pageRegistry',
      limit: 200,
      depth: 0,
      sort: 'path',
      overrideAccess: true,
    });
    return res.docs as unknown as RegistryRow[];
  } catch {
    return [];
  }
};

const Pills = ({
  options,
  active,
  hrefFor,
}: {
  options: { value: string; label: string }[];
  active: string;
  hrefFor: (value: string) => string;
}): ReactElement => (
  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
    {options.map((o) => {
      const on = o.value === active;
      return (
        <a
          key={o.value}
          href={hrefFor(o.value)}
          style={{
            fontSize: '0.8em',
            padding: '0.25rem 0.6rem',
            borderRadius: 999,
            border: `1px solid ${on ? '#0a7' : '#333'}`,
            color: on ? '#0a7' : '#aaa',
            fontWeight: on ? 600 : 400,
            textDecoration: 'none',
          }}
        >
          {o.label}
        </a>
      );
    })}
  </div>
);

export const SchemaManagerView = async (props: AdminViewServerProps): Promise<ReactElement> => {
  const {
    req: { payload },
  } = props.initPageResult;
  const sp = props.searchParams ?? {};
  const typeFilter = asStr(sp.type) || 'all';
  const statusFilter = asStr(sp.status) || 'all';

  const hrefFor = (next: { type?: string; status?: string }): string => {
    const t = next.type ?? typeFilter;
    const s = next.status ?? statusFilter;
    const params = new URLSearchParams();
    if (t !== 'all') params.set('type', t);
    if (s !== 'all') params.set('status', s);
    const qs = params.toString();
    return `/admin/schema-manager${qs ? `?${qs}` : ''}`;
  };

  const allRows = await fetchRows(payload);
  const hasOverride = (r: RegistryRow): boolean => overrideTypes(r.additionalSchema).length > 0;

  let rows = allRows;
  if (typeFilter !== 'all') rows = rows.filter((r) => r.kind === typeFilter);
  if (statusFilter === 'customized') rows = rows.filter(hasOverride);
  else if (statusFilter === 'auto') rows = rows.filter((r) => !hasOverride(r));

  const customizedCount = allRows.filter(hasOverride).length;

  return (
    <div style={{ padding: '2rem', maxWidth: 1100 }}>
      <header style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ margin: 0 }}>Schema Manager</h1>
        <p style={{ color: '#888', marginTop: '0.25rem' }}>
          Every website page and its Schema.org (JSON-LD) state. {allRows.length} routes ·{' '}
          {customizedCount} customized.
        </p>
      </header>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.72em', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#777' }}>
            Page type
          </span>
          <Pills options={TYPE_FILTERS} active={typeFilter} hrefFor={(v) => hrefFor({ type: v })} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.72em', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#777' }}>
            Schema status
          </span>
          <Pills options={STATUS_FILTERS} active={statusFilter} hrefFor={(v) => hrefFor({ status: v })} />
        </div>
      </div>

      {rows.length === 0 ? (
        <p style={{ color: '#888' }}>No pages match this filter.</p>
      ) : (
        KIND_SECTIONS.map(({ kind, label, hint }) => {
          const section = rows.filter((r) => r.kind === kind);
          if (section.length === 0) return null;
          return (
            <section key={kind} style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '0.95rem', margin: '0 0 0.1rem' }}>
                {label} ({section.length})
              </h2>
              <p style={{ color: '#777', fontSize: '0.78em', margin: '0 0 0.5rem' }}>{hint}</p>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {section.map((row) => {
                    const isTemplate = row.kind === 'cms-template';
                    const href =
                      isTemplate && row.backingCollection
                        ? `/admin/collections/${row.backingCollection}`
                        : `/admin/collections/pageRegistry/${row.id}`;
                    const types = overrideTypes(row.additionalSchema);
                    return (
                      <tr key={String(row.id)} style={{ borderBottom: '1px solid #222' }}>
                        <td style={{ padding: '0.5rem 0.75rem 0.5rem 0' }}>
                          <a href={href} style={{ fontWeight: 600 }}>
                            {row.title}
                          </a>
                          <div style={{ color: '#888', fontFamily: 'monospace', fontSize: '0.85em' }}>
                            {row.path}
                          </div>
                        </td>
                        <td style={{ padding: '0.5rem', fontSize: '0.85em', whiteSpace: 'nowrap', textAlign: 'right' }}>
                          {isTemplate ? (
                            <span style={{ color: '#888' }}>open collection →</span>
                          ) : types.length > 0 ? (
                            <span style={{ color: '#0a7', fontWeight: 600 }}>✓ {types.join(', ')}</span>
                          ) : (
                            <span style={{ color: '#888' }}>auto only</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          );
        })
      )}
    </div>
  );
};
