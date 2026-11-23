'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { fmtTimestamp, plural } from '@/lib/dates';
import type { IntegrationHealthDto } from '@/lib/dto';
import { retryFailedOutboxAction } from '@/server/actions/audit';
import { useToast } from '../ui/toast';

/** CRM sync health for the partner manager: what is queued, what failed, when HubSpot was last read. */
export function IntegrationHealthCard({
  health,
  today,
  name = 'HubSpot',
}: {
  health: IntegrationHealthDto;
  today: string;
  /** What the sync is called on screen; the Overview says "CRM" so it stays neutral about the system behind it. */
  name?: string;
}): React.JSX.Element {
  const toast = useToast();
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  const retry = async (): Promise<void> => {
    setRetrying(true);
    try {
      const result = await retryFailedOutboxAction({});
      if (!result.ok) {
        toast(result.error.message);
        return;
      }
      toast(`${plural(result.data.retried, 'failed sync')} queued again`);
      router.refresh();
    } catch {
      toast('Could not reach the server. Try again.');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <section aria-label={`${name} sync`} className="card kpis">
      <div className="kpi">
        <span className="kpi-l">Sync queue</span>
        <span className="kpi-v">{health.pending}</span>
        {health.failed > 0 ? (
          <span className="kpi-f">
            <span className="t-amber">{health.failed} failed</span>
            {', '}
            <button type="button" className="linkbtn" onClick={retry} disabled={retrying} aria-label="Retry failed syncs">
              {retrying ? 'Retrying' : 'Retry'}
            </button>
          </span>
        ) : (
          <span className="kpi-f">Waiting to send, none failed</span>
        )}
      </div>
      <div className="kpi">
        <span className="kpi-l">Last {name} check</span>
        <span className="kpi-v" style={{ fontSize: 14 }}>
          {health.lastPollAt ? fmtTimestamp(health.lastPollAt.toISOString(), today) : 'Never'}
        </span>
        <span className="kpi-f">{health.lastPollAt ? 'Checked every 5 minutes' : 'No check has run yet'}</span>
      </div>
      <div className="kpi">
        <span className="kpi-l">Last error</span>
        <span className="kpi-v" style={{ fontSize: 13, fontWeight: 600, overflowWrap: 'anywhere' }}>
          {health.lastError ?? 'None'}
        </span>
        <span className="kpi-f">{health.lastError ? 'Most recent sync problem' : 'No problems recorded'}</span>
      </div>
    </section>
  );
}
