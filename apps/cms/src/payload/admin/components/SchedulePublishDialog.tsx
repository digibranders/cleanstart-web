'use client';

import {
  DateTimePicker,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  Spinner,
} from '@cleanstart/ui';
import {
  useConfig,
  useDocumentInfo,
  useServerFunctions,
  useTranslation,
} from '@payloadcms/ui';

/**
 * Extract the arg type from the `schedulePublish` client function so we
 * can call it without a double-cast. Derived from the allow-listed
 * `useServerFunctions` hook's return type rather than importing the
 * render-side `ServerFunctionsContextType` (per the @payloadcms/ui
 * data-layer-only contract in CLAUDE.md). `Parameters<>[0]` gives us the
 * `{ signal?: AbortSignal } & Omit<SchedulePublishHandlerArgs, 'clientConfig'|'req'>` shape.
 */
type SchedulePublishArgs = Parameters<
  ReturnType<typeof useServerFunctions>['schedulePublish']
>[0];

import { showToast } from './ToastBus';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';

type SchedulePublishDialogProps = {
  /**
   * Controlled open state. When provided, the component becomes
   * controlled and the keyboard shortcut is disabled. When omitted
   * the component manages its own state and opens on Cmd/Ctrl-Shift-S.
   */
  open?: boolean;
  /** Called when the dialog requests to close (controlled mode only). */
  onClose?: () => void;
};

type ScheduleType = 'publish' | 'unpublish';

/** Type-guard for the opaque return from `schedulePublish`. */
const hasError = (v: unknown): v is { error: string } =>
  typeof v === 'object' && v !== null && typeof (v as Record<string, unknown>).error === 'string';

type UpcomingDoc = {
  id: number | string;
  taskSlug?: string;
  waitUntil?: string;
  input?: {
    type?: ScheduleType;
    timezone?: string;
    doc?: { relationTo?: string; value?: string };
    global?: string;
  };
};

const fmtAbsolute = (iso?: string, tz?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: tz || undefined,
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
};

/**
 * Schedule-Publish dialog — replaces Payload's stock ScheduleDrawer
 * with a CleanStart-owned modal:
 *
 *  - Type (publish / unpublish) radio
 *  - Time (DateTimePicker)
 *  - Timezone select (from `config.admin.timezones.supportedTimezones`)
 *  - Upcoming Events list with delete buttons
 *
 * Two entry points:
 *
 *  1. Keyboard shortcut (Cmd/Ctrl-Shift-S) — self-managed open state,
 *     registered as a global admin action component in payload.config.ts.
 *  2. Controlled mode — pass `open` + `onClose` to embed inside another
 *     surface (e.g. PublishMenu dropdown).
 *
 * Backed by the same `schedule-publish` server function the stock drawer
 * uses, so the `payload-jobs` row shape stays identical.
 */
export const SchedulePublishDialog = ({
  open: openProp,
  onClose,
}: SchedulePublishDialogProps = {}): ReactElement | null => {
  const controlled = openProp !== undefined;
  const titleId = useId();
  const typeName = useId();
  const { id, collectionSlug, globalSlug } = useDocumentInfo();
  const { config } = useConfig();
  const { i18n } = useTranslation();
  const { schedulePublish } = useServerFunctions();

  const timezones = config.admin?.timezones;
  const supportedTimezones = useMemo(
    () => (timezones?.supportedTimezones ?? []) as ReadonlyArray<{ label: string; value: string }>,
    [timezones],
  );
  const defaultTimezone =
    timezones?.defaultTimezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [openInternal, setOpenInternal] = useState(false);
  const [type, setType] = useState<ScheduleType>('publish');
  const [when, setWhen] = useState<string | null>(null);
  const [tz, setTz] = useState<string>(defaultTimezone);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingDoc[] | null>(null);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  const open = controlled ? (openProp ?? false) : openInternal;

  const handleClose = useCallback((): void => {
    if (controlled) onClose?.();
    else setOpenInternal(false);
  }, [controlled, onClose]);

  useEffect(() => {
    if (controlled) return;
    const onKey = (e: KeyboardEvent): void => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        (e.key === 'S' || e.key === 's') &&
        id != null
      ) {
        e.preventDefault();
        setOpenInternal(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [id, controlled]);

  const apiRoute = config.routes?.api ?? '/api';

  const fetchUpcoming = useCallback(async (): Promise<void> => {
    if (id == null && !globalSlug) return;
    setLoadingUpcoming(true);
    try {
      const query: Record<string, unknown> = {
        sort: 'waitUntil',
        where: {
          and: [
            { taskSlug: { equals: 'schedulePublish' } },
            { waitUntil: { greater_than: new Date().toISOString() } },
            ...(collectionSlug
              ? [
                  { 'input.doc.value': { equals: String(id) } },
                  { 'input.doc.relationTo': { equals: collectionSlug } },
                ]
              : []),
            ...(globalSlug ? [{ 'input.global': { equals: globalSlug } }] : []),
          ],
        },
      };
      const body = new URLSearchParams();
      const flatten = (prefix: string, value: unknown): void => {
        if (value === null || value === undefined) return;
        if (Array.isArray(value)) {
          value.forEach((v, i) => flatten(`${prefix}[${i}]`, v));
          return;
        }
        if (typeof value === 'object') {
          for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            flatten(prefix ? `${prefix}[${k}]` : k, v);
          }
          return;
        }
        body.append(prefix, String(value));
      };
      for (const [k, v] of Object.entries(query)) flatten(k, v);

      const res = await fetch(`${apiRoute}/payload-jobs`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept-Language': i18n.language,
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Payload-HTTP-Method-Override': 'GET',
        },
        body: body.toString(),
      });
      if (!res.ok) {
        setUpcoming([]);
        return;
      }
      const json = (await res.json()) as { docs?: UpcomingDoc[] };
      setUpcoming(json.docs ?? []);
    } catch {
      setUpcoming([]);
    } finally {
      setLoadingUpcoming(false);
    }
  }, [apiRoute, collectionSlug, globalSlug, id, i18n.language]);

  useEffect(() => {
    if (open) void fetchUpcoming();
  }, [open, fetchUpcoming]);

  if (id == null && !globalSlug) return null;

  const onSubmit = async (): Promise<void> => {
    if (!when) {
      setError('Pick a date and time.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Cast via SchedulePublishArgs to call with the correct server-function
      // arg shape. The conditional branches construct a structurally valid
      // object; exactOptionalPropertyTypes prevents a cleaner spread so we
      // use a single cast on the final object.
      const scheduleArgs = (
        collectionSlug && id != null
          ? { type, date: new Date(when), timezone: tz, doc: { relationTo: collectionSlug, value: String(id) } }
          : globalSlug
            ? { type, date: new Date(when), timezone: tz, global: globalSlug }
            : { type, date: new Date(when), timezone: tz }
      ) as SchedulePublishArgs;
      const result = await schedulePublish(scheduleArgs);
      if (hasError(result)) {
        setError(result.error);
        return;
      }
      setWhen(null);
      showToast({
        message: type === 'publish' ? 'Publish scheduled.' : 'Unpublish scheduled.',
        type: 'success',
      });
      await fetchUpcoming();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (deleteID: number | string): Promise<void> => {
    setDeletingId(deleteID);
    try {
      const result = await schedulePublish({ deleteID });
      if (hasError(result)) {
        showToast({ message: result.error, type: 'error' });
        return;
      }
      showToast({ message: 'Scheduled event removed.', type: 'success' });
      await fetchUpcoming();
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : 'Failed to delete',
        type: 'error',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const radioPill = (value: ScheduleType, label: string): ReactElement => {
    const checked = type === value;
    return (
      <label
        key={value}
        className={`cs-radio-field__pill${checked ? ' is-checked' : ''}`}
      >
        <input
          type="radio"
          name={typeName}
          value={value}
          checked={checked}
          onChange={() => setType(value)}
          className="cs-radio-field__native"
          disabled={busy}
        />
        <span className="cs-radio-field__dot" aria-hidden="true" />
        <span>{label}</span>
      </label>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      labelledBy={titleId}
      size="lg"
      dismissOnBackdrop={false}
    >
      <DialogHeader
        id={titleId}
        title="Schedule publish"
        onClose={handleClose}
        description="Queue a publish or unpublish for a future date. The job runs from the publishing queue."
      />
      <DialogBody>
        <div className="cs-schedule">
          <div className="cs-schedule__form">
            <div className="cs-schedule__field">
              <span className="cs-schedule__label">
                Type <span className="cs-schedule__req">*</span>
              </span>
              <div className="cs-radio-field__group" role="radiogroup" aria-label="Type">
                {radioPill('publish', 'Publish')}
                {radioPill('unpublish', 'Unpublish')}
              </div>
            </div>

            <div className="cs-schedule__field">
              <span className="cs-schedule__label">
                Time <span className="cs-schedule__req">*</span>
              </span>
              <DateTimePicker
                value={when}
                onChange={setWhen}
                mode="datetime"
                timezone={tz}
                minDate={new Date().toISOString()}
              />
            </div>

            {supportedTimezones.length > 0 ? (
              <div className="cs-schedule__field">
                <span className="cs-schedule__label">Timezone</span>
                <select
                  className="cs-schedule__select"
                  value={tz}
                  onChange={(e) => setTz(e.target.value)}
                  disabled={busy}
                >
                  {supportedTimezones.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {error ? (
              <output className="cs-schedule-error" role="alert">
                {error}
              </output>
            ) : null}
          </div>

          <div className="cs-schedule__upcoming">
            <h4 className="cs-schedule__upcoming-title">Upcoming Events</h4>
            {loadingUpcoming && upcoming === null ? (
              <div className="cs-schedule__upcoming-empty">
                <Spinner size="sm" /> Loading…
              </div>
            ) : !upcoming || upcoming.length === 0 ? (
              <div className="cs-schedule__upcoming-empty">
                No upcoming events scheduled.
              </div>
            ) : (
              <table className="cs-schedule__table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Time</th>
                    <th>Timezone</th>
                    <th aria-label="Delete" />
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((row) => {
                    const rowType = row.input?.type ?? 'publish';
                    const rowTz = row.input?.timezone ?? tz;
                    return (
                      <tr key={String(row.id)}>
                        <td>
                          <span
                            className={`cs-schedule__pill cs-schedule__pill--${rowType}`}
                          >
                            {rowType === 'publish' ? 'Publish' : 'Unpublish'}
                          </span>
                        </td>
                        <td>{fmtAbsolute(row.waitUntil, rowTz)}</td>
                        <td className="cs-schedule__tz">{rowTz}</td>
                        <td>
                          <button
                            type="button"
                            className="cs-schedule__delete"
                            aria-label="Delete scheduled event"
                            onClick={() => void onDelete(row.id)}
                            disabled={deletingId === row.id}
                          >
                            {deletingId === row.id ? '…' : '×'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </DialogBody>
      <DialogFooter>
        <button
          type="button"
          className="cs-btn cs-btn--subtle"
          onClick={handleClose}
          disabled={busy}
        >
          Close
        </button>
        <button
          type="button"
          className="cs-btn cs-btn--primary"
          onClick={() => void onSubmit()}
          disabled={busy || !when}
        >
          {busy ? 'Scheduling…' : type === 'publish' ? 'Schedule publish' : 'Schedule unpublish'}
        </button>
      </DialogFooter>
    </Dialog>
  );
};

export default SchedulePublishDialog;
