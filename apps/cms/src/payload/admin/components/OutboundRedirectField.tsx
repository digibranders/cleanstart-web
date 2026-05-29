'use client';

import { useField } from '@payloadcms/ui';
import type { ChangeEvent, ReactElement } from 'react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { ChevronDown } from './icons/Chevron';
import {
  formatApiError,
  STATUS_OPTIONS,
  useDocPublicUrl,
  type RedirectRow,
  type RedirectStatus,
} from './_redirects-shared';

type OutboundRedirectFieldProps = {
  pathPrefix?: string;
  sourceField?: string;
};

interface FetchState {
  status: 'idle' | 'loading' | 'ok' | 'error';
  /**
   * The single outbound redirect row whose `from` matches this page,
   * or null if none exists. We deliberately surface ONE row in the
   * UI even if the table has multiple — multiples for the same `from`
   * are an integrity bug the editor should resolve in the Redirects
   * collection itself.
   */
  row: RedirectRow | null;
  error?: string;
}

interface FormState {
  to: string;
  status: RedirectStatus;
  notes: string;
  error: string;
  saving: boolean;
}

const blankForm = (preset?: Partial<FormState>): FormState => ({
  to: '',
  status: '301',
  notes: '',
  error: '',
  saving: false,
  ...preset,
});

const formFromRow = (row: RedirectRow): FormState =>
  blankForm({
    to: row.to ?? '',
    status: row.status,
    notes: row.notes ?? '',
  });

/**
 * "Outbound redirect" sidebar card — the inverse of the Inbound card.
 *
 * Shows the single redirect rule whose `from` matches this page. When
 * present, this page becomes a "shadow" — visitors are routed to the
 * `to` target instead of seeing the page content. Useful for:
 *
 *   - Page retirement (301 → most relevant page; preserves SEO juice)
 *   - Vanity URLs (`/sale` → `/products?utm=spring`)
 *   - 410 Gone (page removed; tells crawlers to delist — stronger
 *     signal than a 404)
 *
 * When inactive (the default), the card collapses to a single line
 * stating that the page serves its own content. The "+ Set up an
 * outbound redirect" button expands an inline form — same shape as
 * the Inbound card, no drawer, no navigation.
 *
 * When active, the card shows a tinted warning state (so editors
 * don't forget the page is shadowed) plus Edit and Disable buttons.
 * Saving uses the standard `/api/redirects` REST surface so the
 * existing collection validation (URL shape, no self-loops,
 * chain-collapse) still governs writes.
 */
export const OutboundRedirectField = (
  props: OutboundRedirectFieldProps,
): ReactElement | null => {
  const { pathPrefix = '', sourceField = 'slug' } = props;
  const headingId = useId();
  const { publicUrl, sitePath } = useDocPublicUrl({ pathPrefix, sourceField });
  const { value: docStatusValue } = useField<string>({ path: '_status' });

  const [fetchState, setFetchState] = useState<FetchState>({
    status: 'idle',
    row: null,
  });
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(blankForm());

  const queryUrl = useMemo(() => {
    if (!publicUrl) return null;
    // Match BOTH shapes the Redirects collection allows for `from`.
    const params = new URLSearchParams();
    params.set('where[or][0][from][equals]', publicUrl);
    if (sitePath) {
      params.set('where[or][1][from][equals]', sitePath);
    }
    params.set('limit', '1');
    return `/api/redirects?${params.toString()}`;
  }, [publicUrl, sitePath]);

  const refetch = useCallback(async (): Promise<void> => {
    if (!queryUrl) return;
    setFetchState((s) => ({ status: 'loading', row: s.row }));
    try {
      const res = await fetch(queryUrl, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { docs?: RedirectRow[] };
      const row = (body.docs ?? [])[0] ?? null;
      setFetchState({ status: 'ok', row });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown';
      setFetchState({ status: 'error', row: null, error: message });
    }
  }, [queryUrl]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const handleEnableClick = useCallback((): void => {
    setEditing(true);
    setForm(blankForm());
  }, []);

  const handleEditClick = useCallback((): void => {
    if (!fetchState.row) return;
    setEditing(true);
    setForm(formFromRow(fetchState.row));
  }, [fetchState.row]);

  const handleCancel = useCallback((): void => {
    setEditing(false);
    setForm(blankForm());
  }, []);

  const handleFieldChange = useCallback(
    (key: keyof Pick<FormState, 'to' | 'status' | 'notes'>) =>
      (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [key]: e.target.value, error: '' }));
      },
    [],
  );

  const handleSaveRef = useRef<(() => Promise<void>) | null>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      if (e.key === 'Enter' && !e.shiftKey && e.currentTarget.tagName !== 'TEXTAREA') {
        e.preventDefault();
        e.stopPropagation();
        if (!form.saving) void handleSaveRef.current?.();
      }
    },
    [form.saving],
  );

  const handleSave = useCallback(async (): Promise<void> => {
    const fromValue = sitePath || publicUrl;
    if (!fromValue) {
      setForm((p) => ({ ...p, error: 'Page URL is not set yet — save the doc first.' }));
      return;
    }

    const isGone = form.status === '410';
    const toTrim = form.to.trim();
    if (!isGone && toTrim.length === 0) {
      setForm((p) => ({ ...p, error: 'Target is required unless Status is 410 (Gone).' }));
      return;
    }
    if (!isGone && toTrim === fromValue) {
      setForm((p) => ({ ...p, error: 'Target must differ from this page.' }));
      return;
    }

    setForm((p) => ({ ...p, saving: true, error: '' }));

    const existing = fetchState.row;
    const payload: Record<string, unknown> = {
      from: fromValue,
      status: form.status,
      notes: form.notes.trim() || null,
    };
    payload.to = isGone ? null : toTrim;
    if (!existing) {
      payload.source = 'archive-with-redirect';
    }

    const url = existing
      ? `/api/redirects/${encodeURIComponent(String(existing.id))}`
      : '/api/redirects';
    const method = existing ? 'PATCH' : 'POST';

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
      setEditing(false);
      setForm(blankForm());
      await refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      setForm((p) => ({ ...p, saving: false, error: message }));
    }
  }, [form, sitePath, publicUrl, fetchState.row, refetch]);

  // Keep the ref in sync so handleKeyDown always calls the latest handleSave.
  handleSaveRef.current = handleSave;

  const handleDisable = useCallback(async (): Promise<void> => {
    if (!fetchState.row) return;
    const confirmed =
      typeof window !== 'undefined'
        ? window.confirm(
            'Disable the outbound redirect?\n\nThis page will start serving its own content again. The redirect rule itself will be deleted from the Redirects collection.',
          )
        : false;
    if (!confirmed) return;

    try {
      const res = await fetch(
        `/api/redirects/${encodeURIComponent(String(fetchState.row.id))}`,
        { method: 'DELETE', credentials: 'include' },
      );
      if (!res.ok) {
        const message = await formatApiError(res);
        setForm((p) => ({ ...p, error: message }));
        return;
      }
      await refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      setForm((p) => ({ ...p, error: message }));
    }
  }, [fetchState.row, refetch]);

  if (!publicUrl) return null;

  const isLive = docStatusValue === 'published';
  const row = fetchState.row;
  const hasOutbound = row != null;

  const summaryText = (() => {
    if (fetchState.status === 'loading') return 'Checking';
    if (fetchState.status === 'error') return 'Error';
    if (!hasOutbound) return 'None';
    if (row.status === '410') return 'Gone';
    return 'Redirected';
  })();

  return (
    <div
      className="cs-outbound-redirect"
      data-expanded={expanded ? 'true' : 'false'}
      data-active={hasOutbound ? 'true' : 'false'}
    >
      <button
        type="button"
        className="cs-outbound-redirect__header"
        aria-expanded={expanded}
        aria-controls={headingId}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="cs-outbound-redirect__title">Redirect</span>
        <span
          className="cs-outbound-redirect__summary"
          data-tone={
            fetchState.status === 'error'
              ? 'error'
              : hasOutbound
                ? 'warn'
                : 'muted'
          }
        >
          {summaryText}
        </span>
        <span className="cs-outbound-redirect__chevron" aria-hidden="true">
          <ChevronDown />
        </span>
      </button>

      {expanded && (
        <div id={headingId} className="cs-outbound-redirect__body">
          {fetchState.status === 'error' && (
            <p
              className="cs-outbound-redirect__hint"
              style={{ color: 'var(--color-error-500, #ff5c5c)' }}
            >
              Couldn’t load redirects: {fetchState.error ?? 'unknown error'}
            </p>
          )}

          {editing ? (
            <InlineForm
              form={form}
              onChange={handleFieldChange}
              onKeyDown={handleKeyDown}
              onSave={handleSave}
              onCancel={handleCancel}
              mode={hasOutbound ? 'edit' : 'create'}
            />
          ) : hasOutbound && row ? (
            <ActiveSummary
              row={row}
              onEdit={handleEditClick}
              onDisable={handleDisable}
            />
          ) : isLive ? (
            <button
              type="button"
              onClick={handleEnableClick}
              className="cs-outbound-redirect__add"
            >
              + Set up an outbound redirect
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};

/* ----------------------------------------------- Active summary block */

const ActiveSummary = (props: {
  row: RedirectRow;
  onEdit: () => void;
  onDisable: () => void;
}): ReactElement => {
  const { row, onEdit, onDisable } = props;
  const isGone = row.status === '410';
  return (
    <div className="cs-outbound-redirect__active">
      <dl className="cs-outbound-redirect__kv">
        <div>
          <dt>From (this page)</dt>
          <dd>
            <code>{row.from}</code>
          </dd>
        </div>
        {!isGone && (
          <div>
            <dt>Routes to</dt>
            <dd>
              <code>{row.to}</code>
            </dd>
          </div>
        )}
        <div>
          <dt>Status</dt>
          <dd>
            {row.status}
            {isGone && ' · permanently gone'}
          </dd>
        </div>
        {row.notes && (
          <div>
            <dt>Notes</dt>
            <dd>{row.notes}</dd>
          </div>
        )}
      </dl>
      <div className="cs-outbound-redirect__active-actions">
        <button
          type="button"
          onClick={onEdit}
          className="cs-outbound-redirect__btn cs-outbound-redirect__btn--primary"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDisable}
          className="cs-outbound-redirect__btn cs-outbound-redirect__btn--danger"
          title="Delete the outbound redirect — the page will serve its own content again."
        >
          Disable
        </button>
      </div>
    </div>
  );
};

/* ----------------------------------------------- Inline edit/create */

interface InlineFormProps {
  mode: 'edit' | 'create';
  form: FormState;
  onChange: (
    key: keyof Pick<FormState, 'to' | 'status' | 'notes'>,
  ) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSave: () => void;
  onCancel: () => void;
}

const InlineForm = (props: InlineFormProps): ReactElement => {
  const { mode, form, onChange, onKeyDown, onSave, onCancel } = props;
  const isGone = form.status === '410';
  const toId = useId();
  const statusId = useId();
  const notesId = useId();

  return (
    <div className="cs-outbound-redirect__form">
      <label htmlFor={statusId} className="cs-outbound-redirect__form-label">
        Status
      </label>
      <select
        id={statusId}
        value={form.status}
        onChange={onChange('status')}
        className="cs-outbound-redirect__select"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {!isGone && (
        <>
          <label htmlFor={toId} className="cs-outbound-redirect__form-label">
            Redirect to
          </label>
          <input
            id={toId}
            type="text"
            value={form.to}
            onChange={onChange('to')}
            onKeyDown={onKeyDown}
            placeholder="/blog/replacement-page"
            spellCheck={false}
            autoComplete="off"
            className="cs-outbound-redirect__input"
          />
        </>
      )}

      <label htmlFor={notesId} className="cs-outbound-redirect__form-label">
        Notes <span className="cs-outbound-redirect__form-label-soft">(optional)</span>
      </label>
      <textarea
        id={notesId}
        value={form.notes}
        onChange={onChange('notes')}
        rows={2}
        className="cs-outbound-redirect__textarea"
      />

      {form.error && (
        <p className="cs-outbound-redirect__form-error">{form.error}</p>
      )}

      <div className="cs-outbound-redirect__form-actions">
        <button
          type="button"
          onClick={onSave}
          className="cs-outbound-redirect__btn cs-outbound-redirect__btn--primary"
          disabled={form.saving}
        >
          {form.saving
            ? 'Saving…'
            : mode === 'create'
              ? 'Enable redirect'
              : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="cs-outbound-redirect__btn"
          disabled={form.saving}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
