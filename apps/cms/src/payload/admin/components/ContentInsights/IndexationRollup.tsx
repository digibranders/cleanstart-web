import type { ReactElement } from 'react';

import type { IndexationCollectionRow } from '../../../lib/content-insights/types';

const pct = (n: number): string => `${Math.round(n * 100)}%`;

export function IndexationRollup({ rows }: { rows: IndexationCollectionRow[] }): ReactElement {
  return (
    <section className="cs-analytics__panel">
      <h3>Indexation coverage</h3>
      <p className="cs-content-insights__section-note">
        Share of each collection’s published docs with search impressions in the last 90 days (a proxy for
        “indexed”). Use the per-doc URL inspection for exact status.
      </p>
      {rows.length === 0 ? (
        <div className="cs-analytics__empty">No published content to assess.</div>
      ) : (
        <div className="cs-analytics__bars">
          {rows.map((r) => (
            <div key={r.collection} className="cs-analytics__bar-row">
              <span className="cs-analytics__bar-label">{r.collection}</span>
              <span className="cs-analytics__bar-track">
                <span className="cs-analytics__bar-fill" style={{ width: pct(r.coverage) }} />
              </span>
              <span className="cs-analytics__bar-val">
                {r.indexed}/{r.published}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default IndexationRollup;
