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
      <circle cx="6" cy="6" r="2" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="12" r="2" />
      <path d="M8 6h4a4 4 0 0 1 4 4v0M8 18h4a4 4 0 0 0 4-4v0" />
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
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l9-9M17 6l3 3M14.5 8.5l2 2" />
    </>
  ),
  "Verified Container Image": (
    <>
      <path d="M12 2.5l8 4.5v9l-8 4.5-8-4.5V7l8-4.5z" />
      <path d="M4 7l8 4.5L20 7M12 11.5v9" />
      <path d="M13.5 15.5l1.5 1.5 3-3" />
    </>
  ),
  "Base Container Foundation": (
    <>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5M3 17l9 5 9-5" />
    </>
  ),
  "Security Hardening": (
    <>
      <path d="M12 3l7 3v5c0 4.6-3 8.1-7 10-4-1.9-7-5.4-7-10V6l7-3z" />
      <rect x="9.5" y="11" width="5" height="4" rx="1" />
      <path d="M10.5 11V9.5a1.5 1.5 0 0 1 3 0V11" />
    </>
  ),
  "Testing & Validation": (
    <path d="M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17M11 6h9M11 12h9M11 18h9" />
  ),
  "Signed Container Image": (
    <>
      <path d="M12 2.5l8 4.5v9l-8 4.5-8-4.5V7l8-4.5z" />
      <path d="M4 7l8 4.5L20 7M12 11.5v9" />
      <circle cx="17" cy="16" r="2.2" />
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
