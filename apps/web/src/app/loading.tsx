export default function Loading() {
  return (
    <output
      aria-live="polite"
      aria-label="Loading"
      className="flex min-h-[60vh] items-center justify-center"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
      <span className="sr-only">Loading…</span>
    </output>
  );
}
