'use client';

import type { ReactElement } from 'react';

import type { OverviewFilters, OverviewWindow } from '../../../lib/dashboards/overview-types';
import { Dropdown } from './Dropdown';

const WINDOWS: OverviewWindow[] = ['7d', '28d', '90d'];
const COLLECTIONS = [
  { value: '', label: 'All content' },
  { value: 'blogs', label: 'Blogs' },
  { value: 'guides', label: 'Guides' },
  { value: 'knowledgeBase', label: 'Knowledge Hub' },
  { value: 'news', label: 'News' },
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
  const countryOptions = [
    { value: '', label: 'All countries' },
    ...countries.map((c) => ({ value: c, label: c })),
  ];
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
      <Dropdown
        ariaLabel="Content type"
        value={filters.collection ?? ''}
        options={COLLECTIONS}
        onChange={(v) => onChange({ ...filters, collection: v || null })}
      />
      <Dropdown
        ariaLabel="Country"
        value={filters.country ?? ''}
        options={countryOptions}
        onChange={(v) => onChange({ ...filters, country: v || null })}
      />
    </div>
  );
}

export default FilterBar;
