import type { ReactElement } from 'react';

import type { DecayRow } from '../../../lib/content-insights/types';

const editHref = (r: { collection: string; id: string }): string =>
  `/admin/collections/${r.collection}/${r.id}`;
const fmt = (n: number): string => n.toLocaleString();
const fmtPct = (n: number): string => `${Math.round(n * 100)}%`;
const fmtDate = (iso: string | null): string => (iso ? new Date(iso).toLocaleDateString() : '—');

export function DecayQueue({ rows }: { rows: DecayRow[] }): ReactElement {
  return (
    <section className="cs-analytics__panel">
      <h3>Content decay &amp; refresh queue</h3>
      <p className="cs-content-insights__section-note">
        Published pages whose sessions fell ≥30% vs the prior 28 days, ranked by sessions lost.
        “Stale” = not updated in 6+ months.
      </p>
      {rows.length === 0 ? (
        <div className="cs-analytics__empty">No decaying pages — nothing is dropping by more than 30%.</div>
      ) : (
        <div className="cs-content-insights__table">
          <div className="cs-content-insights__thead">
            <span>Page</span>
            <span className="is-right">Now</span>
            <span className="is-right">Prev</span>
            <span className="is-right">Change</span>
            <span className="is-right">Updated</span>
          </div>
          {rows.map((r) => (
            <a key={`${r.collection}:${r.id}`} className="cs-content-insights__trow" href={editHref(r)}>
              <span className="is-primary">
                {r.title}
                {r.stale && <span className="cs-content-insights__tag">stale</span>}
              </span>
              <span className="is-right">{fmt(r.sessionsRecent)}</span>
              <span className="is-right">{fmt(r.sessionsPrior)}</span>
              <span className="is-right is-loss">{fmtPct(r.lossPct)}</span>
              <span className="is-right">{fmtDate(r.updatedAt)}</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

export default DecayQueue;
