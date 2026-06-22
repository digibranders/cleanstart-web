import type { AdminViewServerProps, Payload } from 'payload';
import type { ReactElement } from 'react';

/**
 * Schema Manager — a dedicated admin view listing EVERY website route (from
 * the pageRegistry collection) with its Schema.org override status, grouped by
 * kind. The headline of the Schema Manager feature: one place to see every
 * page's structured-data state and jump to its editor.
 *
 * Server-rendered (no client JS, no @payloadcms/ui render imports — data-layer
 * rule). Each row links to the pageRegistry document editor, where the override
 * is pasted/validated. Detail composition preview + .txt upload are layered on
 * the document editor (the additionalSchema field).
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

const KIND_SECTIONS: { kind: Kind; label: string }[] = [
  { kind: 'static', label: 'Static pages' },
  { kind: 'cms-listing', label: 'Listing pages' },
  { kind: 'cms-template', label: 'Collection templates' },
];

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

const Badge = ({ types }: { types: string[] }): ReactElement =>
  types.length > 0 ? (
    <span style={{ color: '#0a7', fontWeight: 600 }}>
      ✓ override · {types.join(', ')}
    </span>
  ) : (
    <span style={{ color: '#888' }}>auto only</span>
  );

export const SchemaManagerView = async (
  props: AdminViewServerProps,
): Promise<ReactElement> => {
  const {
    req: { payload },
  } = props.initPageResult;

  const rows = await fetchRows(payload);
  const withOverride = rows.filter((r) => overrideTypes(r.additionalSchema).length > 0).length;

  return (
    <div style={{ padding: '2rem', maxWidth: 1100 }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Schema Manager</h1>
        <p style={{ color: '#666', marginTop: '0.25rem' }}>
          Every website page and its Schema.org (JSON-LD) state. {rows.length} routes ·{' '}
          {withOverride} with a custom override. Click a page to view or edit its schema.
        </p>
      </header>

      {rows.length === 0 ? (
        <p style={{ color: '#888' }}>
          No pages registered yet. Run <code>scripts/seed-page-registry.ts</code> to populate
          the route list.
        </p>
      ) : (
        KIND_SECTIONS.map(({ kind, label }) => {
          const section = rows.filter((r) => r.kind === kind);
          if (section.length === 0) return null;
          return (
            <section key={kind} style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#555' }}>
                {label} ({section.length})
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {section.map((row) => (
                    <tr key={String(row.id)} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.5rem 0.75rem 0.5rem 0' }}>
                        <a href={`/admin/collections/pageRegistry/${row.id}`} style={{ fontWeight: 600 }}>
                          {row.title}
                        </a>
                        <div style={{ color: '#888', fontFamily: 'monospace', fontSize: '0.85em' }}>
                          {row.path}
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem', fontSize: '0.9em', whiteSpace: 'nowrap' }}>
                        <Badge types={overrideTypes(row.additionalSchema)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          );
        })
      )}
    </div>
  );
};
