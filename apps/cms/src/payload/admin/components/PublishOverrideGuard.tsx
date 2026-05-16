'use client';

import { ConfirmDialog } from '@cleanstart/ui';
import { useAllFormFields } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

const TITLE_MIN = 30;
const TITLE_MAX = 60;
const DESC_MIN = 120;
const DESC_MAX = 160;

const PUBLISH_BUTTON_ID = 'action-save';

type OutOfRangeItem = {
  label: string;
  currentLen: number;
  recommended: string;
};

const stringValue = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  return '';
};

/**
 * Intercepts clicks on the document Publish button (`#action-save`) and
 * shows a confirm dialog when the SEO title or meta description falls
 * outside the recommended length range. The editor can either cancel
 * or override and publish anyway.
 *
 * Mounted via `admin.components.beforeDocumentControls` for every
 * collection in the gated set (see `wire-publish-gate.ts`).
 *
 * Implementation notes:
 *  - The capture-phase listener is attached on `document` so it fires
 *    before Payload's own submit handler runs.
 *  - Once the editor confirms, an "armed" ref skips the next interception
 *    and the click is re-fired on the same button.
 *  - This guard only nags; the underlying publish-gate hook on the server
 *    treats char length as a warning, not a blocker, so there is no
 *    persistence-side enforcement to circumvent.
 */
export const PublishOverrideGuard = (): ReactElement | null => {
  const [fields] = useAllFormFields();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<OutOfRangeItem[]>([]);
  const armedRef = useRef(false);

  const computeOutOfRange = useCallback((): OutOfRangeItem[] => {
    const seoTitleRaw = fields?.['seo.title']?.value;
    const docTitleRaw = fields?.title?.value ?? fields?.name?.value;
    const seoDescRaw = fields?.['seo.description']?.value;
    const abstractRaw = fields?.abstract?.value;

    const effectiveTitle =
      stringValue(seoTitleRaw).trim() || stringValue(docTitleRaw).trim();
    const effectiveDesc =
      stringValue(seoDescRaw).trim() || stringValue(abstractRaw).trim();

    const out: OutOfRangeItem[] = [];
    if (effectiveTitle.length < TITLE_MIN || effectiveTitle.length > TITLE_MAX) {
      out.push({
        label: 'SEO title',
        currentLen: effectiveTitle.length,
        recommended: `${TITLE_MIN}–${TITLE_MAX} chars`,
      });
    }
    if (effectiveDesc.length < DESC_MIN || effectiveDesc.length > DESC_MAX) {
      out.push({
        label: 'Meta description',
        currentLen: effectiveDesc.length,
        recommended: `${DESC_MIN}–${DESC_MAX} chars`,
      });
    }
    return out;
  }, [fields]);

  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const btn = target.closest(`#${PUBLISH_BUTTON_ID}`);
      if (!btn) return;

      if (armedRef.current) {
        // The editor confirmed the override on a prior intercept; let
        // this click pass through and re-arm for next time.
        armedRef.current = false;
        return;
      }

      const out = computeOutOfRange();
      if (out.length === 0) return;

      e.preventDefault();
      e.stopPropagation();
      setItems(out);
      setOpen(true);
    };

    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [computeOutOfRange]);

  const handleConfirm = useCallback((): void => {
    armedRef.current = true;
    setOpen(false);
    // Defer the re-click so React commits state changes (dialog close)
    // before Payload's submit handler fires.
    requestAnimationFrame(() => {
      const btn = document.getElementById(PUBLISH_BUTTON_ID);
      if (btn instanceof HTMLButtonElement) {
        btn.click();
      } else {
        // Click guard cleared but button missing — fail safe by
        // resetting the armed flag so the next attempt is intercepted.
        armedRef.current = false;
      }
    });
  }, []);

  const handleClose = useCallback((): void => {
    setOpen(false);
  }, []);

  return (
    <ConfirmDialog
      open={open}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title="SEO recommendations not met"
      description={
        <>
          <p style={{ margin: '0 0 12px 0' }}>
            The following fields are outside the recommended range. You can
            still publish — Google may truncate or pad these in search
            results.
          </p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {items.map((item) => (
              <li key={item.label} style={{ marginBottom: 4 }}>
                <strong>{item.label}</strong>: {item.currentLen} chars
                (recommended {item.recommended})
              </li>
            ))}
          </ul>
        </>
      }
      confirmLabel="Publish anyway"
      cancelLabel="Cancel"
    />
  );
};

export default PublishOverrideGuard;
