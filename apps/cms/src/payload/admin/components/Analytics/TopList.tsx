import type { ReactElement } from 'react';

interface Col {
  key: string;
  label: string;
  align?: 'right';
}

export function TopList({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: Col[];
  rows: Array<Record<string, string | number>>;
}): ReactElement {
  const cols = `1fr repeat(${columns.length - 1}, 60px)`;
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
          {rows.map((r) => (
            <div
              key={String(r[columns[0]?.key ?? ''])}
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
