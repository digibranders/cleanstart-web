import { DefaultTemplate } from '@payloadcms/next/templates';
import type { AdminViewServerProps } from 'payload';
import type { ReactElement } from 'react';

import { EventRegistrationsClient } from './EventRegistrationsClient';

/**
 * Server shell for the Event Registrations page. A non-override custom view
 * renders without chrome, so it wraps the client in DefaultTemplate to inherit
 * the admin sidebar and header (mirrors LeadAttributionView).
 */
export const EventRegistrationsView = ({
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
        <EventRegistrationsClient />
      </div>
    </DefaultTemplate>
  );
};

export default EventRegistrationsView;
