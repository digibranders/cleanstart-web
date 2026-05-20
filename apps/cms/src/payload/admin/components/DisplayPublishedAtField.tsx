'use client';

import { DateTimePicker } from '@cleanstart/ui';
import { useDocumentInfo, useField, useFormFields } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useCallback, useId, useMemo, useState } from 'react';

import {
  PICKER_HARD_WARN_DAYS,
  resolveDisplayPublishedAtState,
} from './display-published-at-state';
import { SchedulePublishDialog } from './SchedulePublishDialog';

type DisplayPublishedAtFieldProps = {
  path?: string;
  label?: string;
};

export const DisplayPublishedAtField = (
  props: DisplayPublishedAtFieldProps,
): ReactElement => {
  const path = props.path ?? 'displayPublishedAt';
  const inputId = useId();
  const { value, setValue } = useField<string | null>({ path });

  // Read the draft/published status from the form so we can branch on
  // future-date semantics. `_status` is always present in Payload's
  // form-fields tree for collections with versions enabled.
  const status = useFormFields(([fields]) => {
    const f = fields?._status as { value?: unknown } | undefined;
    return typeof f?.value === 'string' ? f.value : null;
  });

  // `SchedulePublishDialog` requires a saved doc (the schedulePublish
  // job needs the doc id). On the create screen we surface a save-first
  // hint instead of an inert button.
  const { id: docId } = useDocumentInfo();
  const canSchedule = docId != null;

  const [scheduleOpen, setScheduleOpen] = useState(false);

  const state = useMemo(
    () => resolveDisplayPublishedAtState(value ?? null, status),
    [value, status],
  );

  const handleChange = useCallback(
    (next: string | null) => {
      setValue(next);
    },
    [setValue],
  );

  const handleOpenSchedule = useCallback(() => setScheduleOpen(true), []);
  const handleCloseSchedule = useCallback(() => setScheduleOpen(false), []);

  return (
    <div className="cs-display-pub field-type date">
      <div className="cs-display-pub__label">
        <span className="cs-display-pub__label-text">
          <label htmlFor={inputId}>{props.label ?? 'Publish date'}</label>
        </span>
        {state.kind === 'near-now' && (
          <output
            aria-live="polite"
            className="cs-display-pub__chip"
            data-tone="ok"
            title="Within ±24h of now — Google will read this as the publish moment."
          >
            Publishing now
          </output>
        )}
        {state.kind === 'backdate-soft' && (
          <output
            aria-live="polite"
            className="cs-display-pub__chip"
            data-tone="warn"
          >
            Backdated {state.days}d
          </output>
        )}
        {state.kind === 'backdate-hard' && (
          <output
            aria-live="polite"
            className="cs-display-pub__chip"
            data-tone="danger"
          >
            Backdated {state.days}d
          </output>
        )}
        {(state.kind === 'future-draft' || state.kind === 'future-published') && (
          <output
            aria-live="polite"
            className="cs-display-pub__chip"
            data-tone="info"
          >
            Future date
          </output>
        )}
      </div>

      <div id={inputId}>
        <DateTimePicker
          value={value ?? null}
          onChange={handleChange}
          mode="datetime"
          placeholder="Defaults to publish time"
          ariaLabel="Display publish date"
        />
      </div>

      {state.kind === 'empty' && (
        <p className="cs-display-pub__hint">
          Leave empty to use the actual publish time. Set a value to override what
          Google sees as the original publish date.
        </p>
      )}

      {state.kind === 'backdate-soft' && (
        <p className="cs-display-pub__hint cs-display-pub__hint--warn">
          Backdated by {state.days} day{state.days === 1 ? '' : 's'}. Google will read this
          as the original publish date.
        </p>
      )}

      {state.kind === 'backdate-hard' && (
        <output className="cs-display-pub__warning" aria-live="polite">
          <span aria-hidden="true">!</span>
          Backdating beyond {PICKER_HARD_WARN_DAYS} days can trigger Google&apos;s date-manipulation
          spam policy. Only use this for genuinely older content.
        </output>
      )}

      {state.kind === 'future-draft' && (
        <div className="cs-display-pub__future" aria-live="polite">
          <p>
            This date is in the future. Saving now will publish immediately with a
            misleading future date in metadata.
          </p>
          <p>
            To publish at this time instead, use Schedule Publish — the queue will
            promote the draft when the moment arrives.
          </p>
          {canSchedule ? (
            <button
              type="button"
              className="cs-btn cs-btn--primary"
              onClick={handleOpenSchedule}
            >
              Schedule publish…
            </button>
          ) : (
            <p className="cs-display-pub__future-hint">
              Save the draft first to enable scheduling.
            </p>
          )}
        </div>
      )}

      {state.kind === 'future-published' && (
        <output className="cs-display-pub__warning" aria-live="polite">
          <span aria-hidden="true">!</span>
          Setting a future date on an already-published doc is unusual. The page stays
          live now, but JSON-LD and bylines will show the future date.
        </output>
      )}

      <SchedulePublishDialog open={scheduleOpen} onClose={handleCloseSchedule} />
    </div>
  );
};

export default DisplayPublishedAtField;
