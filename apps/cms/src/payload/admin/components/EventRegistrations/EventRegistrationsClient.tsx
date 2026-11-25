'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

type EventSummary = {
  id: number | string;
  title: string;
  slug: string;
  status: string;
  total: number;
  latestAt: string | null;
};
type Column = { name: string; label: string };
type Entry = { id: number; createdAt: string; fields: Record<string, unknown> };
type Loaded = { columns: Column[]; entries: Entry[]; total: number; truncated: boolean };

const PAGE_SIZE = 25;
const CAB_FIELD = 'cab_required';

const cell = (value: unknown): string => {
  if (value === undefined || value === null || value === '') return '';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
};

const when = (iso: string): string => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

const isYes = (value: unknown): boolean => cell(value).trim().toLowerCase() === 'yes';

const matches = (entry: Entry, query: string): boolean =>
  Object.values(entry.fields).some((value) => cell(value).toLowerCase().includes(query));

type CabFilter = 'all' | 'yes' | 'no';

export function EventRegistrationsClient(): ReactElement {
  const router = useRouter();
  const params = useSearchParams();
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [cab, setCab] = useState<CabFilter>('all');
  const [page, setPage] = useState(1);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/eventPages/summary', { credentials: 'include' })
      .then(async (res) => {
        const body = (await res.json()) as { ok?: boolean; events?: EventSummary[]; error?: string };
        if (cancelled) return;
        if (!res.ok || !body.events) setError(body.error ?? 'Could not load events.');
        else setEvents(body.events);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load events.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedId = params.get('event') ?? (events?.[0] ? String(events[0].id) : null);
  const selected = events?.find((event) => String(event.id) === selectedId) ?? null;

  const load = useCallback(async (id: string): Promise<void> => {
    setData(null);
    setError(null);
    try {
      const res = await fetch(`/api/eventPages/${id}/registrations`, { credentials: 'include' });
      const body = (await res.json()) as Loaded & { ok?: boolean; error?: string };
      if (!res.ok || body.ok === false) setError(body.error ?? 'Could not load registrations.');
      else setData(body);
    } catch {
      setError('Could not load registrations.');
    }
  }, []);

  useEffect(() => {
    if (selectedId) void load(selectedId);
  }, [selectedId, load]);

  const pick = (id: number | string): void => {
    setQuery('');
    setCab('all');
    setPage(1);
    setConfirming(null);
    router.replace(`/admin/event-registrations?event=${id}`);
  };

  const hasCab = data?.columns.some((c) => c.name === CAB_FIELD) ?? false;
  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.entries.filter(
      (entry) =>
        (!q || matches(entry, q)) &&
        (cab === 'all' || !hasCab || (cab === 'yes') === isYes(entry.fields[CAB_FIELD])),
    );
  }, [data, query, cab, hasCab]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const cabCount = hasCab ? (data?.entries.filter((entry) => isYes(entry.fields[CAB_FIELD])).length ?? 0) : null;
  const columns = data?.columns ?? [];
  const showColumn = (c: Column): boolean => !hasCab || !(c.name.includes('pickup') || c.name.includes('drop')) || cab !== 'no';

  const remove = async (leadId: number): Promise<void> => {
    if (!selectedId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/eventPages/${selectedId}/registrations/${leadId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        setError('Could not delete that registration.');
        return;
      }
      setConfirming(null);
      await load(selectedId);
      setEvents((prev) =>
        prev ? prev.map((event) => (String(event.id) === selectedId ? { ...event, total: Math.max(0, event.total - 1) } : event)) : prev,
      );
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = async (): Promise<void> => {
    if (!selectedId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/eventPages/${selectedId}/registrations-csv`, { credentials: 'include' });
      if (!res.ok) {
        setError('Export failed. Please try again.');
        return;
      }
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('content-disposition')?.match(/filename="([^"]+)"/u)?.[1] ?? 'registrations.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  const showRows = rows.length > 0;
  const emptyTitle =
    data && data.entries.length === 0 ? 'No registrations yet' : 'No matching registrations';
  const emptySub =
    data && data.entries.length === 0
      ? 'People who register for this event will be listed here.'
      : 'No registrations match the current search or filter.';
  const rangeStart = filtered.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(current * PAGE_SIZE, filtered.length);

  return (
    <div className="cs-list cs-event-regs">
      <div className="cs-list__gutter">
        <header className="cs-list__header">
          <div className="cs-list__heading">
            <div className="cs-list__title-row">
              <h1 className="cs-list__title">Registrations</h1>
              {selected ? (
                <span className="cs-list-badge">
                  <span className="cs-list-badge__chip cs-list-badge__chip--total">
                    {data?.total ?? selected.total} registered
                  </span>
                  {cabCount !== null ? (
                    <span className="cs-list-badge__chip cs-list-badge__chip--published">{cabCount} need a cab</span>
                  ) : null}
                </span>
              ) : null}
            </div>
            <div className="cs-list__description">
              {selected?.latestAt ? `Latest registration ${when(selected.latestAt)}` : 'Who signed up for each event.'}
            </div>
          </div>
          {selected ? (
            <div className="cs-list__controls">
              <label className="cs-list__search">
                <input
                  type="search"
                  className="cs-list__search-input"
                  aria-label="Search registrations"
                  value={query}
                  placeholder="Search name, company or phone"
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                />
              </label>
              {hasCab ? (
                <select
                  className="cs-event-regs__select"
                  aria-label="Cab required"
                  value={cab}
                  onChange={(e) => {
                    setCab(e.target.value as CabFilter);
                    setPage(1);
                  }}
                >
                  <option value="all">Cab: all</option>
                  <option value="yes">Cab: yes</option>
                  <option value="no">Cab: no</option>
                </select>
              ) : null}
              <button type="button" className="cs-btn cs-btn--subtle" onClick={() => void exportCsv()} disabled={busy || !data?.total}>
                Export CSV
              </button>
              <Link className="cs-btn cs-btn--primary" href={`/admin/collections/eventPages/${selected.id}`}>
                Edit event
              </Link>
            </div>
          ) : null}
        </header>

        {error ? (
          <p role="alert" className="cs-event-regs__error">
            {error}
          </p>
        ) : null}

        {events && events.length > 1 ? (
          <div className="cs-event-regs__events" role="tablist" aria-label="Events">
            {events.map((event) => {
              const active = String(event.id) === selectedId;
              return (
                <button
                  key={event.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={active ? 'cs-event-regs__event cs-event-regs__event--active' : 'cs-event-regs__event'}
                  onClick={() => pick(event.id)}
                >
                  {event.title}
                  <span className="cs-event-regs__event-count">{event.total}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        {!events && !error ? (
          <section className="cs-list__table cs-list__table--empty">
            <div className="cs-list__empty">
              <span className="cs-list__empty-title">Loading events</span>
            </div>
          </section>
        ) : null}
        {events && events.length === 0 ? (
          <section className="cs-list__table cs-list__table--empty">
            <div className="cs-list__empty">
              <span className="cs-list__empty-title">No events yet</span>
              <span className="cs-list__empty-sub">Create an event to start taking registrations.</span>
              <Link href="/admin/collections/eventPages/create">Create event</Link>
            </div>
          </section>
        ) : null}

        {selected ? (
          <>
            {data?.truncated ? (
              <p className="cs-event-regs__note">
                Showing the newest {data.entries.length} of {data.total}. Export the CSV for the full list.
              </p>
            ) : null}
            <section className={`cs-list__table${showRows ? '' : ' cs-list__table--empty'}`} aria-label="Registrations">
              {!data && !error ? (
                <div className="cs-list__empty">
                  <span className="cs-list__empty-title">Loading registrations</span>
                </div>
              ) : null}
              {data && !showRows ? (
                <div className="cs-list__empty">
                  <span className="cs-list__empty-title">{emptyTitle}</span>
                  <span className="cs-list__empty-sub">{emptySub}</span>
                </div>
              ) : null}
              {showRows ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Submitted</th>
                      {columns.filter(showColumn).map((c) => (
                        <th key={c.name}>{c.label}</th>
                      ))}
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((entry) => (
                      <tr key={entry.id}>
                        <td className="cs-event-regs__nowrap">{when(entry.createdAt)}</td>
                        {columns.filter(showColumn).map((c) => (
                          <td key={c.name}>{cell(entry.fields[c.name])}</td>
                        ))}
                        <td className="cs-event-regs__row-actions">
                          {confirming === entry.id ? (
                            <>
                              <button
                                type="button"
                                className="cs-btn cs-btn--danger"
                                disabled={busy}
                                onClick={() => void remove(entry.id)}
                              >
                                Delete for good
                              </button>
                              <button type="button" className="cs-btn cs-btn--subtle" onClick={() => setConfirming(null)}>
                                Keep
                              </button>
                            </>
                          ) : (
                            <button type="button" className="cs-btn cs-btn--subtle" onClick={() => setConfirming(entry.id)}>
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </section>

            {data && filtered.length > 0 ? (
              <nav className="cs-list__pagination" aria-label="Pagination">
                <span className="cs-list__pagination-count">
                  <strong>
                    {rangeStart.toLocaleString()}-{rangeEnd.toLocaleString()}
                  </strong>{' '}
                  of {filtered.length.toLocaleString()}
                </span>
                {pages > 1 ? (
                  <div className="cs-list__pagination-controls">
                    <div className="cs-list__pagination-pages">
                      <button
                        type="button"
                        className="cs-btn cs-btn--subtle"
                        disabled={current <= 1}
                        onClick={() => setPage(current - 1)}
                        aria-label="Previous page"
                      >
                        ‹ Prev
                      </button>
                      <span className="cs-list__page-info">
                        Page {current} of {pages}
                      </span>
                      <button
                        type="button"
                        className="cs-btn cs-btn--subtle"
                        disabled={current >= pages}
                        onClick={() => setPage(current + 1)}
                        aria-label="Next page"
                      >
                        Next ›
                      </button>
                    </div>
                  </div>
                ) : null}
              </nav>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

export default EventRegistrationsClient;
