import { Header } from "@/components/nav/Header";

/**
 * Podcast is already static/ISR (no searchParams, small fetch), so this rarely
 * shows — but a content-shaped skeleton still beats the generic root spinner on
 * a cold navigation. Approximates the hero video + the Latest Episodes grid.
 */
const EPISODES = ["e1", "e2", "e3", "e4", "e5", "e6"];

export default function Loading(): React.ReactElement {
  return (
    <>
      <Header />
      <main id="main-content">
        <output aria-live="polite" aria-label="Loading" className="block w-full animate-pulse">
          <span className="sr-only">Loading…</span>
          <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
            {/* Hero: eyebrow + title + big video plate */}
            <div className="flex flex-col items-center gap-5" style={{ paddingTop: "clamp(64px, 9vw, 132px)" }}>
              <div className="h-6 w-28 rounded-full bg-black/[0.06]" />
              <div className="h-10 w-3/4 max-w-[640px] rounded bg-black/[0.06]" />
              <div
                className="mt-6 w-full max-w-[900px] rounded-2xl bg-[#e8e8f0]"
                style={{ aspectRatio: "16 / 9" }}
              />
            </div>
            {/* Latest Episodes grid */}
            <div style={{ paddingTop: "var(--spacing-section-md)", paddingBottom: "var(--spacing-section-lg)" }}>
              <div className="mb-8 h-7 w-48 rounded bg-black/[0.06]" />
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {EPISODES.map((k) => (
                  <div key={k} className="flex w-full flex-col gap-3">
                    <div className="w-full rounded-2xl bg-[#e8e8f0]" style={{ aspectRatio: "16 / 9" }} />
                    <div className="h-4 w-10/12 rounded bg-black/[0.06]" />
                    <div className="h-4 w-1/2 rounded bg-black/[0.06]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </output>
      </main>
    </>
  );
}
