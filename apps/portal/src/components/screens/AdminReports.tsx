'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Icon } from '@/components/icon';
import { useRegions } from '@/components/regions-context';
import { downloadCsv } from '@/components/partners/csv';
import { RangeControl } from '@/components/reports/RangeControl';
import { useToast } from '@/components/ui/toast';
import type { AdminReportsDto } from '@/lib/dto';
import { PROGRAM_REVIEW_PATH, type ProgramReviewDto, programReviewQuery, REPORT_EDITIONS, type ReportEdition } from '@/lib/program-review';
import { buildExports } from '@/lib/report-exports';
import type { ReportInsightsDto } from '@/lib/report-insights';
import type { RangedReportDto } from '@/lib/report-metrics';
import { ROUTES } from '@/lib/routes';
import './reports-hub.css';

const EDITION_HINT: Record<ReportEdition, string> = {
  internal: 'Everything, with partner names, managers and follow-ups. For CleanStart staff.',
  shareable: 'Partner names become letters. Managers, follow-ups and rejection reasons are left out.',
};

interface AdminReportsProps {
  review: ProgramReviewDto;
  ranged: RangedReportDto;
  insights: ReportInsightsDto;
  allTime: AdminReportsDto;
  today: string;
  edition: ReportEdition;
  /** The first two pages of the document, drawn by the server from the same data as the report itself. */
  cover: React.ReactNode;
  summary: React.ReactNode;
}

export function AdminReports({ review, ranged, insights, allTime, today, edition, cover, summary }: AdminReportsProps): React.JSX.Element {
  const toast = useToast();
  const { name: regionName } = useRegions();
  const exports = useMemo(() => buildExports({ ranged, insights, allTime, regionName }), [ranged, insights, allTime, regionName]);
  const { range } = ranged;
  const query = (e: ReportEdition, extra?: Record<string, string>): string => programReviewQuery(range, e, extra);

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <h1 className="h1">Reports</h1>
          <span className="h1-sub">Period reports to read, print and send. Live numbers stay on Overview.</span>
        </div>
      </div>

      <section aria-labelledby="rb-t" className="card clip">
        <div className="card-h">
          <h2 id="rb-t" className="card-t">
            Partner Program Review
          </h2>
          <span className="card-meta">Scope follows your regions: {review.scope}</span>
        </div>
        <div className="rh-build">
          <div className="rh-form">
            <div>
              <span className="rh-lbl">Period</span>
              <RangeControl range={range} today={today} edition={edition} />
              <p className="rh-hint tnum">
                Deals registered {review.period}, compared with {review.priorPeriod}.
              </p>
            </div>
            <div>
              <span className="rh-lbl" id="rb-ed">
                Edition
              </span>
              <nav className="seg" aria-labelledby="rb-ed">
                {REPORT_EDITIONS.map((e) => (
                  <Link
                    key={e}
                    href={`${ROUTES.admin.reports}${query(e)}`}
                    scroll={false}
                    className={`seg-b${e === edition ? ' seg-on' : ''}`}
                    aria-current={e === edition ? 'true' : undefined}
                    style={{ display: 'inline-flex', alignItems: 'center' }}
                  >
                    {e === 'internal' ? 'Internal' : 'Shareable'}
                  </Link>
                ))}
              </nav>
              <p className="rh-hint">{EDITION_HINT[edition]}</p>
            </div>
            <div className="rh-acts">
              {/* Plain anchors, not Link: the print view must load with its own page styles, not through a client navigation. */}
              <a className="btn btn-p" href={`${PROGRAM_REVIEW_PATH}${query(edition, { autoprint: '1' })}`} target="_blank" rel="noreferrer noopener">
                <Icon name="dl" />
                Generate PDF
              </a>
              <a className="btn btn-s" href={`${PROGRAM_REVIEW_PATH}${query(edition)}`} target="_blank" rel="noreferrer noopener">
                Open web view
              </a>
            </div>
          </div>
          <div className="rh-prev">
            <div className="rh-pages">
              <div className="pr pr-thumb" aria-hidden="true">
                <div className="pr-thumb-in">{cover}</div>
              </div>
              <div className="pr pr-thumb" aria-hidden="true">
                <div className="pr-thumb-in">{summary}</div>
              </div>
            </div>
            <p className="rh-cap">
              <b>Cover and summary</b> of 6 pages. A4, ready to print or save as PDF.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="rx-t" className="card clip">
        <div className="card-h">
          <h2 id="rx-t" className="card-t">
            Data exports
          </h2>
          <span className="card-meta">CSV, for your own analysis. Period figures use the period above.</span>
        </div>
        <ul className="rh-list">
          {exports.map((x) => (
            <li key={x.key}>
              <div>
                <b>{x.label}</b>
                <small>{x.detail}</small>
              </div>
              <button
                type="button"
                className="btn btn-s"
                disabled={x.rows.length === 0}
                onClick={() => {
                  downloadCsv(x.filename, x.header, x.rows);
                  toast(`Exported ${x.label.toLowerCase()} to CSV`);
                }}
              >
                <Icon name="dl" />
                CSV
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
