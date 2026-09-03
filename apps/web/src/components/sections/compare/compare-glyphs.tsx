/**
 * Line glyphs for the build-flow stages, drawn in one stroke weight so the two
 * lanes read as one system. Keyed by the document's stage labels; a label with
 * no glyph falls back to a plain dot, so the diagram never invents a stage.
 *
 * The drawing language is the one the Clean Images hero render uses for its
 * floating tiles: a thin violet or white line glyph on a dark rounded tile.
 */

const PATHS: Record<string, React.ReactNode> = {
  "Source Code": <path d="M9 7 4 12l5 5M15 7l5 5-5 5" />,
  "Source Verification": (
    <>
      <path d="M12 3l7 3v5c0 4.6-3 8.1-7 10-4-1.9-7-5.4-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  "Controlled Build Pipeline": (
    <>
      <path d="M6 4.5v11" />
      <circle cx="6" cy="18" r="2.6" />
      <circle cx="18" cy="6" r="2.6" />
      <path d="M18 8.6a8.4 8.4 0 0 1-8.4 8.4" />
    </>
  ),
  "SBOM + Provenance Generation": (
    <>
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5M10 13h6M10 17h6" />
    </>
  ),
  "Cryptographic Signing": (
    <>
      <circle cx="8.2" cy="15.8" r="4.4" />
      <path d="M11.4 12.6L20 4M17.2 6.8l2.4 2.4M14.6 9.4l2.4 2.4" />
    </>
  ),
  "Verified Container Image": (
    <>
      <path d="M9.5 2l7 4v8l-7 4-7-4V6l7-4z" />
      <path d="M2.5 6l7 4 7-4M9.5 10v8" />
      <circle cx="18" cy="18" r="4.6" />
      <path d="M15.9 18.1l1.5 1.5 2.7-3" />
    </>
  ),
  "Base Container Foundation": (
    <>
      <rect x="3" y="6.5" width="18" height="11.5" rx="2" />
      <path d="M8 6.5v11.5M12 6.5v11.5M16 6.5v11.5" />
    </>
  ),
  "Security Hardening": (
    <>
      <path d="M12 3l7 3v5c0 4.6-3 8.1-7 10-4-1.9-7-5.4-7-10V6l7-3z" />
      <rect x="9" y="10.8" width="6" height="5" rx="1.2" />
      <path d="M10.2 10.8V9.4a1.8 1.8 0 0 1 3.6 0v1.4" />
    </>
  ),
  "Testing & Validation": (
    <path d="M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17M11 6h9M11 12h9M11 18h9" />
  ),
  "Signed Container Image": (
    <>
      <path d="M9.5 2l7 4v8l-7 4-7-4V6l7-4z" />
      <path d="M2.5 6l7 4 7-4M9.5 10v8" />
      <path d="M21.4 13.4a1.7 1.7 0 0 0-2.4 0l-5.2 5.2-.9 3.3 3.3-.9 5.2-5.2a1.7 1.7 0 0 0 0-2.4z" />
    </>
  ),
  "Production Deployment": (
    <>
      <path d="M7.5 18.5A4.5 4.5 0 0 1 7 9.53 6 6 0 0 1 18.6 8.6 4 4 0 0 1 17.5 16.5" />
      <path d="M12 21v-8m-3.5 3.5L12 13l3.5 3.5" />
    </>
  ),
  "Debian and Alpine-based images": (
    <>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5" />
    </>
  ),
};

export function StageGlyph({
  name,
  size = 20,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}): React.ReactElement {
  const glyph = PATHS[name];
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {glyph ?? <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />}
    </svg>
  );
}
