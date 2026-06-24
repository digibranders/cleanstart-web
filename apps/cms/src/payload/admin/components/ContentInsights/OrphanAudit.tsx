import type { ReactElement } from 'react';

import type { OrphanRow } from '../../../lib/content-insights/types';

const editHref = (r: { collection: string; id: string }): string =>
  `/admin/collections/${r.collection}/${r.id}`;
const fmtDate = (iso: string | null): string => (iso ? new Date(iso).toLocaleDateString() : '—');

export function OrphanAudit({ rows }: { rows: OrphanRow[] }): ReactElement {
  return (
    <section className="cs-analytics__panel">
      <h3>Orphan &amp; zero-traffic audit</h3>
      <p className="cs-content-insights__section-note">
        Published docs with ~0 sessions and ~0 search impressions over 90 days — prune or promote.
      </p>
      {rows.length === 0 ? (
        <div className="cs-analytics__empty">No orphans — every published page is getting traffic or impressions.</div>
      ) : (
        <div className="cs-content-insights__table">
          <div className="cs-content-insights__thead cs-content-insights__thead--orphan">
            <span>Page</span>
            <span>Collection</span>
            <span className="is-right">Published</span>
          </div>
          {rows.map((r) => (
            <a
              key={`${r.collection}:${r.id}`}
              className="cs-content-insights__trow cs-content-insights__trow--orphan"
              href={editHref(r)}
            >
              <span className="is-primary">{r.title}</span>
              <span>{r.collection}</span>
              <span className="is-right">{fmtDate(r.publishedAt)}</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

export default OrphanAudit;
