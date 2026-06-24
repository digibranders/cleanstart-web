import type { ReactElement } from 'react';

import type { CannibalizationRow } from '../../../lib/content-insights/types';

const editHref = (p: { collection: string; id: string }): string =>
  `/admin/collections/${p.collection}/${p.id}`;
const fmt = (n: number): string => n.toLocaleString();

export function Cannibalization({ rows }: { rows: CannibalizationRow[] }): ReactElement {
  return (
    <section className="cs-analytics__panel">
      <h3>Keyword cannibalization</h3>
      <p className="cs-content-insights__section-note">
        One query where two or more of our pages compete — they split clicks and dilute ranking. Merge or
        differentiate them.
      </p>
      {rows.length === 0 ? (
        <div className="cs-analytics__empty">No cannibalized queries — each query has a single ranking page.</div>
      ) : (
        <div className="cs-content-insights__cannibal">
          {rows.map((r) => (
            <div key={r.query} className="cs-content-insights__cannibal-row">
              <div className="cs-content-insights__cannibal-query">
                <span>{r.query}</span>
                <span className="cs-content-insights__section-note">{fmt(r.totalImpressions)} impressions</span>
              </div>
              <ul className="cs-content-insights__cannibal-pages">
                {r.pages.map((p) => (
                  <li key={`${p.collection}:${p.id}`}>
                    <a href={editHref(p)}>{p.title}</a>
                    <span className="cs-content-insights__section-note">
                      pos {p.position.toFixed(1)} · {fmt(p.impressions)} impr.
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Cannibalization;
