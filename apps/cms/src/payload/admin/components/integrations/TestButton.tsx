'use client';

import { useDocumentInfo, useConfig } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useCallback, useState } from 'react';

interface TestResponse {
  ok: boolean;
  status: number;
  latencyMs?: number;
  error?: string;
  event?: string;
}

interface ResultState {
  status: 'idle' | 'running' | 'ok' | 'fail';
  message?: string;
}

/**
 * Per-row "Test" button for the Integrations edit drawer. Fires a
 * fixture event to the configured destination via the
 * /api/integrations/:id/test endpoint and renders the resulting HTTP
 * status + latency inline.
 *
 * Disabled until the row has been saved (no id yet = nothing to test).
 */
export const TestButton = (): ReactElement => {
  const { id } = useDocumentInfo();
  const { config } = useConfig();
  const serverURL = config?.serverURL ?? '';

  const [state, setState] = useState<ResultState>({ status: 'idle' });

  const handleClick = useCallback(async () => {
    if (!id) return;
    setState({ status: 'running' });
    try {
      const res = await fetch(`${serverURL}/api/integrations/${id}/test`, {
        method: 'POST',
        credentials: 'include',
      });
      const body = (await res.json()) as TestResponse;
      if (body.ok) {
        setState({
          status: 'ok',
          message: `HTTP ${body.status} · ${body.latencyMs ?? '?'}ms · event ${body.event ?? '?'}`,
        });
      } else {
        setState({
          status: 'fail',
          message: `HTTP ${body.status || '—'} · ${body.error ?? 'unknown error'}`,
        });
      }
    } catch (err) {
      setState({
        status: 'fail',
        message: err instanceof Error ? err.message : 'Network error',
      });
    }
  }, [id, serverURL]);

  if (!id) {
    return (
      <div className="cs-integrations-test cs-integrations-test--disabled">
        Save the row first to enable the Test button.
      </div>
    );
  }

  return (
    <div className="cs-integrations-test">
      <button
        type="button"
        className="cs-btn cs-btn--subtle"
        disabled={state.status === 'running'}
        onClick={handleClick}
      >
        {state.status === 'running' ? 'Sending…' : 'Send test event'}
      </button>
      {state.message ? (
        <output
          className={`cs-integrations-test__result cs-integrations-test__result--${state.status}`}
        >
          {state.message}
        </output>
      ) : null}
    </div>
  );
};

export default TestButton;
