import { shapeRealtime } from '../../dashboards/advanced-metrics';
import type { RealtimePayload } from '../../dashboards/overview-types';
import type { Ga4Credentials } from '../credentials';
import { buildClient } from './ga4-data-api';

/** Active users in the last 30 minutes: a total + a per-page breakdown. */
export const fetchRealtime = async (creds: Ga4Credentials): Promise<RealtimePayload> => {
  const client = buildClient(creds);
  const property = `properties/${creds.propertyId}`;
  const [totalResp, pageResp] = await Promise.all([
    client.runRealtimeReport({ property, metrics: [{ name: 'activeUsers' }] }),
    client.runRealtimeReport({
      property,
      dimensions: [{ name: 'unifiedScreenName' }],
      metrics: [{ name: 'activeUsers' }],
      limit: 8,
    }),
  ]);
  return shapeRealtime(totalResp[0] ?? {}, pageResp[0] ?? {});
};
