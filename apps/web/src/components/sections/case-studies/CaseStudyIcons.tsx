import type React from "react";

/** Shared glyphs for the case-studies surfaces. Decorative: labels live on the control. */

export function DownloadIcon({ size = 18 }: { size?: number } = {}): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4v10m0 0l-4-4m4 4l4-4M5 18h14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowRightIcon({ size = 16 }: { size?: number } = {}): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3.5 8h9M8.5 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Neutral fallback when a case study has no companyLogo upload. */
export function CompanyIcon(): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="2.5" y="3.5" width="13" height="11" rx="2" stroke="#4a3bf1" strokeWidth="1.4" />
      <path d="M6.5 7h5M6.5 10h3" stroke="#4a3bf1" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
