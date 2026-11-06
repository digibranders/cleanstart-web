import type React from 'react';

/* Section heading and lead styles shared by the telecom sections. Colour is set per band. */
export const H2_STYLE: React.CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--fs-h2)',
  fontWeight: 'var(--fs-h2-weight)',
  letterSpacing: 'var(--fs-h2-ls)',
  lineHeight: 'var(--fs-h2-lh)',
};

export const LEAD_STYLE: React.CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--fs-lead-sm)',
  fontWeight: 400,
  letterSpacing: '-0.02em',
  lineHeight: 1.5,
};
