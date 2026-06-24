import { DefaultTemplate } from '@payloadcms/next/templates';
import type { AdminViewServerProps } from 'payload';
import type { ReactElement } from 'react';

import { ContentInsightsClient } from './ContentInsightsClient';

/**
 * Custom `views.contentInsights` route (`/admin/content-insights`). Like the
 * analytics view, a NEW custom view gets `templateType: undefined` from
 * Payload's RootPage (no chrome), so we wrap the content in `DefaultTemplate`
 * to get the full admin layout (sidebar nav + header).
 */
export const ContentInsightsView = ({
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
        <ContentInsightsClient />
      </div>
    </DefaultTemplate>
  );
};

export default ContentInsightsView;
