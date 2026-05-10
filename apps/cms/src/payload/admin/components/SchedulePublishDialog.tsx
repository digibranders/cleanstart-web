'use client';

import {
  DateTimePicker,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
} from '@cleanstart/ui';
import { useDocumentInfo } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useEffect, useId, useState } from 'react';

/**
 * Schedule-Publish dialog. Opened via a custom kbd shortcut
 * (Cmd/Ctrl-Shift-S) or from the publish dropdown's "Schedule" item
 * (wired in PublishMenu). Posts a Payload `payload-jobs/run` schedule
 * via the standard payload jobs API:
 *
 *   POST /api/payload-jobs
 *
 * with `{ task: 'schedulePublish', input: { docId, collection, when } }`.
 *
 * If the schedule plugin isn't installed (this CMS doesn't ship it
 * yet), the dialog still surfaces — submission is gated on a
 * server-error toast. This is a UI-shipping wave; the backend job
 * lands in a follow-up.
 */
export const SchedulePublishDialog = (): ReactElement | null => {
  const titleId = useId();
  const { id, collectionSlug } = useDocumentInfo();
  const [open, setOpen] = useState(false);
  const [when, setWhen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [id]);

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
      setOpen(false);
      setWhen(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      labelledBy={titleId}
      size="sm"
      dismissOnBackdrop={false}
    >
      <DialogHeader
        id={titleId}
        title="Schedule publish"
        onClose={() => setOpen(false)}
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
          onClick={() => setOpen(false)}
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
