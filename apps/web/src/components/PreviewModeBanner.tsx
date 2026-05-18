/**
 * Always-on banner for `/preview/*` routes. Distinct from `PreviewBanner`,
 * which is conditional on the `draftMode()` cookie (used by the in-admin
 * Live Preview iframe). Token-gated shareable links never set that cookie,
 * so they rely on this banner instead.
 */
export function PreviewModeBanner(): React.ReactElement {
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
        Preview link — you are viewing draft content. This URL expires and is not indexed by search engines.
      </span>
      <span style={{ opacity: 0.7, fontSize: "0.75rem", whiteSpace: "nowrap" }}>
        Not the live page
      </span>
    </output>
  );
}
