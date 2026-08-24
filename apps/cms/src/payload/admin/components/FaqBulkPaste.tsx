'use client';

import { useField, useForm } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { parseFaqBulk } from '../../lib/faq-bulk-parse';
import { showToast } from './ToastBus';

type FaqBulkPasteProps = {
  path: string;
  schemaPath?: string;
  /**
   * Name of the sibling array field whose rows should receive the
   * parsed Q&A pairs. Defaults to `items` (matches the FAQ block).
   * Pass `'faqs'` for the inline `faqs` arrays on Blogs / Guides.
   */
  targetField?: string;
  /**
   * Shape of the sibling `answer` field this instance writes into.
   * `'text'` (default) matches the FAQ block's plain `textarea`
   * (blocks/FAQ.ts) — `'richText'` matches Blogs/Guides/KnowledgeBase's
   * Lexical `answer` field (fields/faqs.ts). Must match the actual
   * field's Payload type: writing a Lexical object into a `textarea`
   * field renders `[object Object]`, and writing a plain string into a
   * `richText` field can't be parsed by the Lexical editor. This is a
   * hand-maintained invariant, not runtime-checked against the field's
   * real config — if a field's `type` ever changes, update its
   * `answerFormat` here too.
   */
  answerFormat?: 'richText' | 'text';
};

const replaceLastSegment = (input: string, replacement: string): string => {
  const idx = input.lastIndexOf('.');
  return idx === -1 ? replacement : `${input.slice(0, idx)}.${replacement}`;
};

const escapeRegExp = (input: string): string =>
  input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const paragraphsToLexical = (paragraphs: string[]): Record<string, unknown> => {
  const children = paragraphs
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((text) => ({
      type: 'paragraph',
      children: [
        {
          type: 'text',
          text,
          format: 0,
          detail: 0,
          mode: 'normal',
          style: '',
          version: 1,
        },
      ],
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    }));
  return {
    root: {
      type: 'root',
      // Lexical's `setEditorState` throws if `root.children` is empty
      // (e.g. every pasted answer line was blank) — a single empty
      // paragraph keeps the doc valid instead of crashing that row's
      // editor on render.
      children: children.length > 0
        ? children
        : [
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: '', format: 0, detail: 0, mode: 'normal', style: '', version: 1 },
              ],
              direction: null,
              format: '',
              indent: 0,
              version: 1,
            },
          ],
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    },
  };
};

const buildAnswerValue = (
  answerParagraphs: string[],
  answerFormat: 'richText' | 'text',
): unknown =>
  answerFormat === 'richText'
    ? paragraphsToLexical(answerParagraphs)
    : answerParagraphs.join('\n\n');

const buildSubFieldState = (
  question: string,
  answerParagraphs: string[],
  answerFormat: 'richText' | 'text',
): Record<string, { initialValue: unknown; value: unknown; valid: true }> => {
  const answerValue = buildAnswerValue(answerParagraphs, answerFormat);
  return {
    question: { initialValue: question, value: question, valid: true },
    answer: { initialValue: answerValue, value: answerValue, valid: true },
  };
};

/**
 * Mounted via the `bulkPaste` UI field on every FAQ array (FAQ block,
 * Blogs `faqs`, Guides `faqs`).
 *
 * Two behaviours, neither rendering chrome in the form area:
 *
 *  1. Bulk paste auto-split — when an editor pastes a multi-Q&A block
 *     (≥ 2 pairs) into ANY FAQ question input within this field's
 *     sibling array, intercept the paste and explode it into proper
 *     rows.
 *  2. Inline "Clear all" action — React Portal injects a button into
 *     the array-field's header-actions row, alongside Collapse All /
 *     Show All / kebab. Clicking it confirms then removes every row.
 *
 * Why a Portal: vanilla DOM injection into Payload's React-managed
 * header-actions UL gets ripped out by React's reconciler on the next
 * render. A Portal makes React own the inserted node, so it survives.
 */
export const FaqBulkPaste = (props: FaqBulkPasteProps): ReactElement | null => {
  const { path, schemaPath, targetField = 'items', answerFormat = 'text' } = props;
  const { addFieldRow, dispatchFields, removeFieldRow, getDataByPath } = useForm();
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);

  // Subscribe to the array's value reactively so Clear all hides the
  // moment the array goes empty (and shows back as soon as rows
  // exist) without waiting for a full form re-render.
  const { value: arrayValue } = useField<unknown[]>({
    path: useMemo(
      () => replaceLastSegment(path, targetField),
      [path, targetField],
    ),
  });
  const rowCount = Array.isArray(arrayValue) ? arrayValue.length : 0;

  const arrayPath = useMemo(
    () => replaceLastSegment(path, targetField),
    [path, targetField],
  );
  const arraySchemaPath = useMemo(
    () => (schemaPath ? replaceLastSegment(schemaPath, targetField) : targetField),
    [schemaPath, targetField],
  );

  const inputNamePattern = useMemo(
    () => new RegExp(`^${escapeRegExp(arrayPath)}\\.(\\d+)\\.question$`),
    [arrayPath],
  );

  const arrayLeaf = useMemo(() => {
    const parts = arrayPath.split('.');
    return parts[parts.length - 1] ?? '';
  }, [arrayPath]);

  // ─── Bulk paste auto-split ─────────────────────────────────────
  const handlePaste = useCallback(
    (event: Event) => {
      const ce = event as ClipboardEvent;
      const target = ce.target as HTMLElement | null;
      if (!(target instanceof HTMLInputElement)) return;
      const inputName = target.getAttribute('name') || '';
      const match = inputName.match(inputNamePattern);
      if (!match) return;

      const text = ce.clipboardData?.getData('text/plain') ?? '';
      const parsed = parseFaqBulk(text);
      if (parsed.length < 2) return;

      ce.preventDefault();
      ce.stopImmediatePropagation();

      const startIndex = Number.parseInt(match[1] ?? '0', 10);
      const [firstPair, ...restPairs] = parsed;
      if (!firstPair) return;

      // Set the values on the row the user pasted into (keeping its
      // existing id), then ADD_ROW for the remaining pairs. Avoids
      // REPLACE_ROW (acts like insert in our state shape) and
      // REMOVE_ROW + ADD_ROW (race conditions across the React
      // reducer commit), and preserves the row's stable identity.
      const firstAnswer = buildAnswerValue(firstPair.answerParagraphs, answerFormat);
      dispatchFields({
        type: 'UPDATE',
        path: `${arrayPath}.${startIndex}.question`,
        value: firstPair.question,
      });
      dispatchFields({
        type: 'UPDATE',
        path: `${arrayPath}.${startIndex}.answer`,
        value: firstAnswer,
      });
      restPairs.forEach((pair, i) => {
        addFieldRow({
          path: arrayPath,
          schemaPath: arraySchemaPath,
          rowIndex: startIndex + 1 + i,
          subFieldState: buildSubFieldState(pair.question, pair.answerParagraphs, answerFormat),
        });
      });

      showToast({ message: `${parsed.length} Q&A pairs split and added.`, type: 'success' });
    },
    [addFieldRow, answerFormat, arrayPath, arraySchemaPath, dispatchFields, inputNamePattern],
  );

  useEffect(() => {
    document.addEventListener('paste', handlePaste, true);
    return () => {
      document.removeEventListener('paste', handlePaste, true);
    };
  }, [handlePaste]);

  // ─── Auto-focus the new row's Question on "Add FAQ" ──────────────
  // When a single new `.array-field__row` is appended (standard
  // add-row click), focus its first text input — which is always the
  // Question field, since the row schema is `question` → `answer`.
  //
  // Implemented with a MutationObserver scoped to the FAQ array's
  // field container: not coupled to useField row counts, robust to
  // the row's content rendering on a delay (the input may appear up
  // to ~1s after the row node), and naturally ignores bulk-paste
  // (which inserts multiple rows in one batch — count delta ≠ 1).
  useEffect(() => {
    const findField = (): HTMLElement | null => {
      const expected = `field-${arrayLeaf}`;
      return (
        document.getElementById(expected) ??
        document.querySelector<HTMLElement>(`[id^="${expected}__"]`)
      );
    };

    let cancelled = false;
    let lastCount: number | null = null;

    const findLastQuestion = (field: HTMLElement): HTMLInputElement | null => {
      const rows = field.querySelectorAll<HTMLElement>('.array-field__row');
      const lastRow = rows[rows.length - 1];
      return lastRow?.querySelector<HTMLInputElement>('input[type="text"]') ?? null;
    };

    const handle = (): void => {
      const field = findField();
      if (!field) return;
      const rows = field.querySelectorAll('.array-field__row');
      const next = rows.length;
      if (lastCount === null) {
        lastCount = next;
        return;
      }
      if (next === lastCount + 1) {
        // Payload moves focus to <main> ~1ms after our first focus
        // call (its own scroll-into-view on row add), so defer the
        // first attempt past that and re-focus at growing intervals
        // to win the race until the input renders and stays focused.
        const delays = [120, 260, 450, 700, 1000, 1400];
        let i = 0;
        const tryAt = (): void => {
          if (cancelled) return;
          const f = findField();
          const input = f ? findLastQuestion(f) : null;
          if (input && document.activeElement !== input) {
            input.focus();
          }
          i += 1;
          const next = delays[i];
          const prev = delays[i - 1];
          if (next !== undefined && prev !== undefined) {
            window.setTimeout(tryAt, next - prev);
          }
        };
        const first = delays[0];
        if (first !== undefined) window.setTimeout(tryAt, first);
      }
      lastCount = next;
    };

    handle();
    const observer = new MutationObserver(handle);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [arrayLeaf]);

  // ─── Portal host: a dedicated <li> child of the array's
  // header-actions UL. Created (or re-located) whenever Payload
  // re-renders the array-field. The Portal then renders our React-
  // managed button into it.
  useEffect(() => {
    const findOrCreateHost = (): HTMLElement | null => {
      const expected = `field-${arrayLeaf}`;
      const fields = document.querySelectorAll<HTMLElement>(
        `#${CSS.escape(expected)}, [id^="${expected}__"]`,
      );
      for (const field of Array.from(fields)) {
        const headerActions = field.querySelector<HTMLUListElement>(
          '.array-field__header-actions',
        );
        if (!headerActions) continue;
        // Reuse an existing host if one survived a re-render.
        let host = headerActions.querySelector<HTMLLIElement>(
          'li[data-cs-clear-all-host]',
        );
        if (!host) {
          host = document.createElement('li');
          host.dataset.csClearAllHost = 'true';
          // Insert before the kebab (last <li>) so order reads:
          //   Collapse All · Show All · Clear all · ⋯
          const lastLi = headerActions.querySelector<HTMLLIElement>(
            ':scope > li:last-child',
          );
          if (lastLi) {
            headerActions.insertBefore(host, lastLi);
          } else {
            headerActions.appendChild(host);
          }
        }
        return host;
      }
      return null;
    };

    const update = (): void => {
      const next = findOrCreateHost();
      setPortalHost((prev) => (prev === next ? prev : next));
    };

    update();
    // Stagger across the moments Payload typically renders the array
    // field (initial mount, intersection observer, hydration commit).
    const t1 = window.setTimeout(update, 100);
    const t2 = window.setTimeout(update, 500);
    const t3 = window.setTimeout(update, 1500);

    const observer = new MutationObserver(() => update());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [arrayLeaf]);

  // ─── Clear-all action handler
  const handleClearAll = useCallback(() => {
    const existing = getDataByPath<unknown[] | null | undefined>(arrayPath);
    const count = Array.isArray(existing) ? existing.length : 0;
    if (count === 0) return;
    if (
      !window.confirm(
        `Clear all ${count} row${count === 1 ? '' : 's'}? This cannot be undone (until you save).`,
      )
    ) {
      return;
    }
    for (let i = count - 1; i >= 0; i -= 1) {
      removeFieldRow({ path: arrayPath, rowIndex: i });
    }
  }, [arrayPath, getDataByPath, removeFieldRow]);

  // Hide entirely when the array is empty — there's nothing to clear.
  if (!portalHost || rowCount === 0) return null;

  return createPortal(
    <button
      type="button"
      data-cs-clear-all="true"
      className="array-field__header-action cs-clear-all-action"
      style={{
        color: 'var(--color-error-500, #ff5c5c)',
        fontWeight: 500,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        font: 'inherit',
      }}
      onClick={handleClearAll}
    >
      Clear all
    </button>,
    portalHost,
  );
};
