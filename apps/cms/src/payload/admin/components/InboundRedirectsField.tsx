'use client';

import { useField } from '@payloadcms/ui';
import type { ChangeEvent, ReactElement } from 'react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import { Notice } from './Notice';
import {
  formatApiError,
  formatHitCount,
  formatRelativeDate,
  HOT_REDIRECT_THRESHOLD,
  SOURCE_LABEL,
  STATUS_OPTIONS,
  useDocPublicUrl,
  type RedirectRow,
  type RedirectStatus,
} from './_redirects-shared';

type InboundRedirectsFieldProps = {
  /** URL prefix for the collection's public route (e.g. `/blog`). */
  pathPrefix?: string;
  /** Doc-level field that owns the URL part. Defaults to `slug`. */
  sourceField?: string;
};

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
    to: row.to ?? '',
    status: row.status,
    notes: row.notes ?? '',
  });

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
 * Visual polish:
 *  - 410 rows render without a `→` arrow (no `to` field) and show a
 *    "gone" pill instead — keeps the list scannable.
 *  - Rows with `hitCount > HOT_REDIRECT_THRESHOLD` get a 🔥 marker;
 *    when ANY row is hot, the card body opens with a warning banner
 *    so editors don't casually break high-volume SEO juice.
 */
export const InboundRedirectsField = (
  props: InboundRedirectsFieldProps,
): ReactElement | null => {
  const { pathPrefix = '', sourceField = 'slug' } = props;
  const headingId = useId();
  const { publicUrl, sitePath } = useDocPublicUrl({ pathPrefix, sourceField });
  const { value: docStatusValue } = useField<string>({ path: '_status' });

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
              `Delete redirect "${row.from}" → "${row.to ?? '410 (gone)'}"?\n\nThis can't be undone. Inbound traffic from "${row.from}" will start hitting 404 instead.`,
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

  if (!publicUrl) return null;

  const isLive = docStatusValue === 'published';
  const count = fetchState.rows.length;

  // Hot-redirect surfacing — show in the header summary AND in a body
  // banner so editors don't casually break high-volume SEO juice.
  const hotRows = fetchState.rows.filter(
    (r) => (r.hitCount ?? 0) > HOT_REDIRECT_THRESHOLD,
  );
  const hotCount = hotRows.length;

  const summaryText = (() => {
    if (fetchState.status === 'loading') return 'Checking…';
    if (fetchState.status === 'error') return 'Failed to load';
    if (count === 0) return 'No inbound redirects';
    const base = count === 1 ? '1 routing here' : `${count} routing here`;
    if (hotCount > 0) {
      return `${base} · 🔥 ${hotCount} high-volume`;
    }
    return base;
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
              : hotCount > 0
                ? 'warn'
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
          {hotCount > 0 && (
            <div className="cs-inbound-redirects__hot-banner" role="note">
              <span className="cs-inbound-redirects__hot-banner-icon" aria-hidden="true">
                🔥
              </span>
              <span>
                {hotCount === 1
                  ? '1 high-volume redirect targets this page'
                  : `${hotCount} high-volume redirects target this page`}
                . Editing the slug or deleting these rows will break that
                traffic — the slug-change hook only protects you on rename,
                not on outright delete.
              </span>
            </div>
          )}

          {fetchState.status === 'error' && (
            <div style={{ marginTop: 6 }}>
              <Notice variant="error" title="Couldn’t load redirects">
                {fetchState.error ?? 'unknown error'}
              </Notice>
            </div>
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
                  <li
                    key={String(row.id)}
                    className="cs-inbound-redirects__row cs-inbound-redirects__row--editing"
                  >
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
                      <RowSummary row={row} />
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

/* ----------------------------------------------- Row summary cell */

const RowSummary = ({ row }: { row: RedirectRow }): ReactElement => {
  const isGone = row.status === '410';
  const isHot = (row.hitCount ?? 0) > HOT_REDIRECT_THRESHOLD;
  return (
    <>
      <div className="cs-inbound-redirects__row-top">
        <code className="cs-inbound-redirects__from">{row.from}</code>
        {isGone ? (
          <span
            className="cs-inbound-redirects__gone-pill"
            title="HTTP 410 Gone — page intentionally removed; no redirect target."
          >
            gone
          </span>
        ) : (
          <>
            <span className="cs-inbound-redirects__arrow" aria-hidden="true">
              →
            </span>
            <span className="cs-inbound-redirects__status">{row.status}</span>
          </>
        )}
        {isGone && (
          <span className="cs-inbound-redirects__status">{row.status}</span>
        )}
        {isHot && (
          <span
            className="cs-inbound-redirects__hot"
            title={`Over ${HOT_REDIRECT_THRESHOLD.toLocaleString()} hits — break with care.`}
            aria-label="High-traffic"
          >
            🔥
          </span>
        )}
      </div>
      <div className="cs-inbound-redirects__row-meta">
        <span>{SOURCE_LABEL[row.source]}</span>
        <span aria-hidden="true">·</span>
        <span>{formatHitCount(row.hitCount)}</span>
        {row.lastHitAt && (
          <>
            <span aria-hidden="true">·</span>
            <span>last {formatRelativeDate(row.lastHitAt)}</span>
          </>
        )}
      </div>
    </>
  );
};

/* ----------------------------------------------- Inline edit form */

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

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    // Enter on a text input triggers Save. Wrapped manually rather than
    // via a <form> element because Payload's doc edit screen mounts
    // everything inside its own <form>; nested forms are invalid HTML
    // and trigger React's hydration error.
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
        <div style={{ marginTop: 8, marginBottom: 8 }}>
          <Notice variant="error">{form.error}</Notice>
        </div>
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
