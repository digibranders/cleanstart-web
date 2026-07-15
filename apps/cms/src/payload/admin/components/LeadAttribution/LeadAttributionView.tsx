import { DefaultTemplate } from '@payloadcms/next/templates';
import type { AdminViewServerProps } from 'payload';
import type { ReactElement } from 'react';

import { LeadAttributionClient } from './LeadAttributionClient';

/**
 * Server shell for the marketing Lead-Attribution report. A non-override
 * custom view renders without chrome, so it wraps the client in
 * DefaultTemplate to inherit the admin sidebar + header (mirrors
 * ContentInsightsView / AnalyticsView).
 */
export const LeadAttributionView = ({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps): ReactElement => {
  const { req, permissions, visibleEntities, locale } = initPageResult;
  if (!req.user) return <div className="cs-dashboard" />;
  return (
    <DefaultTemplate
      i18n={req.i18n}
      {...(locale ? { locale } : {})}
      {...(params ? { params } : {})}
      payload={req.payload}
      permissions={permissions}
      {...(searchParams ? { searchParams } : {})}
      user={req.user}
      visibleEntities={visibleEntities}
    >
      <div className="cs-dashboard">
        <LeadAttributionClient />
      </div>
    </DefaultTemplate>
  );
};

export default LeadAttributionView;
