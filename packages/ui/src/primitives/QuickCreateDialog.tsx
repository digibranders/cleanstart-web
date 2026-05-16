'use client';

import type { ChangeEvent, FormEvent, ReactElement } from 'react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { slugify } from '../lib/slugify';
import { Dialog, DialogBody, DialogFooter, DialogHeader } from './Dialog';

export type QuickCreateField =
  | {
      readonly name: string;
      readonly type: 'text';
      readonly label: string;
      readonly required?: boolean;
      readonly placeholder?: string;
      readonly maxLength?: number;
    }
  | {
      readonly name: string;
      readonly type: 'slug';
      readonly label: string;
      /** Sibling field whose value mirrors into this one when blank. */
      readonly source: string;
      readonly required?: boolean;
    }
  | {
      readonly name: string;
      readonly type: 'select';
      readonly label: string;
      readonly required?: boolean;
      readonly options: ReadonlyArray<{ readonly label: string; readonly value: string }>;
    };

export type QuickCreateIntent = 'draft' | 'publish';

export type QuickCreateDialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  /** e.g. "New author" */
  readonly title: string;
  readonly fields: ReadonlyArray<QuickCreateField>;
  /**
   * Persist the new row. Receives the form values and the editor's
   * intent (draft / publish). Resolves with the new record's id.
   * If the collection doesn't support drafts, intent is always
   * `'publish'`.
   */
  readonly onSubmit: (
    values: Record<string, string>,
    intent: QuickCreateIntent,
  ) => Promise<{ id: string | number }>;
  /** Called after `onSubmit` resolves successfully. */
  readonly onCreated?: (id: string | number, intent: QuickCreateIntent) => void;
  /**
   * If false, only a single "Create" button is shown (intent always
   * `'publish'`). When true, both "Save Draft" and "Publish" buttons
   * are shown.
   */
  readonly supportsDrafts: boolean;
  /**
   * Optional async slug-availability check. Called on slug-field blur
   * (debounced). Resolves with `{ available: false }` to surface a
   * collision warning and disable submit.
   */
  readonly onCheckSlug?: (slug: string) => Promise<{ available: boolean }>;
};

type SubmitState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'submitting' }
  | { readonly kind: 'error'; readonly message: string };

type SlugStatus =
  | { readonly kind: 'idle' }
  | { readonly kind: 'checking' }
  | { readonly kind: 'available' }
  | { readonly kind: 'collision' };

const emptyValues = (fields: ReadonlyArray<QuickCreateField>): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const f of fields) out[f.name] = '';
  return out;
};

const findSlugField = (
  fields: ReadonlyArray<QuickCreateField>,
): Extract<QuickCreateField, { type: 'slug' }> | undefined => {
  for (const f of fields) if (f.type === 'slug') return f;
  return undefined;
};

/**
 * Compact "new record" dialog: a tiny form (1–3 fields) for collections
 * where editors create taxonomy-style stubs mid-flow without leaving
 * the page. Used by the relationship-field "+ New" affordance.
 *
 * Design constraints (intentional):
 *  - Bounded surface area — text, slug, and select only. If a
 *    collection needs richer input, the editor opens the full edit
 *    view via the "Fill in profile →" toast action after creation.
 *  - Required-field gate — Save Draft and Publish are disabled until
 *    every required field has a non-empty value (and any slug field is
 *    not blocked by a collision).
 *  - Slug auto-derivation — when present, the slug mirrors the live
 *    slugified value of its `source` sibling until the editor types
 *    into the slug input directly (which locks it). Same UX as the
 *    full-form SlugField.
 */
export const QuickCreateDialog = (props: QuickCreateDialogProps): ReactElement => {
  const {
    open,
    onClose,
    title,
    fields,
    onSubmit,
    onCreated,
    supportsDrafts,
    onCheckSlug,
  } = props;

  const headingId = useId();
  const errorId = useId();
  const firstFieldRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  const [values, setValues] = useState<Record<string, string>>(() => emptyValues(fields));
  const [slugManual, setSlugManual] = useState<boolean>(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>({ kind: 'idle' });
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: 'idle' });

  const slugField = useMemo(() => findSlugField(fields), [fields]);

  // Reset whenever the dialog is freshly opened.
  useEffect(() => {
    if (!open) return;
    setValues(emptyValues(fields));
    setSlugManual(false);
    setSlugStatus({ kind: 'idle' });
    setSubmitState({ kind: 'idle' });
    // Focus the first field on next paint so the native dialog's own
    // autofocus doesn't fight us.
    const t = window.setTimeout(() => firstFieldRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open, fields]);

  // Slug auto-sync: while the editor hasn't manually edited the slug
  // input, mirror the source field's slugified value live.
  useEffect(() => {
    if (!slugField || slugManual) return;
    const sourceValue = values[slugField.source] ?? '';
    const auto = slugify(sourceValue);
    setValues((prev) => (prev[slugField.name] === auto ? prev : { ...prev, [slugField.name]: auto }));
  }, [values, slugField, slugManual]);

  // Debounced slug-availability lookup (when consumer provides the check).
  useEffect(() => {
    if (!slugField || !onCheckSlug) return undefined;
    const current = (values[slugField.name] ?? '').trim();
    if (current === '') {
      setSlugStatus({ kind: 'idle' });
      return undefined;
    }
    setSlugStatus({ kind: 'checking' });
    let cancelled = false;
    const t = window.setTimeout(async () => {
      try {
        const result = await onCheckSlug(current);
        if (cancelled) return;
        setSlugStatus({ kind: result.available ? 'available' : 'collision' });
      } catch {
        // Fail open — the server-side `unique` constraint is the
        // ultimate safety net. We don't want a transient lookup failure
        // to permanently disable submit.
        if (!cancelled) setSlugStatus({ kind: 'available' });
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [values, slugField, onCheckSlug]);

  const handleChange = useCallback(
    (name: string, type: QuickCreateField['type']) =>
      (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
        const raw = e.target.value;
        const next = type === 'slug' ? slugify(raw).replace(/-+$/g, raw.endsWith('-') ? '-' : '') : raw;
        setValues((prev) => ({ ...prev, [name]: next }));
        if (type === 'slug') setSlugManual(true);
      },
    [],
  );

  const handleSlugBlur = useCallback(
    (name: string) =>
      (): void => {
        setValues((prev) => ({ ...prev, [name]: slugify(prev[name] ?? '') }));
      },
    [],
  );

  const blockingReason = useMemo((): string | null => {
    for (const f of fields) {
      if (f.required && (values[f.name] ?? '').trim() === '') {
        return `${f.label} is required.`;
      }
      // Even when not declared required, a slug field must be non-empty —
      // the consumer relies on it server-side.
      if (f.type === 'slug' && (values[f.name] ?? '').trim() === '') {
        return `${f.label} is required.`;
      }
    }
    if (slugStatus.kind === 'collision') return 'Slug is already in use.';
    if (slugStatus.kind === 'checking') return 'Checking slug availability…';
    return null;
  }, [fields, values, slugStatus]);

  const isSubmitting = submitState.kind === 'submitting';
  const submitDisabled = blockingReason !== null || isSubmitting;

  const doSubmit = useCallback(
    async (intent: QuickCreateIntent): Promise<void> => {
      if (submitDisabled) return;
      setSubmitState({ kind: 'submitting' });
      try {
        const { id } = await onSubmit(values, intent);
        onCreated?.(id, intent);
        onClose();
      } catch (err) {
        const message =
          err instanceof Error && err.message ? err.message : 'Couldn’t create — try again.';
        setSubmitState({ kind: 'error', message });
      }
    },
    [submitDisabled, onSubmit, onCreated, onClose, values],
  );

  const handleFormSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>): void => {
      e.preventDefault();
      void doSubmit(supportsDrafts ? 'publish' : 'publish');
    },
    [doSubmit, supportsDrafts],
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      labelledBy={headingId}
      size="sm"
      dismissOnBackdrop={!isSubmitting}
    >
      <DialogHeader id={headingId} title={title} onClose={onClose} />
      <form onSubmit={handleFormSubmit} className="cs-quick-create__form" noValidate>
        <DialogBody>
          {fields.map((f, idx) => {
            const id = `${headingId}-${f.name}`;
            const value = values[f.name] ?? '';
            const isFirst = idx === 0;
            const setRef = (el: HTMLInputElement | HTMLSelectElement | null): void => {
              if (isFirst) firstFieldRef.current = el;
            };

            if (f.type === 'select') {
              return (
                <div className="cs-quick-create__field" key={f.name}>
                  <label htmlFor={id} className="cs-quick-create__label">
                    {f.label}
                    {f.required ? <span className="cs-quick-create__required" aria-hidden> *</span> : null}
                  </label>
                  <select
                    id={id}
                    ref={setRef}
                    className="cs-quick-create__select"
                    value={value}
                    required={f.required}
                    onChange={handleChange(f.name, f.type)}
                    disabled={isSubmitting}
                  >
                    <option value="">{f.required ? 'Select…' : 'None'}</option>
                    {f.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            return (
              <div className="cs-quick-create__field" key={f.name}>
                <label htmlFor={id} className="cs-quick-create__label">
                  {f.label}
                  {(f.required || f.type === 'slug') ? (
                    <span className="cs-quick-create__required" aria-hidden> *</span>
                  ) : null}
                  {f.type === 'slug' && slugStatus.kind === 'available' ? (
                    <span className="cs-quick-create__chip" data-tone="ok">Available</span>
                  ) : null}
                  {f.type === 'slug' && slugStatus.kind === 'collision' ? (
                    <span className="cs-quick-create__chip" data-tone="error">In use</span>
                  ) : null}
                </label>
                <input
                  id={id}
                  ref={setRef as (el: HTMLInputElement | null) => void}
                  type="text"
                  className="cs-quick-create__input"
                  value={value}
                  required={f.required || f.type === 'slug'}
                  placeholder={f.type === 'text' ? f.placeholder : undefined}
                  maxLength={f.type === 'text' ? f.maxLength : undefined}
                  spellCheck={f.type === 'text'}
                  autoComplete="off"
                  onChange={handleChange(f.name, f.type)}
                  onBlur={f.type === 'slug' ? handleSlugBlur(f.name) : undefined}
                  disabled={isSubmitting}
                />
              </div>
            );
          })}

          {blockingReason ? (
            <p className="cs-quick-create__hint" aria-live="polite">
              {blockingReason}
            </p>
          ) : null}
          {submitState.kind === 'error' ? (
            <p id={errorId} className="cs-quick-create__error" role="alert">
              {submitState.message}
            </p>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <button
            type="button"
            className="cs-btn cs-btn--subtle"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          {supportsDrafts ? (
            <>
              <button
                type="button"
                className="cs-btn cs-btn--subtle"
                onClick={() => void doSubmit('draft')}
                disabled={submitDisabled}
                title={blockingReason ?? undefined}
              >
                {isSubmitting ? 'Saving…' : 'Save Draft'}
              </button>
              <button
                type="button"
                className="cs-btn cs-btn--primary"
                onClick={() => void doSubmit('publish')}
                disabled={submitDisabled}
                title={blockingReason ?? undefined}
              >
                {isSubmitting ? 'Publishing…' : 'Publish'}
              </button>
            </>
          ) : (
            <button
              type="submit"
              className="cs-btn cs-btn--primary"
              disabled={submitDisabled}
              title={blockingReason ?? undefined}
            >
              {isSubmitting ? 'Creating…' : 'Create'}
            </button>
          )}
        </DialogFooter>
      </form>
    </Dialog>
  );
};

export default QuickCreateDialog;
