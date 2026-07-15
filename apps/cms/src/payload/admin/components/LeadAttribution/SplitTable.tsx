import type { ReactElement } from 'react';

import type { SplitRow } from '../../../lib/lead-attribution/aggregate';

const fmt = (n: number): string => n.toLocaleString();

/** A ranked count table with an inline proportional bar. Reused for every
 * single-dimension breakdown (channel, source, medium, campaign, form…). */
export function SplitTable({
  title,
  keyLabel,
  rows,
}: {
  title: string;
  keyLabel: string;
  rows: SplitRow[];
}): ReactElement {
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0);
  return (
    <section className="cs-analytics__panel">
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <div className="cs-analytics__empty">No leads in the selected window.</div>
      ) : (
        <div className="cs-lead-attribution__table">
          <div className="cs-lead-attribution__thead">
            <span>{keyLabel}</span>
            <span />
            <span className="is-right">Leads</span>
          </div>
          {rows.map((r) => (
            <div key={r.key} className="cs-lead-attribution__trow">
              <span className="is-primary" title={r.label}>
                {r.label}
              </span>
              <span className="cs-lead-attribution__bar" aria-hidden="true">
                <span style={{ width: `${max > 0 ? (r.count / max) * 100 : 0}%` }} />
              </span>
              <span className="is-right">{fmt(r.count)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default SplitTable;
