'use client';

import { Dialog, DialogBody, DialogFooter, DialogHeader } from '@cleanstart/ui';
import { useDocumentInfo } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

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

type ShareLinkDialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
};

/**
 * Controlled "mint shareable preview link" dialog. The standalone
 * trigger button was retired when the three preview affordances
 * collapsed into the PreviewMenu split-button — this dialog is now
 * opened from the menu's "Copy shareable link…" item.
 *
 * Mints a preview-share JWT via `/api/preview/token`, copies the
 * resulting URL to the clipboard, and confirms via toast. Returns null
 * when there is no saved doc (the URL needs a docId to point at).
 */
export const ShareLinkDialog = ({ open, onClose }: ShareLinkDialogProps): ReactElement | null => {
  const { id, collectionSlug } = useDocumentInfo();
  const [ttl, setTtl] = useState<number>(DEFAULT_TTL_SECONDS);
  const [label, setLabel] = useState<string>('');
  const [busy, setBusy] = useState(false);

  // Reset label when the dialog closes so a subsequent open starts clean,
  // regardless of whether the previous mint succeeded or failed.
  useEffect(() => {
    if (!open) setLabel('');
  }, [open]);

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
      onClose();
      setLabel('');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={() => (busy ? undefined : onClose())}>
      <DialogHeader
        title="Copy preview link"
        onClose={() => (busy ? undefined : onClose())}
        description="Mint a shareable preview link with an expiry. Revoke any time from the Preview Audit collection."
      />
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
        </div>
      </DialogBody>
      <DialogFooter>
        <button
          type="button"
          className="cs-btn cs-btn--subtle"
          onClick={() => onClose()}
          disabled={busy}
        >
          Cancel
        </button>
        <button
          type="button"
          className="cs-btn cs-btn--primary"
          onClick={() => {
            void mint();
          }}
          disabled={busy}
        >
          {busy ? 'Minting…' : 'Mint & copy'}
        </button>
      </DialogFooter>
    </Dialog>
  );
};

export default ShareLinkDialog;
