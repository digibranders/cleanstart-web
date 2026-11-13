'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { fmtTimestamp, plural } from '@/lib/dates';
import type { IntegrationHealthDto } from '@/lib/dto';
import { retryFailedOutboxAction } from '@/server/actions/audit';
import { useToast } from '../ui/toast';

/** HubSpot sync health for the partner manager: what is queued, what failed, when HubSpot was last read. */
export function IntegrationHealthCard({
  health,
  today,
}: {
  health: IntegrationHealthDto;
  today: string;
}): React.JSX.Element {
  const toast = useToast();
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  const retry = async (): Promise<void> => {
    setRetrying(true);
    const result = await retryFailedOutboxAction({});
    setRetrying(false);
    if (!result.ok) {
      toast(result.error.message);
      return;
    }
    toast(`${plural(result.data.retried, 'failed sync')} queued again`);
    router.refresh();
  };

  return (
    <section aria-label="HubSpot sync" className="card kpis">
      <div className="kpi">
        <span className="kpi-l">Waiting to send</span>
        <span className="kpi-v">{health.pending}</span>
        <span className="kpi-f">Changes queued for HubSpot</span>
      </div>
      <div className="kpi">
        <span className="kpi-l">Failed</span>
        <span className={`kpi-v${health.failed > 0 ? ' t-amber' : ''}`}>{health.failed}</span>
        {health.failed > 0 ? (
          <button type="button" className="linkbtn" onClick={retry} disabled={retrying} style={{ alignSelf: 'flex-start' }}>
            {retrying ? 'Retrying' : 'Retry failed syncs'}
          </button>
        ) : (
          <span className="kpi-f">Nothing stuck</span>
        )}
      </div>
      <div className="kpi">
        <span className="kpi-l">Last HubSpot check</span>
        <span className="kpi-v" style={{ fontSize: 14 }}>
          {health.lastPollAt ? fmtTimestamp(health.lastPollAt.toISOString(), today) : 'Never'}
        </span>
        <span className="kpi-f">Checked every 5 minutes</span>
      </div>
      <div className="kpi">
        <span className="kpi-l">Last error</span>
        <span className="kpi-v" style={{ fontSize: 13, fontWeight: 600, overflowWrap: 'anywhere' }}>
          {health.lastError ?? 'None'}
        </span>
      </div>
    </section>
  );
}
