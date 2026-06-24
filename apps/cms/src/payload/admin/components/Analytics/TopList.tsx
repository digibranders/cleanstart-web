import type { ReactElement, ReactNode } from 'react';

interface Col {
  key: string;
  label: string;
  align?: 'right';
  /** Track width for non-first columns (default 60px). */
  width?: string;
}

export function TopList({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: Col[];
  rows: Array<Record<string, ReactNode>>;
}): ReactElement {
  const cols = ['1fr', ...columns.slice(1).map((c) => c.width ?? '60px')].join(' ');
  return (
    <div className="cs-analytics__panel">
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <div className="cs-analytics__empty">No data for this filter.</div>
      ) : (
        <>
          <div className="cs-analytics__thead" style={{ gridTemplateColumns: cols }}>
            {columns.map((c) => (
              <span key={c.key} className={c.align === 'right' ? 'is-right' : ''}>
                {c.label}
              </span>
            ))}
          </div>
          {rows.map((r, i) => (
            <div
              key={String(r[columns[0]?.key ?? ''] ?? i)}
              className="cs-analytics__trow"
              style={{ gridTemplateColumns: cols }}
            >
              {columns.map((c) => (
                <span key={c.key} className={c.align === 'right' ? 'is-right' : 'is-primary'}>
                  {r[c.key]}
                </span>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default TopList;
