'use client';

import { useDocumentInfo, useAuth, useConfig } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useState, useCallback } from 'react';

import { ConfirmDialog } from '@cleanstart/ui';

/**
 * Admin action that disables a user account (sets enabled=false).
 * Mounted via editMenuItems on the Users edit view.
 *
 * Guards:
 * - Hidden when the user being viewed is the currently logged-in admin
 *   (you cannot lock yourself out).
 * - Hidden when the account is already disabled.
 */
export const DisableUserAction = (): ReactElement | null => {
  const { id, data } = useDocumentInfo();
  const { user } = useAuth();
  const { config } = useConfig();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const isSelf = user && id != null && String(user.id) === String(id);
  const alreadyDisabled = (data as { enabled?: boolean } | null)?.enabled === false;

  const handleConfirm = useCallback(async () => {
    if (id == null) return;
    setBusy(true);
    try {
      const serverURL = config?.serverURL ?? '';
      const res = await fetch(`${serverURL}/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled: false }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { errors?: { message: string }[] };
        const msg = body.errors?.[0]?.message ?? `HTTP ${res.status}`;
        alert(`Failed to disable account: ${msg}`);
        return;
      }
      setOpen(false);
      // Reload the document to reflect the updated enabled state.
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setBusy(false);
    }
  }, [id, config]);

  if (isSelf || alreadyDisabled) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ color: 'var(--theme-error-500, #ef4444)' }}
      >
        Disable account
      </button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Disable account"
        description="This user will no longer be able to log in. Their content is preserved. You can re-enable the account by editing the Enabled field directly."
        confirmLabel={busy ? 'Disabling…' : 'Disable account'}
        onConfirm={handleConfirm}
        busy={busy}
        tone="danger"
      />
    </>
  );
};

export default DisableUserAction;
