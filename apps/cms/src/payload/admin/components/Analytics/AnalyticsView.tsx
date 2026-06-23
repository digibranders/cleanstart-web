import { DefaultTemplate } from '@payloadcms/next/templates';
import type { AdminViewServerProps } from 'payload';
import type { ReactElement } from 'react';

import { AnalyticsClient } from './AnalyticsClient';

/**
 * Custom `views.analytics` route (`/admin/analytics`). A NEW custom view
 * (not overriding a built-in key) gets `templateType: undefined` from
 * Payload's RootPage, which renders it with NO chrome — so we wrap the
 * content in `DefaultTemplate` ourselves to get the full admin layout
 * (sidebar nav + header), mirroring Payload's own NotFound view.
 */
export const AnalyticsView = ({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps): ReactElement => {
  const { req, permissions, visibleEntities, locale } = initPageResult;
  // Payload already gates /admin behind auth (unauthenticated users are
  // redirected to login before this renders); this guard narrows `req.user`
  // to non-null for DefaultTemplate's `user` prop.
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
        <AnalyticsClient />
      </div>
    </DefaultTemplate>
  );
};

export default AnalyticsView;
