'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { Icon } from '@/components/icon';
import { AuditDrawer } from '@/components/people/AuditDrawer';
import { downloadCsv } from '@/components/reports/download-csv';
import { Dropdown, type DropdownOption } from '@/components/ui/dropdown';
import { useToast } from '@/components/ui/toast';
import { auditToCsv } from '@/lib/audit-csv';
import {
  AUDIT_PERIODS,
  type AuditView,
  auditViewToExportFilter,
  auditViewToQuery,
  KIND_CHOICES,
  PERIOD_CHOICES,
  WHO_CHOICES,
} from '@/lib/audit-filters';
import { fmtTimestamp, plural } from '@/lib/dates';
import { AUDIT_KINDS, AUDIT_WHO, EVENT_SOURCE_LABEL, isOneOf } from '@/lib/domain';
import type { AuditEntryDto, PageDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { exportAuditAction } from '@/server/actions/audit';
import { ScrollRegion } from "@/components/ui/scroll-region";

const SEARCH_DEBOUNCE_MS = 300;
const ALL_PARTNERS = '';

/** The admin page an entry's object lives on, or null when it has none (people, invites). */
function subjectHref(entry: AuditEntryDto): string | null {
  if (!entry.subjectId) return null;
  const id = encodeURIComponent(entry.subjectId);
  switch (entry.subjectType) {
    case 'partner':
      return `${ROUTES.admin.partners}?selected=${id}`;
    case 'registration':
      return `${ROUTES.admin.approvals}?deal=${id}`;
    case 'document':
      return `${ROUTES.admin.documents}?doc=${id}`;
    default:
      return null;
  }
}

export interface AdminAuditProps {
  page: PageDto<AuditEntryDto>;
  view: AuditView;
  /** Every partner, for the company filter. */
  partners: DropdownOption[];
  /** The server's UTC date, for "Today" and "Yesterday" labels. */
  today: string;
  /** The HubSpot sync health card, rendered by the page (a server component) so this screen does not depend on it. */
  healthSlot: React.ReactNode;
}

export function AdminAudit({ page, view, partners, today, healthSlot }: AdminAuditProps): React.JSX.Element {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(view.q);
  const [viewing, setViewing] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const closeView = useCallback((): void => setViewing(null), []);

  const go = useCallback(
    (next: AuditView): void => startTransition(() => router.replace(`${pathname}${auditViewToQuery(next)}`)),
    [router, pathname],
  );

  // After a navigation (Clear filters, browser back) show the URL's search text.
  useEffect(() => setQ(view.q), [view.q]);

  // The URL, and so the server query, follows the box 300 ms after the last keystroke.
  useEffect(() => {
    if (q.trim() === view.q) return;
    const timer = setTimeout(() => go({ ...view, q: q.trim(), cursor: null }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [q, view, go]);

  const exportCsv = async (): Promise<void> => {
    setExporting(true);
    const result = await exportAuditAction(auditViewToExportFilter(view));
    setExporting(false);
    if (!result.ok) {
      toast(result.error.message);
      return;
    }
    downloadCsv('cleanstart-audit-log.csv', auditToCsv(result.data));
    toast(`Exported ${plural(result.data.length, 'event')} to CSV`);
  };

  const selected = page.rows.find((e) => e.id === viewing) ?? null;
  const filtered = view.kind !== null || view.who !== null || view.partnerId !== null || view.q !== '';

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <h1 className="h1">Audit log</h1>
          <span className="h1-sub">Every approval, upload and access change in the portal, newest first.</span>
        </div>
        <button type="button" className="btn btn-s" onClick={exportCsv} disabled={exporting}>
          <Icon name="dl" />
          Export CSV
        </button>
      </div>

      {healthSlot}

      <section aria-label="Events" className="card clip">
        <div className="toolbar">
          <div className="filters">
            <label className="sr" htmlFor="aq">
              Search
            </label>
            <input
              id="aq"
              className="finput"
              type="search"
              placeholder="Search the log"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Dropdown
              ariaLabel="Action"
              value={view.kind ?? ''}
              options={KIND_CHOICES}
              onChange={(v) => go({ ...view, kind: isOneOf(AUDIT_KINDS, v) ? v : null, cursor: null })}
            />
            <Dropdown
              ariaLabel="Who"
              value={view.who ?? ''}
              options={WHO_CHOICES}
              onChange={(v) => go({ ...view, who: isOneOf(AUDIT_WHO, v) ? v : null, cursor: null })}
            />
            <Dropdown
              ariaLabel="Partner"
              value={view.partnerId ?? ALL_PARTNERS}
              options={[{ value: ALL_PARTNERS, label: 'All partners' }, ...partners]}
              onChange={(v) => go({ ...view, partnerId: v === ALL_PARTNERS ? null : v, cursor: null })}
            />
            <Dropdown
              ariaLabel="Period"
              value={view.period}
              options={PERIOD_CHOICES}
              onChange={(v) => go({ ...view, period: isOneOf(AUDIT_PERIODS, v) ? v : view.period, cursor: null })}
            />
          </div>
          <span className="card-meta tnum">{plural(page.total, 'event')}</span>
        </div>
        <ScrollRegion label="Audit log">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">Who</th>
                <th scope="col">Action</th>
                <th scope="col" className="hide-sm">
                  On
                </th>
                <th scope="col" className="hide-sm">
                  Source
                </th>
              </tr>
            </thead>
            <tbody>
              {page.rows.map((e) => (
                <tr key={e.id}>
                  <td className="tnum t-sec" style={{ whiteSpace: 'normal' }}>
                    {fmtTimestamp(e.at, today)}
                  </td>
                  <td style={{ whiteSpace: 'normal' }}>
                    <span className="li-t">
                      <span className="li-n" style={{ fontSize: 13 }}>
                        {e.actorLabel}
                      </span>
                      <span className="li-s hide-sm">{e.actorRole ?? ''}</span>
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'normal' }}>
                    <button type="button" className="linkbtn" onClick={() => setViewing(e.id)}>
                      {e.action}
                    </button>
                  </td>
                  <td className="hide-sm" style={{ whiteSpace: 'normal' }}>
                    {subjectHref(e) ? (
                      <Link href={subjectHref(e) ?? ''} className="linkbtn">
                        {e.target}
                      </Link>
                    ) : (
                      e.target
                    )}
                  </td>
                  <td className="t-muted hide-sm">{EVENT_SOURCE_LABEL[e.source]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {page.rows.length === 0 ? (
            <div className="empty">
              No events match these filters.{' '}
              {filtered || view.period !== '90d' ? (
                <button
                  type="button"
                  className="btn btn-g"
                  onClick={() => go({ period: '90d', kind: null, who: null, partnerId: null, q: '', cursor: null })}
                  style={{ height: 24, padding: '0 6px', fontSize: 12 }}
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          ) : null}
        </ScrollRegion>
        {view.cursor || page.nextCursor ? (
          <div className="toolbar" style={{ justifyContent: 'space-between' }}>
            {view.cursor ? (
              <Link href={`${pathname}${auditViewToQuery({ ...view, cursor: null })}`} className="btn btn-g">
                Newest events
              </Link>
            ) : (
              <span />
            )}
            {page.nextCursor ? (
              <Link href={`${pathname}${auditViewToQuery({ ...view, cursor: page.nextCursor })}`} className="btn btn-s">
                Older events
              </Link>
            ) : null}
          </div>
        ) : null}
      </section>

      <AuditDrawer entry={selected} onClose={closeView} />
    </div>
  );
}
