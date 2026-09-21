/**
 * Line glyphs for the build-flow stages, drawn in one stroke weight so the two
 * lanes read as one system. Keyed by the source documents' stage labels; a
 * label with no glyph falls back to a plain dot, so the diagram never invents a
 * stage.
 *
 * The drawing language is the one the Clean Images hero render uses for its
 * floating tiles: a thin violet or white line glyph on a dark rounded tile.
 *
 * Each comparison names its stages differently ("Cryptographic Signing" on one
 * page, "Sigstore / Cosign Signing" on another) while meaning the same step, so
 * the glyphs are defined once and the map below points several labels at the
 * same drawing. That keeps a stage looking the same across pages.
 */

const SOURCE = <path d="M9 7 4 12l5 5M15 7l5 5-5 5" />;

const SHIELD_CHECK = (
  <>
    <path d="M12 3l7 3v5c0 4.6-3 8.1-7 10-4-1.9-7-5.4-7-10V6l7-3z" />
    <path d="M9 12l2 2 4-4" />
  </>
);

const PIPELINE = (
  <>
    <path d="M6 4.5v11" />
    <circle cx="6" cy="18" r="2.6" />
    <circle cx="18" cy="6" r="2.6" />
    <path d="M18 8.6a8.4 8.4 0 0 1-8.4 8.4" />
  </>
);

/** A sealed build environment: a closed box under a lock. */
const HERMETIC = (
  <>
    <rect x="3.5" y="10.5" width="17" height="9.5" rx="2" />
    <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
    <path d="M12 14v2.8" />
  </>
);

const DOCUMENT = (
  <>
    <path d="M7 3h7l5 5v13H7z" />
    <path d="M14 3v5h5M10 13h6M10 17h6" />
  </>
);

const SIGNING_KEY = (
  <>
    <circle cx="8.2" cy="15.8" r="4.4" />
    <path d="M11.4 12.6L20 4M17.2 6.8l2.4 2.4M14.6 9.4l2.4 2.4" />
  </>
);

const VERIFIED_IMAGE = (
  <>
    <path d="M9.5 2l7 4v8l-7 4-7-4V6l7-4z" />
    <path d="M2.5 6l7 4 7-4M9.5 10v8" />
    <circle cx="18" cy="18" r="4.6" />
    <path d="M15.9 18.1l1.5 1.5 2.7-3" />
  </>
);

const SIGNED_IMAGE = (
  <>
    <path d="M9.5 2l7 4v8l-7 4-7-4V6l7-4z" />
    <path d="M2.5 6l7 4 7-4M9.5 10v8" />
    <path d="M21.4 13.4a1.7 1.7 0 0 0-2.4 0l-5.2 5.2-.9 3.3 3.3-.9 5.2-5.2a1.7 1.7 0 0 0 0-2.4z" />
  </>
);

const CONTAINER_BASE = (
  <>
    <rect x="3" y="6.5" width="18" height="11.5" rx="2" />
    <path d="M8 6.5v11.5M12 6.5v11.5M16 6.5v11.5" />
  </>
);

const SHIELD_LOCK = (
  <>
    <path d="M12 3l7 3v5c0 4.6-3 8.1-7 10-4-1.9-7-5.4-7-10V6l7-3z" />
    <rect x="9" y="10.8" width="6" height="5" rx="1.2" />
    <path d="M10.2 10.8V9.4a1.8 1.8 0 0 1 3.6 0v1.4" />
  </>
);

const CHECKLIST = (
  <path d="M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17M11 6h9M11 12h9M11 18h9" />
);

const DEPLOY = (
  <>
    <path d="M7.5 18.5A4.5 4.5 0 0 1 7 9.53 6 6 0 0 1 18.6 8.6 4 4 0 0 1 17.5 16.5" />
    <path d="M12 21v-8m-3.5 3.5L12 13l3.5 3.5" />
  </>
);

const DISTRO_STACK = (
  <>
    <path d="M12 3l9 5-9 5-9-5 9-5z" />
    <path d="M3 13l9 5 9-5" />
  </>
);

/** Packages coming out of a build: an open carton. */
const PACKAGES = (
  <>
    <path d="M3 8.5h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-10z" />
    <path d="M2.5 4.5h19v4h-19z" />
    <path d="M10 12.5h4" />
  </>
);

/** Packages composed into an image: three stacked layers. */
const LAYERS = (
  <>
    <path d="M12 2.5l9.5 4.75L12 12 2.5 7.25 12 2.5z" />
    <path d="M2.5 12L12 16.75 21.5 12" />
    <path d="M2.5 16.75L12 21.5l9.5-4.75" />
  </>
);

/** The same output on every run: a loop closing on an equals sign. */
const REPRODUCIBLE = (
  <>
    <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" />
    <path d="M20.5 3.2v4.3h-4.3" />
    <path d="M8.8 10.6h6.4M8.8 13.8h6.4" />
  </>
);

const PATHS: Record<string, React.ReactNode> = {
  /* Docker Hardened Images vs CleanStart */
  "Source Code": SOURCE,
  "Source Verification": SHIELD_CHECK,
  "Controlled Build Pipeline": PIPELINE,
  "SBOM + Provenance Generation": DOCUMENT,
  "Cryptographic Signing": SIGNING_KEY,
  "Verified Container Image": VERIFIED_IMAGE,
  "Base Container Foundation": CONTAINER_BASE,
  "Security Hardening": SHIELD_LOCK,
  "Testing & Validation": CHECKLIST,
  "Signed Container Image": SIGNED_IMAGE,
  "Production Deployment": DEPLOY,
  "Debian and Alpine-based images": DISTRO_STACK,

  /* Red Hat Hardened Images vs CleanStart */
  "Source / Software Inputs": SOURCE,
  "Source + Verified Dependencies": SHIELD_CHECK,
  "Hermetic Build Environment": HERMETIC,
  "Controlled / Hermetic Build": PIPELINE,
  "Hardening + Security Validation": SHIELD_LOCK,
  "Reproducibility + Security Analysis": CHECKLIST,
  "SBOM + SLSA Provenance": DOCUMENT,
  "SBOM + Provenance": DOCUMENT,
  "Sigstore / Cosign Signing": SIGNING_KEY,
  "Sigstore Signing": SIGNING_KEY,
  "Verified Hardened Image": SIGNED_IMAGE,
  "Verified CleanStart Image": VERIFIED_IMAGE,
  Production: DEPLOY,

  /* Chainguard vs CleanStart */
  Source: SOURCE,
  "melange: Build Packages": PACKAGES,
  "apko: Compose Image": LAYERS,
  "Reproducible Build": REPRODUCIBLE,
  "Hermetic Build": HERMETIC,
  "Verified Chainguard Image": SIGNED_IMAGE,
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
