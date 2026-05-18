'use client';

import { Dialog, DialogBody, DialogFooter, DialogHeader } from '@cleanstart/ui';
import { useDocumentInfo } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { showToast } from './ToastBus';

type Preset = { label: string; seconds: number };

const TTL_PRESETS: ReadonlyArray<Preset> = [
  { label: '1 hour', seconds: 60 * 60 },
  { label: '24 hours', seconds: 24 * 60 * 60 },
  { label: '72 hours', seconds: 72 * 60 * 60 },
  { label: '7 days', seconds: 7 * 24 * 60 * 60 },
  { label: '30 days', seconds: 30 * 24 * 60 * 60 },
];

const DEFAULT_TTL_SECONDS = 24 * 60 * 60;

/**
 * Doc-header button — opens a small dialog with a TTL picker and an
 * optional label, mints a preview-share JWT via the CMS endpoint,
 * copies the resulting URL to the clipboard, and confirms via toast.
 *
 * Mounted via `wirePreviewControls` on every draft-enabled
 * collection. Hidden when the doc has no id yet (unsaved new doc) —
 * the URL needs a docId to point at.
 */
export const CopyPreviewLink = (): ReactElement | null => {
  const { id, collectionSlug } = useDocumentInfo();
  const [open, setOpen] = useState(false);
  const [ttl, setTtl] = useState<number>(DEFAULT_TTL_SECONDS);
  const [label, setLabel] = useState<string>('');
  const [busy, setBusy] = useState(false);

  if (!collectionSlug || id == null) return null;

  const mint = async (): Promise<void> => {
    setBusy(true);
    try {
      const res = await fetch('/api/preview/token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          collection: collectionSlug,
          docId: String(id),
          ttlSeconds: ttl,
          ...(label.trim().length > 0 ? { label: label.trim() } : {}),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        showToast({
          message: `Could not mint preview link${body.error ? `: ${body.error}` : ''}`,
          type: 'error',
        });
        return;
      }
      const data = (await res.json()) as { url: string; expiresAt: string };
      try {
        await navigator.clipboard.writeText(data.url);
        showToast({
          message: `Preview link copied — expires ${new Date(data.expiresAt).toLocaleString()}`,
          type: 'success',
        });
      } catch {
        showToast({
          message: `Preview link minted: ${data.url}`,
          type: 'info',
        });
      }
      setOpen(false);
      setLabel('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="btn btn--style-secondary btn--size-small"
        onClick={() => setOpen(true)}
        title="Mint a shareable preview link for this draft"
      >
        Copy preview link
      </button>
      {open ? (
        <Dialog open={open} onClose={() => (busy ? undefined : setOpen(false))}>
          <DialogHeader title="Copy preview link" onClose={() => (busy ? undefined : setOpen(false))} />
          <DialogBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Expires after</span>
                <select
                  value={ttl}
                  onChange={(e) => setTtl(Number(e.target.value))}
                  disabled={busy}
                  style={{ padding: '0.4rem', borderRadius: 4 }}
                >
                  {TTL_PRESETS.map((p) => (
                    <option key={p.seconds} value={p.seconds}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                  Label <span style={{ opacity: 0.6 }}>(optional)</span>
                </span>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Legal review – Q2 launch"
                  maxLength={120}
                  disabled={busy}
                  style={{ padding: '0.4rem', borderRadius: 4 }}
                />
              </label>
              <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: 0 }}>
                The link lets anyone view this draft until it expires. Revoke any time at
                {' '}
                <code>/admin/collections/previewAudit</code>.
              </p>
            </div>
          </DialogBody>
          <DialogFooter>
            <button
              type="button"
              className="btn btn--style-secondary btn--size-small"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--style-primary btn--size-small"
              onClick={() => {
                void mint();
              }}
              disabled={busy}
            >
              {busy ? 'Minting…' : 'Mint & copy'}
            </button>
          </DialogFooter>
        </Dialog>
      ) : null}
    </>
  );
};

export default CopyPreviewLink;
