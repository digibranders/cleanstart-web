import type { AdminViewServerProps } from 'payload';
import type { ReactElement } from 'react';

import { AnalyticsClient } from './AnalyticsClient';

export const AnalyticsView = (_props: AdminViewServerProps): ReactElement => (
  <div className="cs-dashboard">
    <AnalyticsClient />
  </div>
);

export default AnalyticsView;
