import type { ReactElement } from 'react';

/**
 * Sidebar entry point for the Schema Manager view (/admin/schema-manager).
 * Mounted via admin.components.beforeNavLinks so it sits at the top of the
 * nav. Plain anchor — no @payloadcms/ui render imports (data-layer rule).
 */
export const SchemaManagerNavLink = (): ReactElement => (
  <a
    href="/admin/schema-manager"
    className="nav__link"
    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
  >
    <span aria-hidden="true">◆</span>
    Schema Manager
  </a>
);
