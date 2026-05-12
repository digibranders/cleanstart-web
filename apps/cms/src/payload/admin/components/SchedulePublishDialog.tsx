'use client';

import {
  DateTimePicker,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
} from '@cleanstart/ui';
import { useDocumentInfo } from '@payloadcms/ui';

import { showToast } from './ToastBus';
import type { ReactElement } from 'react';
import { useEffect, useId, useState } from 'react';

type SchedulePublishDialogProps = {
  /**
   * Controlled open state. When provided, the component becomes
   * controlled and the keyboard shortcut is disabled. When omitted
   * the component manages its own state and opens on Cmd/Ctrl-Shift-S.
   */
  open?: boolean;
  /** Called when the dialog requests to close (controlled mode only). */
  onClose?: () => void;
};

/**
 * Schedule-Publish dialog. Two entry points:
 *
 * 1. Keyboard shortcut (Cmd/Ctrl-Shift-S) — self-managed open state,
 *    registered as a global admin action component in payload.config.ts.
 * 2. Controlled mode — pass `open` + `onClose` to embed inside another
 *    surface (e.g. PublishMenu dropdown).
 *
 * Posts a Payload schedulePublish job:
 *   POST /api/payload-jobs
 *   { task: 'schedulePublish', input: { collection, id, when } }
 */
export const SchedulePublishDialog = ({
  open: openProp,
  onClose,
}: SchedulePublishDialogProps = {}): ReactElement | null => {
  const controlled = openProp !== undefined;
  const titleId = useId();
  const { id, collectionSlug } = useDocumentInfo();
  const [openInternal, setOpenInternal] = useState(false);
  const [when, setWhen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = controlled ? (openProp ?? false) : openInternal;
  const handleClose = (): void => {
    if (controlled) onClose?.();
    else setOpenInternal(false);
  };

  useEffect(() => {
    if (controlled) return;
    const onKey = (e: KeyboardEvent): void => {
      // Open on Cmd/Ctrl-Shift-S (matching SaveShortcut's modifier
      // family). Only fires when an entity is loaded.
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        (e.key === 'S' || e.key === 's') &&
        id != null
      ) {
        e.preventDefault();
        setOpenInternal(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [id, controlled]);

  if (id == null || !collectionSlug) return null;

  const onSubmit = async (): Promise<void> => {
    if (!when) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/payload-jobs', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          task: 'schedulePublish',
          input: { collection: collectionSlug, id, when },
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text || `HTTP ${res.status}`);
        return;
      }
      handleClose();
      setWhen(null);
      showToast({ message: 'Publish scheduled.', type: 'success' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      labelledBy={titleId}
      size="sm"
      dismissOnBackdrop={false}
    >
      <DialogHeader
        id={titleId}
        title="Schedule publish"
        onClose={handleClose}
        description="Pick a date + time. The doc will publish automatically when the queue picks the job up."
      />
      <DialogBody>
        <DateTimePicker value={when} onChange={setWhen} mode="datetime" />
        {error ? (
          <output className="cs-schedule-error">{error}</output>
        ) : null}
      </DialogBody>
      <DialogFooter>
        <button
          type="button"
          className="cs-btn cs-btn--subtle"
          onClick={handleClose}
          disabled={busy}
        >
          Cancel
        </button>
        <button
          type="button"
          className="cs-btn cs-btn--primary"
          onClick={() => void onSubmit()}
          disabled={busy || !when}
        >
          {busy ? 'Scheduling…' : 'Schedule'}
        </button>
      </DialogFooter>
    </Dialog>
  );
};

export default SchedulePublishDialog;
