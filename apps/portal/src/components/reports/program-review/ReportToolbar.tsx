'use client';

import { useEffect, useRef } from 'react';
import { REPORT_EDITIONS, type ReportEdition } from '@/lib/program-review';

interface ReportToolbarProps {
  period: string;
  edition: ReportEdition;
  /** The page address for each edition, same period. */
  editionHref: Record<ReportEdition, string>;
  backHref: string;
  /** Open the print dialog once the page has loaded: the "Generate PDF" path. */
  autoPrint: boolean;
}

/** Screen-only bar above the document: the edition switch and the print button. Hidden when printing. */
export function ReportToolbar({ period, edition, editionHref, backHref, autoPrint }: ReportToolbarProps): React.JSX.Element {
  const printed = useRef(false);
  useEffect(() => {
    if (!autoPrint || printed.current) return;
    printed.current = true;
    void document.fonts.ready.then(() => window.print());
  }, [autoPrint]);

  return (
    <div className="pr-bar">
      <div className="pr-bar-t">
        <a className="pr-back" href={backHref}>
          Reports
        </a>
        <b>Partner Program Review</b>
        <span>6 pages, A4, {period}</span>
      </div>
      <div className="pr-ctl">
        <nav className="pr-seg" aria-label="Edition">
          {REPORT_EDITIONS.map((e) => (
            <a key={e} href={editionHref[e]} aria-current={e === edition ? 'true' : undefined}>
              {e === 'internal' ? 'Internal' : 'Shareable'}
            </a>
          ))}
        </nav>
        <button type="button" className="pr-btn" onClick={() => window.print()}>
          Print or save PDF
        </button>
      </div>
    </div>
  );
}
