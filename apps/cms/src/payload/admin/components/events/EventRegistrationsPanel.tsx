'use client';

import { useDocumentInfo } from '@payloadcms/ui';
import Link from 'next/link';
import type { ReactElement } from 'react';

/**
 * The editor only links to the registrations: the list itself needs the full
 * page width, so it lives at /admin/event-registrations.
 */
export const EventRegistrationsPanel = (): ReactElement => {
  const { id } = useDocumentInfo();
  if (!id) {
    return <p style={{ color: 'var(--theme-elevation-500)' }}>Save the event to start receiving registrations.</p>;
  }
  return (
    <section aria-label="Registrations" style={{ marginTop: 24 }}>
      <Link className="cs-btn cs-btn--subtle" href={`/admin/event-registrations?event=${id}`}>
        Open registrations
      </Link>
    </section>
  );
};

export default EventRegistrationsPanel;
