import { useId } from "react";
import { TipHost } from "./tooltip";

export interface LegendItem {
  label: string;
  color: string;
}

export interface TableData {
  head: string[];
  rows: (string | number)[][];
}

/**
 * Shared chrome for every chart: title, text description, legend (always for two or more series), the marks, and a
 * "View as table" toggle (native details, works without JavaScript) that shows the same data.
 */
export function ChartFrame({
  title,
  description,
  legend,
  scaleKey,
  table,
  children,
}: {
  title: string;
  description: string;
  legend?: readonly LegendItem[];
  scaleKey?: React.ReactNode;
  table: TableData;
  children: React.ReactNode;
}): React.JSX.Element {
  const id = useId();
  return (
    <figure className="ch" aria-labelledby={`${id}t`} aria-describedby={`${id}d`}>
      <figcaption>
        <h3 className="ch-title" id={`${id}t`}>
          {title}
        </h3>
        <p className="ch-desc" id={`${id}d`}>
          {description}
        </p>
      </figcaption>
      {legend && legend.length >= 2 ? (
        <ul className="ch-legend">
          {legend.map((l) => (
            <li key={l.label}>
              <span className="ch-sw" style={{ background: l.color }} aria-hidden="true" />
              {l.label}
            </li>
          ))}
        </ul>
      ) : null}
      {scaleKey}
      <TipHost>{children}</TipHost>
      <details className="ch-table">
        <summary>View as table</summary>
        <table>
          <caption className="sr">{title}</caption>
          <thead>
            <tr>
              {table.head.map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) =>
                  j === 0 ? (
                    <th key={j} scope="row">
                      {cell}
                    </th>
                  ) : (
                    <td key={j} className="tnum">
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

export function Svg({
  width,
  height,
  label,
  children,
}: {
  width: number;
  height: number;
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <svg className="ch-svg" viewBox={`0 0 ${width} ${height}`} role="group" aria-label={label} preserveAspectRatio="xMidYMid meet">
      {children}
    </svg>
  );
}

export function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
