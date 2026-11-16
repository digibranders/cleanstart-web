import type React from 'react';

/* Section heading and lead styles shared by the post-quantum sections. Colour is set per band. */
export const H2_STYLE: React.CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--fs-h2)',
  fontWeight: 'var(--fs-h2-weight)',
  letterSpacing: 'var(--fs-h2-ls)',
  lineHeight: 'var(--fs-h2-lh)',
};

export const H3_STYLE: React.CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--fs-h4)',
  fontWeight: 600,
  letterSpacing: '-0.03em',
  lineHeight: 1.25,
};

export const BODY_STYLE: React.CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--fs-body)',
  fontWeight: 400,
  letterSpacing: '-0.01em',
  lineHeight: 1.55,
};
