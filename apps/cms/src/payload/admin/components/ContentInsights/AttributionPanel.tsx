import type { ReactElement } from 'react';

import type { AttributionRow } from '../../../lib/content-insights/types';

const editHref = (r: { collection: string; id: string }): string =>
  `/admin/collections/${r.collection}/${r.id}`;
const fmt = (n: number): string => n.toLocaleString();

export function AttributionPanel({
  rows,
  configured,
}: {
  rows: AttributionRow[];
  configured: boolean;
}): ReactElement {
  return (
    <section className="cs-analytics__panel">
      <h3>Conversion attribution</h3>
      {!configured ? (
        <div className="cs-analytics__empty">
          Needs setup — configure GA4 <strong>key events</strong> (Admin → Events → mark as key event) so
          conversions attribute to pages. This section activates automatically once key-event data flows in.
        </div>
      ) : rows.length === 0 ? (
        <div className="cs-analytics__empty">No conversions recorded in the window.</div>
      ) : (
        <div className="cs-content-insights__table">
          <div className="cs-content-insights__thead cs-content-insights__thead--attr">
            <span>Page</span>
            <span className="is-right">Key events</span>
          </div>
          {rows.map((r) => (
            <a
              key={`${r.collection}:${r.id}`}
              className="cs-content-insights__trow cs-content-insights__trow--attr"
              href={editHref(r)}
            >
              <span className="is-primary">{r.title}</span>
              <span className="is-right">{fmt(r.conversions)}</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

export default AttributionPanel;
