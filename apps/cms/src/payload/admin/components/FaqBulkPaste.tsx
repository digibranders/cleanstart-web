'use client';

import { useField, useForm } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { parseFaqBulk } from '../../lib/faq-bulk-parse';

type FaqBulkPasteProps = {
  path: string;
  schemaPath?: string;
  /**
   * Name of the sibling array field whose rows should receive the
   * parsed Q&A pairs. Defaults to `items` (matches the FAQ block).
   * Pass `'faqs'` for the inline `faqs` arrays on Blogs / Guides.
   */
  targetField?: string;
};

const replaceLastSegment = (input: string, replacement: string): string => {
  const idx = input.lastIndexOf('.');
  return idx === -1 ? replacement : `${input.slice(0, idx)}.${replacement}`;
};

const escapeRegExp = (input: string): string =>
  input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildSubFieldState = (
  question: string,
  answerParagraphs: string[],
): Record<string, { initialValue: unknown; value: unknown; valid: true }> => {
  const answerText = answerParagraphs.join('\n\n');
  return {
    question: { initialValue: question, value: question, valid: true },
    answer: { initialValue: answerText, value: answerText, valid: true },
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
  const { path, schemaPath, targetField = 'items' } = props;
  const { addFieldRow, replaceFieldRow, removeFieldRow, getDataByPath } = useForm();
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

      replaceFieldRow({
        path: arrayPath,
        schemaPath: arraySchemaPath,
        rowIndex: startIndex,
        subFieldState: buildSubFieldState(firstPair.question, firstPair.answerParagraphs),
      });

      restPairs.forEach((pair, i) => {
        addFieldRow({
          path: arrayPath,
          schemaPath: arraySchemaPath,
          rowIndex: startIndex + 1 + i,
          subFieldState: buildSubFieldState(pair.question, pair.answerParagraphs),
        });
      });
    },
    [addFieldRow, arrayPath, arraySchemaPath, inputNamePattern, replaceFieldRow],
  );

  useEffect(() => {
    document.addEventListener('paste', handlePaste, true);
    return () => {
      document.removeEventListener('paste', handlePaste, true);
    };
  }, [handlePaste]);

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
