'use client';

import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

const BASE = '/admin/collections/pageRegistry';

const KINDS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'static', label: 'Static' },
  { value: 'cms-listing', label: 'Listing' },
  { value: 'cms-template', label: 'Template' },
];

const STATUSES: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'customized', label: 'Customized' },
  { value: 'auto', label: 'Auto (default)' },
];

/**
 * Quick filter pills above the Pages (Schema) list. Each pill links to the
 * collection list with Payload's URL `where` params (which the native list
 * reads), so filtering reuses the built-in list — no separate page. Filters by
 * Kind and Override status (additionalSchema exists?); combinable; search/limit
 * params are preserved.
 */
export const PageSchemaFilters = (): ReactElement => {
  const [search, setSearch] = useState('');
  useEffect(() => setSearch(window.location.search), []);

  const params = new URLSearchParams(search);
  const whereStr = decodeURIComponent(search);
  const kindMatch = /\[kind\]\[equals\]=([^&]+)/.exec(whereStr);
  const existsMatch = /\[additionalSchema\]\[exists\]=(true|false)/.exec(whereStr);
  const activeKind = kindMatch ? decodeURIComponent(kindMatch[1] ?? '') : 'all';
  const activeStatus = existsMatch
    ? existsMatch[1] === 'true'
      ? 'customized'
      : 'auto'
    : 'all';

  const buildHref = (kind: string, status: string): string => {
    const next = new URLSearchParams(params);
    for (const key of [...next.keys()]) if (key.startsWith('where')) next.delete(key);
    next.delete('page'); // reset pagination on filter change
    const conds: [string, string, string][] = [];
    if (kind !== 'all') conds.push(['kind', 'equals', kind]);
    if (status === 'customized') conds.push(['additionalSchema', 'exists', 'true']);
    else if (status === 'auto') conds.push(['additionalSchema', 'exists', 'false']);
    conds.forEach((c, i) => next.set(`where[and][${i}][${c[0]}][${c[1]}]`, c[2]));
    const qs = next.toString();
    return qs ? `${BASE}?${qs}` : BASE;
  };

  const Pills = ({
    options,
    active,
    hrefFor,
  }: {
    options: { value: string; label: string }[];
    active: string;
    hrefFor: (v: string) => string;
  }): ReactElement => (
    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
      {options.map((o) => {
        const on = o.value === active;
        return (
          <a
            key={o.value}
            href={hrefFor(o.value)}
            style={{
              fontSize: '0.8em',
              padding: '0.25rem 0.7rem',
              borderRadius: 999,
              border: `1px solid ${on ? 'var(--theme-success-500, #0a7)' : 'var(--theme-elevation-150, #333)'}`,
              color: on ? 'var(--theme-success-500, #0a7)' : 'var(--theme-elevation-600, #aaa)',
              fontWeight: on ? 600 : 400,
              textDecoration: 'none',
            }}
          >
            {o.label}
          </a>
        );
      })}
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', margin: '0 0 1rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <span style={{ fontSize: '0.7em', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--theme-elevation-500, #777)' }}>
          Page type
        </span>
        <Pills options={KINDS} active={activeKind} hrefFor={(v) => buildHref(v, activeStatus)} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <span style={{ fontSize: '0.7em', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--theme-elevation-500, #777)' }}>
          Schema status
        </span>
        <Pills options={STATUSES} active={activeStatus} hrefFor={(v) => buildHref(activeKind, v)} />
      </div>
    </div>
  );
};
