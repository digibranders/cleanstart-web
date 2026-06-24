import type { ReactElement } from 'react';

import type { LeaderboardRow, LeaderboardsSection } from '../../../lib/content-insights/types';

const fmt = (n: number): string => n.toLocaleString();

const Board = ({ title, rows }: { title: string; rows: LeaderboardRow[] }): ReactElement => (
  <div className="cs-analytics__panel">
    <h3>{title}</h3>
    {rows.length === 0 ? (
      <div className="cs-analytics__empty">No data.</div>
    ) : (
      <div className="cs-content-insights__table">
        <div className="cs-content-insights__thead cs-content-insights__thead--lb">
          <span>Name</span>
          <span className="is-right">Docs</span>
          <span className="is-right">Sessions</span>
          <span className="is-right">Clicks</span>
        </div>
        {rows.slice(0, 12).map((r) => (
          <div key={r.label} className="cs-content-insights__trow cs-content-insights__trow--lb">
            <span className="is-primary">{r.label}</span>
            <span className="is-right">{fmt(r.docCount)}</span>
            <span className="is-right">{fmt(r.sessions)}</span>
            <span className="is-right">{fmt(r.clicks)}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

export function Leaderboards({ data }: { data: LeaderboardsSection }): ReactElement {
  return (
    <div className="cs-analytics__cols">
      <Board title="Top authors" rows={data.byAuthor} />
      <Board title="Top categories" rows={data.byCategory} />
    </div>
  );
}

export default Leaderboards;
