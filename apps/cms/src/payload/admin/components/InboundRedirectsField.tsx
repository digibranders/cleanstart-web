'use client';

import { useField } from '@payloadcms/ui';
import type { ChangeEvent, ReactElement } from 'react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';

type InboundRedirectsFieldProps = {
  /** URL prefix for the collection's public route (e.g. `/blog`). */
  pathPrefix?: string;
  /** Doc-level field that owns the URL part. Defaults to `slug`. */
  sourceField?: string;
};

type RedirectStatus = '301' | '302' | '307' | '308' | '410';
type RedirectSource =
  | 'manual'
  | 'slug-change'
  | 'archive-with-redirect'
  | 'migration-seed';

interface RedirectRow {
  id: string | number;
  from: string;
  to: string;
  status: RedirectStatus;
  source: RedirectSource;
  hitCount?: number | null;
  lastHitAt?: string | null;
  notes?: string | null;
}

interface FetchState {
  status: 'idle' | 'loading' | 'ok' | 'error';
  rows: readonly RedirectRow[];
  error?: string;
}

interface FormState {
  from: string;
  to: string;
  status: RedirectStatus;
  notes: string;
  /** Server validation error to surface under the form. */
  error: string;
  /** Network in-flight flag. */
  saving: boolean;
}

const DEFAULT_SITE_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SITE_URL) ||
  'https://cleanstart.com';

const STATUS_OPTIONS: { value: RedirectStatus; label: string; hint: string }[] = [
  { value: '301', label: '301 · Permanent', hint: 'Best for renamed/moved pages — search engines transfer SEO juice.' },
  { value: '308', label: '308 · Permanent (preserves method)', hint: 'Modern 301 — preserves POST/PUT request bodies.' },
  { value: '302', label: '302 · Temporary', hint: 'Short-lived. Mostly superseded by 307.' },
  { value: '307', label: '307 · Temporary (preserves method)', hint: 'A/B tests, maintenance, geo-redirects. Preserves request method/body.' },
  { value: '410', label: '410 · Gone', hint: 'Permanently removed. No target needed — tells crawlers to delist.' },
];

const sourceLabel: Record<RedirectSource, string> = {
  manual: 'manual',
  'slug-change': 'auto · slug change',
  'archive-with-redirect': 'archived',
  'migration-seed': 'migration',
};

const trimSlash = (s: string): string => s.replace(/^\/+|\/+$/g, '');

const formatHitCount = (n: number | null | undefined): string => {
  if (n == null || n === 0) return '0 hits';
  if (n === 1) return '1 hit';
  if (n < 1000) return `${n} hits`;
  return `${(n / 1000).toFixed(1)}k hits`;
};

const formatRelativeDate = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return '';
  const diffMs = Date.now() - ts;
  const day = 24 * 60 * 60 * 1000;
  if (diffMs < day) return 'today';
  const days = Math.floor(diffMs / day);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
};

const blankForm = (preset?: Partial<FormState>): FormState => ({
  from: '',
  to: '',
  status: '301',
  notes: '',
  error: '',
  saving: false,
  ...preset,
});

const formFromRow = (row: RedirectRow): FormState =>
  blankForm({
    from: row.from,
    to: row.to,
    status: row.status,
    notes: row.notes ?? '',
  });

/** Extract a useful single-line error message from Payload's API error shape. */
const formatApiError = async (res: Response): Promise<string> => {
  try {
    const body = (await res.json()) as { errors?: { message?: string }[]; message?: string };
    if (Array.isArray(body.errors) && body.errors[0]?.message) {
      return body.errors[0].message;
    }
    if (body.message) return body.message;
  } catch {
    // ignore — fall through
  }
  return `HTTP ${res.status}`;
};

/**
 * Fully-inline CRUD card for the Redirects table, scoped to the
 * current page's URL. Editors can list, edit, create, and delete
 * redirect rows directly inside the SEO sidebar — no drawer, no
 * navigation away from the doc form.
 *
 * Server-side invariants are preserved: every operation goes through
 * the standard `/api/redirects` REST endpoints, so the existing
 * collection validation (URL shape, no self-loops, source-locked
 * rows) and the chain-collapse hook continue to govern writes. The
 * inline UI just removes the navigation cost.
 *
 * Field-level locks for `source: 'slug-change'` rows are surfaced
 * visually (read-only inputs) on top of the server-side enforcement —
 * keeps editors from trying to edit auto-managed rows in the first
 * place.
 */
export const InboundRedirectsField = (
  props: InboundRedirectsFieldProps,
): ReactElement | null => {
  const { pathPrefix = '', sourceField = 'slug' } = props;
  const headingId = useId();
  const { value: sourceValue } = useField<string>({ path: sourceField });
  const { value: docStatusValue } = useField<string>({ path: '_status' });

  const publicUrl = useMemo(() => {
    if (!sourceValue) return '';
    const root = DEFAULT_SITE_URL.replace(/\/+$/, '');
    const prefix = pathPrefix ? `/${trimSlash(pathPrefix)}` : '';
    return `${root}${prefix}/${trimSlash(sourceValue)}`;
  }, [sourceValue, pathPrefix]);

  const sitePath = useMemo(() => {
    if (!sourceValue) return '';
    const prefix = pathPrefix ? `/${trimSlash(pathPrefix)}` : '';
    return `${prefix}/${trimSlash(sourceValue)}`;
  }, [sourceValue, pathPrefix]);

  const [fetchState, setFetchState] = useState<FetchState>({
    status: 'idle',
    rows: [],
  });
  const [expanded, setExpanded] = useState(false);

  // Edit / create UI state. Only one row is in edit mode at a time;
  // opening the create form collapses any open edit row, and vice
  // versa. Keeps the sidebar from growing into a wall of forms.
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [form, setForm] = useState<FormState>(blankForm());

  const queryUrl = useMemo(() => {
    if (!publicUrl) return null;
    const params = new URLSearchParams();
    params.set('where[or][0][to][equals]', publicUrl);
    if (sitePath) {
      params.set('where[or][1][to][equals]', sitePath);
    }
    params.set('sort', '-hitCount');
    params.set('limit', '20');
    return `/api/redirects?${params.toString()}`;
  }, [publicUrl, sitePath]);

  const refetch = useCallback(async (): Promise<void> => {
    if (!queryUrl) return;
    setFetchState((s) => ({ status: 'loading', rows: s.rows }));
    try {
      const res = await fetch(queryUrl, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { docs?: RedirectRow[] };
      const rows = Array.isArray(body.docs) ? body.docs : [];
      setFetchState({ status: 'ok', rows });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown';
      setFetchState({ status: 'error', rows: [], error: message });
    }
  }, [queryUrl]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const handleEditClick = useCallback((row: RedirectRow): void => {
    setCreatingNew(false);
    setEditingId(row.id);
    setForm(formFromRow(row));
  }, []);

  const handleCancel = useCallback((): void => {
    setEditingId(null);
    setCreatingNew(false);
    setForm(blankForm());
  }, []);

  const handleAddNewClick = useCallback((): void => {
    setEditingId(null);
    setCreatingNew(true);
    setForm(
      blankForm({
        // `to` defaults to the current page's site-relative path so
        // editors only fill in `from`. They can override.
        to: sitePath || publicUrl,
      }),
    );
  }, [sitePath, publicUrl]);

  const handleFieldChange = useCallback(
    (key: keyof Pick<FormState, 'from' | 'to' | 'status' | 'notes'>) =>
      (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const v = e.target.value;
        setForm((prev) => ({ ...prev, [key]: v, error: '' }));
      },
    [],
  );

  const handleSave = useCallback(
    async (id: string | number | null): Promise<void> => {
      // Client-side guards before hitting the network. Server still
      // validates, but these catch the most common typos.
      const fromTrim = form.from.trim();
      if (fromTrim.length === 0) {
        setForm((p) => ({ ...p, error: 'From is required.' }));
        return;
      }
      const isGone = form.status === '410';
      const toTrim = form.to.trim();
      if (!isGone && toTrim.length === 0) {
        setForm((p) => ({ ...p, error: 'To is required unless Status is 410 (Gone).' }));
        return;
      }
      if (!isGone && toTrim === fromTrim) {
        setForm((p) => ({ ...p, error: 'Destination cannot be the same as the source.' }));
        return;
      }

      setForm((p) => ({ ...p, saving: true, error: '' }));

      const payload: Record<string, unknown> = {
        from: fromTrim,
        status: form.status,
        notes: form.notes.trim() || null,
      };
      if (isGone) {
        payload.to = null;
      } else {
        payload.to = toTrim;
      }
      // For new rows we set `source: 'manual'`. Existing rows keep
      // whatever they had (server enforces the lock for slug-change).
      if (id == null) payload.source = 'manual';

      const url = id == null ? '/api/redirects' : `/api/redirects/${encodeURIComponent(String(id))}`;
      const method = id == null ? 'POST' : 'PATCH';

      try {
        const res = await fetch(url, {
          method,
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const message = await formatApiError(res);
          setForm((p) => ({ ...p, saving: false, error: message }));
          return;
        }
        // Success — collapse the form and refetch.
        setEditingId(null);
        setCreatingNew(false);
        setForm(blankForm());
        await refetch();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Network error';
        setForm((p) => ({ ...p, saving: false, error: message }));
      }
    },
    [form, refetch],
  );

  const handleDelete = useCallback(
    async (row: RedirectRow): Promise<void> => {
      const confirmed =
        typeof window !== 'undefined'
          ? window.confirm(
              `Delete redirect "${row.from}" → "${row.to}"?\n\nThis can't be undone. Inbound traffic from "${row.from}" will start hitting 404 instead.`,
            )
          : false;
      if (!confirmed) return;

      try {
        const res = await fetch(
          `/api/redirects/${encodeURIComponent(String(row.id))}`,
          { method: 'DELETE', credentials: 'include' },
        );
        if (!res.ok) {
          const message = await formatApiError(res);
          setForm((p) => ({ ...p, error: message }));
          return;
        }
        setEditingId(null);
        await refetch();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Network error';
        setForm((p) => ({ ...p, error: message }));
      }
    },
    [refetch],
  );

  // No URL yet → nothing to show.
  if (!publicUrl) return null;

  const isLive = docStatusValue === 'published';
  const count = fetchState.rows.length;

  const summaryText = (() => {
    if (fetchState.status === 'loading') return 'Checking…';
    if (fetchState.status === 'error') return 'Failed to load';
    if (count === 0) return 'No inbound redirects';
    if (count === 1) return '1 routing here';
    return `${count} routing here`;
  })();

  return (
    <div
      className="cs-inbound-redirects"
      data-expanded={expanded ? 'true' : 'false'}
    >
      <button
        type="button"
        className="cs-inbound-redirects__header"
        aria-expanded={expanded}
        aria-controls={headingId}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="cs-inbound-redirects__title">Inbound redirects</span>
        <span
          className="cs-inbound-redirects__summary"
          data-tone={
            fetchState.status === 'error'
              ? 'error'
              : count > 0
                ? 'active'
                : 'muted'
          }
        >
          {summaryText}
        </span>
        <span className="cs-inbound-redirects__chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {expanded && (
        <div id={headingId} className="cs-inbound-redirects__body">
          {fetchState.status === 'error' && (
            <p
              className="cs-inbound-redirects__hint"
              style={{ color: 'var(--color-error-500, #ff5c5c)' }}
            >
              Couldn’t load redirects: {fetchState.error ?? 'unknown error'}
            </p>
          )}

          {fetchState.status === 'ok' && count === 0 && !creatingNew && (
            <p className="cs-inbound-redirects__hint">
              No redirects point to this page yet.
            </p>
          )}

          {count > 0 && (
            <ul className="cs-inbound-redirects__list">
              {fetchState.rows.map((row) =>
                editingId === row.id ? (
                  <li key={String(row.id)} className="cs-inbound-redirects__row cs-inbound-redirects__row--editing">
                    <InlineForm
                      mode="edit"
                      row={row}
                      form={form}
                      onChange={handleFieldChange}
                      onSave={() => handleSave(row.id)}
                      onCancel={handleCancel}
                      onDelete={() => handleDelete(row)}
                    />
                  </li>
                ) : (
                  <li key={String(row.id)} className="cs-inbound-redirects__row">
                    <button
                      type="button"
                      onClick={() => handleEditClick(row)}
                      className="cs-inbound-redirects__row-link"
                      title={
                        row.source === 'slug-change'
                          ? 'Auto-managed slug-change redirect — only Notes is editable.'
                          : 'Edit redirect'
                      }
                    >
                      <div className="cs-inbound-redirects__row-top">
                        <code className="cs-inbound-redirects__from">{row.from}</code>
                        <span className="cs-inbound-redirects__arrow" aria-hidden="true">→</span>
                        <span className="cs-inbound-redirects__status">{row.status}</span>
                        {(row.hitCount ?? 0) > 100 && (
                          <span
                            className="cs-inbound-redirects__hot"
                            title="High-traffic redirect — break with care"
                            aria-label="High-traffic"
                          >
                            🔥
                          </span>
                        )}
                      </div>
                      <div className="cs-inbound-redirects__row-meta">
                        <span>{sourceLabel[row.source]}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatHitCount(row.hitCount)}</span>
                        {row.lastHitAt && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>last {formatRelativeDate(row.lastHitAt)}</span>
                          </>
                        )}
                      </div>
                    </button>
                  </li>
                ),
              )}
            </ul>
          )}

          {creatingNew ? (
            <div className="cs-inbound-redirects__create">
              <InlineForm
                mode="create"
                form={form}
                onChange={handleFieldChange}
                onSave={() => handleSave(null)}
                onCancel={handleCancel}
              />
            </div>
          ) : isLive ? (
            <button
              type="button"
              onClick={handleAddNewClick}
              className="cs-inbound-redirects__add"
              title="Add a redirect that points here, inline"
            >
              + Add a redirect that points here
            </button>
          ) : (
            <p className="cs-inbound-redirects__hint">
              Publish the page to add a redirect that targets it.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

interface InlineFormProps {
  mode: 'edit' | 'create';
  /** Original row when editing, undefined when creating. */
  row?: RedirectRow;
  form: FormState;
  onChange: (
    key: keyof Pick<FormState, 'from' | 'to' | 'status' | 'notes'>,
  ) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSave: () => void;
  onCancel: () => void;
  /** Only edit mode passes onDelete (create mode has Cancel only). */
  onDelete?: () => void;
}

const InlineForm = (props: InlineFormProps): ReactElement => {
  const { mode, row, form, onChange, onSave, onCancel, onDelete } = props;
  const isSlugChange = row?.source === 'slug-change';
  const isGone = form.status === '410';
  const fromLockedByServer = isSlugChange;
  const toLockedByServer = isSlugChange;
  const statusLockedByServer = isSlugChange;
  const fromId = useId();
  const toId = useId();
  const statusId = useId();
  const notesId = useId();

  const currentStatusHint = STATUS_OPTIONS.find((o) => o.value === form.status)?.hint;

  // Enter on a text input triggers Save. Wrapped manually rather than
  // via a <form> element because Payload's doc edit screen already
  // mounts everything inside its own <form> — nesting forms is invalid
  // HTML and triggers React's hydration error.
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    if (e.key === 'Enter' && !e.shiftKey && e.currentTarget.tagName !== 'TEXTAREA') {
      e.preventDefault();
      e.stopPropagation();
      if (!form.saving) onSave();
    }
  };

  return (
    <div className="cs-inbound-redirects__form">
      {isSlugChange && (
        <p className="cs-inbound-redirects__lock-hint">
          🔒 System-managed slug-change row — From, To, Status are locked. Only Notes is editable.
        </p>
      )}

      <label htmlFor={fromId} className="cs-inbound-redirects__form-label">
        From
      </label>
      <input
        id={fromId}
        type="text"
        value={form.from}
        onChange={onChange('from')}
        onKeyDown={handleKeyDown}
        placeholder="/old-pricing"
        spellCheck={false}
        autoComplete="off"
        readOnly={fromLockedByServer}
        className="cs-inbound-redirects__input"
      />

      <label htmlFor={statusId} className="cs-inbound-redirects__form-label">
        Status
      </label>
      <select
        id={statusId}
        value={form.status}
        onChange={onChange('status')}
        disabled={statusLockedByServer}
        className="cs-inbound-redirects__select"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {currentStatusHint && (
        <p className="cs-inbound-redirects__form-hint">{currentStatusHint}</p>
      )}

      {!isGone && (
        <>
          <label htmlFor={toId} className="cs-inbound-redirects__form-label">
            To
          </label>
          <input
            id={toId}
            type="text"
            value={form.to}
            onChange={onChange('to')}
            onKeyDown={handleKeyDown}
            placeholder="/blog/new-pricing"
            spellCheck={false}
            autoComplete="off"
            readOnly={toLockedByServer}
            className="cs-inbound-redirects__input"
          />
        </>
      )}

      <label htmlFor={notesId} className="cs-inbound-redirects__form-label">
        Notes <span className="cs-inbound-redirects__form-label-soft">(optional)</span>
      </label>
      <textarea
        id={notesId}
        value={form.notes}
        onChange={onChange('notes')}
        placeholder="Why this redirect exists. Future editors thank you."
        rows={2}
        className="cs-inbound-redirects__textarea"
      />

      {form.error && (
        <p className="cs-inbound-redirects__form-error">{form.error}</p>
      )}

      <div className="cs-inbound-redirects__form-actions">
        <button
          type="button"
          onClick={onSave}
          className="cs-inbound-redirects__btn cs-inbound-redirects__btn--primary"
          disabled={form.saving}
        >
          {form.saving ? 'Saving…' : mode === 'create' ? 'Add redirect' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="cs-inbound-redirects__btn"
          disabled={form.saving}
        >
          Cancel
        </button>
        {mode === 'edit' && onDelete && !isSlugChange && (
          <button
            type="button"
            onClick={onDelete}
            className="cs-inbound-redirects__btn cs-inbound-redirects__btn--danger"
            disabled={form.saving}
            title="Permanently delete this redirect rule"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};
