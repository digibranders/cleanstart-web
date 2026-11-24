'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import { programReviewQuery, type ReportEdition } from '@/lib/program-review';
import { REPORT_PRESET_LABEL, REPORT_PRESETS, type ReportPreset, type ReportRange, resolveReportRange } from '@/lib/report-metrics';

const SHORT: Record<ReportPreset, string> = { '30d': '30d', '90d': '90d', '365d': '365d', quarter: 'Quarter', custom: 'Custom' };

interface RangeControlProps {
  range: ReportRange;
  today: string;
  /** Kept in the address when the period changes. */
  edition: ReportEdition;
}

/** The period switch: five presets and a custom from and to. The period lives in the URL, next to the edition. */
export function RangeControl({ range, today, edition }: RangeControlProps): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);
  const customOpen = range.preset === 'custom';
  const [showCustom, setShowCustom] = useState(customOpen);
  const customValid = from !== '' && to !== '' && from <= to;
  const href = (preset: ReportPreset): string => `${pathname}${programReviewQuery(resolveReportRange(preset, today), edition)}`;

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <nav className="seg" aria-label="Period">
        {REPORT_PRESETS.filter((p) => p !== 'custom').map((p) => (
          <Link
            key={p}
            href={href(p)}
            scroll={false}
            className={`seg-b${p === range.preset ? ' seg-on' : ''}`}
            aria-current={p === range.preset ? 'true' : undefined}
            data-hint={REPORT_PRESET_LABEL[p]}
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            {SHORT[p]}
          </Link>
        ))}
        <button
          type="button"
          className={`seg-b${customOpen ? ' seg-on' : ''}`}
          aria-expanded={showCustom}
          aria-current={customOpen ? 'true' : undefined}
          onClick={() => setShowCustom((v) => !v)}
        >
          Custom
        </button>
      </nav>
      {showCustom ? (
        <form
          noValidate
          style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}
          onSubmit={(e) => {
            e.preventDefault();
            if (customValid) router.replace(`${pathname}${programReviewQuery({ preset: 'custom', from, to }, edition)}`, { scroll: false });
          }}
        >
          <label className="sr" htmlFor="rg-from">
            From
          </label>
          <DatePicker id="rg-from" variant="fsel" placeholder="From" value={from} max={to || undefined} onChange={setFrom} />
          <span className="t-sec">to</span>
          <label className="sr" htmlFor="rg-to">
            To
          </label>
          <DatePicker id="rg-to" variant="fsel" placeholder="To" value={to} min={from || undefined} onChange={setTo} />
          <button type="submit" className="btn btn-s" disabled={!customValid}>
            Apply
          </button>
        </form>
      ) : null}
    </div>
  );
}
