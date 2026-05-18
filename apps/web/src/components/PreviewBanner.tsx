import { draftMode } from "next/headers";

/**
 * Sticky top banner shown when Next.js draft mode is active.
 * Renders to nothing (zero JS, zero markup) on published pages.
 *
 * Mounted in the root layout so it appears on every preview-mode
 * request, regardless of which route the editor opens.
 */
export async function PreviewBanner(): Promise<React.ReactElement | null> {
  let isDraft = false;
  try {
    const dm = await draftMode();
    isDraft = dm.isEnabled;
  } catch {
    isDraft = false;
  }
  if (!isDraft) return null;

  return (
    <output
      aria-live="polite"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 9999,
        width: "100%",
        background: "#facc15",
        color: "#111",
        padding: "0.5rem 1rem",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "0.875rem",
        fontWeight: 500,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
      }}
    >
      <span>
        Preview mode — you are viewing draft content. This page is not indexed by search engines.
      </span>
      <a
        href="/api/preview/disable"
        style={{
          color: "#111",
          textDecoration: "underline",
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        Exit preview
      </a>
    </output>
  );
}
