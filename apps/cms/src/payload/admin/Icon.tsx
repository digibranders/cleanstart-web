import type { ReactElement } from 'react';

/**
 * Admin top-left "icon" slot. Payload renders this in the breadcrumb
 * area before the step-nav crumbs. We render the wordmark as text rather
 * than an SVG glyph — the editor sees the brand name directly in the
 * breadcrumb (`CleanStart / Blogs / …`) without competing for attention
 * against the icon mark already shown in the sidebar header.
 */
export const Icon = (): ReactElement => (
  <span
    className="cs-admin-icon"
    aria-label="CleanStart"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontFamily:
        "'Sora', 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
      fontWeight: 700,
      fontSize: '14px',
      letterSpacing: '-0.01em',
      color: 'var(--theme-text)',
      lineHeight: 1,
      whiteSpace: 'nowrap',
    }}
  >
    CleanStart
  </span>
);

export default Icon;
