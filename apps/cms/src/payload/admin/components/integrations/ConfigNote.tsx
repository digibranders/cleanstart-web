'use client';

import type { ReactElement } from 'react';

/**
 * Inline note for kinds that have no per-row config (e.g. Clarity).
 * The credential lives in env; the row is the on/off switch.
 */

const Note = ({
  title,
  body,
  envVars,
}: {
  title: string;
  body: string;
  envVars: ReadonlyArray<string>;
}): ReactElement => (
  <div className="cs-integration-note">
    <strong className="cs-integration-note__title">{title}</strong>
    <p className="cs-integration-note__body">{body}</p>
    <ul className="cs-integration-note__envs">
      {envVars.map((name) => (
        <li key={name}>
          <code>{name}</code>
        </li>
      ))}
    </ul>
  </div>
);

export const ClarityConfigNote = (): ReactElement => (
  <Note
    title="No per-row settings needed."
    body="MS Clarity reads from the env-configured API token. Save this row with Enabled = on to let the daily cron refresh the cache."
    envVars={['CLARITY_API_TOKEN']}
  />
);
