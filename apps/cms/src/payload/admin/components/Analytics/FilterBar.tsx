'use client';

import type { ReactElement } from 'react';

import type { OverviewFilters, OverviewWindow } from '../../../lib/dashboards/overview-types';

const WINDOWS: OverviewWindow[] = ['7d', '28d', '90d'];
const COLLECTIONS: ReadonlyArray<readonly [string, string]> = [
  ['', 'All content'],
  ['blogs', 'Blogs'],
  ['guides', 'Guides'],
  ['knowledgeBase', 'Knowledge Hub'],
  ['news', 'News'],
];

export function FilterBar({
  filters,
  countries,
  onChange,
}: {
  filters: OverviewFilters;
  countries: string[];
  onChange: (next: OverviewFilters) => void;
}): ReactElement {
  return (
    <div className="cs-analytics__filters">
      <div className="cs-analytics__pills">
        {WINDOWS.map((w) => (
          <button
            key={w}
            type="button"
            className={w === filters.window ? 'is-on' : ''}
            onClick={() => onChange({ ...filters, window: w })}
          >
            {w}
          </button>
        ))}
      </div>
      <select
        value={filters.collection ?? ''}
        onChange={(e) => onChange({ ...filters, collection: e.target.value || null })}
      >
        {COLLECTIONS.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <select
        value={filters.country ?? ''}
        onChange={(e) => onChange({ ...filters, country: e.target.value || null })}
      >
        <option value="">All countries</option>
        {countries.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}

export default FilterBar;
