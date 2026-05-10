'use client';

import type { ReactElement, ReactNode } from 'react';
import { useId, useRef } from 'react';

import { Dialog, DialogBody, DialogFooter, DialogHeader } from './Dialog';

type Tone = 'neutral' | 'danger';

type Props = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void | Promise<void>;
  readonly title: string;
  readonly description?: ReactNode;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly tone?: Tone;
  readonly busy?: boolean;
};

/**
 * Standard "are you sure?" prompt. Backdrop click is disabled — editors
 * have to commit a choice, which avoids accidental dismiss when the
 * intent is unclear (delete vs. cancel).
 */
export const ConfirmDialog = (props: Props): ReactElement => {
  const {
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    tone = 'neutral',
    busy = false,
  } = props;

  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  const handleConfirm = async (): Promise<void> => {
    await onConfirm();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      size="sm"
      dismissOnBackdrop={false}
    >
      <DialogHeader id={titleId} title={title} onClose={onClose} />
      {description ? (
        <DialogBody>
          <div className="cs-confirm__description">{description}</div>
        </DialogBody>
      ) : null}
      <DialogFooter>
        <button
          ref={cancelRef}
          type="button"
          className="cs-btn cs-btn--subtle"
          onClick={onClose}
          disabled={busy}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className={tone === 'danger' ? 'cs-btn cs-btn--danger' : 'cs-btn cs-btn--primary'}
          onClick={() => {
            void handleConfirm();
          }}
          disabled={busy}
        >
          {confirmLabel}
        </button>
      </DialogFooter>
    </Dialog>
  );
};
