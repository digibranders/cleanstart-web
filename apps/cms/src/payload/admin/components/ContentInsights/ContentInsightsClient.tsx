'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactElement } from 'react';

import type { ContentInsightsResponse } from '../../../lib/content-insights/types';
import { RefreshButton } from '../Analytics/RefreshButton';
import { AttributionPanel } from './AttributionPanel';
import { Cannibalization } from './Cannibalization';
import { DecayQueue } from './DecayQueue';
import { LowCtr } from './LowCtr';
import { StrikingDistance } from './StrikingDistance';
import { IndexationRollup } from './IndexationRollup';
import { Leaderboards } from './Leaderboards';
import { OrphanAudit } from './OrphanAudit';
import { VelocityPanel } from './VelocityPanel';

export function ContentInsightsClient(): ReactElement {
  const [data, setData] = useState<ContentInsightsResponse | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'unconfigured' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (force: boolean): Promise<void> => {
    setState('loading');
    try {
      const res = await fetch(`/api/content-insights${force ? '?refresh=1' : ''}`, { credentials: 'include' });
      const j = (await res.json()) as ContentInsightsResponse;
      if (!j.ok) return setState('error');
      if (!j.configured) return setState('unconfigured');
      setData(j);
      setState('ready');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  const handleRefresh = useCallback((): void => {
    setRefreshing(true);
    void load(true).finally(() => setRefreshing(false));
  }, [load]);

  return (
    <div className="cs-analytics cs-content-insights">
      <header className="cs-analytics__head">
        <h1>Content insights</h1>
        <RefreshButton onClick={handleRefresh} busy={refreshing} updatedAt={data?.capturedAt ?? null} />
      </header>
      {state === 'loading' && (
        <div className="cs-analytics__empty">
          Building the content snapshot… this can take a few seconds on the first load.
        </div>
      )}
      {state === 'unconfigured' && (
        <div className="cs-analytics__empty">Connect GA4 and GSC to populate content insights.</div>
      )}
      {state === 'error' && (
        <div className="cs-analytics__empty">Couldn’t load content insights. Try again shortly.</div>
      )}
      {state === 'ready' && data?.sections && (
        <div className="cs-content-insights__sections">
          <DecayQueue rows={data.sections.decay} />
          <Leaderboards data={data.sections.leaderboards} />
          <OrphanAudit rows={data.sections.orphans} />
          <IndexationRollup rows={data.sections.indexation} />
          <VelocityPanel buckets={data.sections.velocity} />
          <AttributionPanel rows={data.sections.attribution} configured={data.keyEventsConfigured} />

          <h2 className="cs-content-insights__group-head">SEO opportunities</h2>
          <StrikingDistance rows={data.sections.strikingDistance} />
          <LowCtr rows={data.sections.lowCtr} />
          <Cannibalization rows={data.sections.cannibalization} />
        </div>
      )}
    </div>
  );
}

export default ContentInsightsClient;
