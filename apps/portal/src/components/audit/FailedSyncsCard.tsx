'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ScrollRegion } from '@/components/ui/scroll-region';
import { fmtTimestamp } from '@/lib/dates';
import type { OutboxOp } from '@/lib/domain';
import { requeueFailedSyncAction } from '@/server/actions/audit';
import type { FailedSyncDto } from '@/server/repo/failed-syncs';
import { useToast } from '../ui/toast';

const OP_LABEL: Record<OutboxOp, string> = {
  'partner.upsert': 'Partner details',
  'user.upsert': 'Contact details',
  'registration.create': 'New deal',
  'registration.update_end': 'Protection end date',
  'registration.expire': 'Deal expiry',
};

/** Failed HubSpot sync jobs with a retry for each. Staff with the integrations permission only; the page decides who sees it. */
export function FailedSyncsCard({ rows, today }: { rows: FailedSyncDto[]; today: string }): React.JSX.Element {
  const toast = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const retry = async (id: string): Promise<void> => {
    setBusy(id);
    try {
      const result = await requeueFailedSyncAction({ id });
      if (!result.ok) {
        toast(result.error.message);
        return;
      }
      toast('Sync queued again');
      router.refresh();
    } catch {
      toast('Could not reach the server. Try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section aria-label="Failed syncs" className="card clip">
      <div className="card-h">
        <h2 className="card-t">Failed syncs</h2>
        <span className="card-meta tnum">{rows.length === 100 ? '100 most recent' : rows.length}</span>
      </div>
      {rows.length === 0 ? (
        <div className="empty">No failed syncs.</div>
      ) : (
        <ScrollRegion label="Failed syncs">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Failed</th>
                <th scope="col">Kind</th>
                <th scope="col">Record</th>
                <th scope="col" className="hide-sm">
                  Tries
                </th>
                <th scope="col">Last error</th>
                <th scope="col">
                  <span className="sr">Retry</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="tnum t-sec" style={{ whiteSpace: 'normal' }}>
                    {fmtTimestamp(r.at.toISOString(), today)}
                  </td>
                  <td style={{ whiteSpace: 'normal' }}>{OP_LABEL[r.op]}</td>
                  <td style={{ whiteSpace: 'normal', overflowWrap: 'anywhere' }}>{r.target}</td>
                  <td className="tnum hide-sm">{r.attempts}</td>
                  <td className="t-sec" style={{ whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
                    {r.lastError ?? 'No error recorded'}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-s"
                      onClick={() => retry(r.id)}
                      disabled={busy !== null}
                      aria-label={`Retry sync for ${r.target}`}
                    >
                      {busy === r.id ? 'Retrying' : 'Retry'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
      )}
    </section>
  );
}
