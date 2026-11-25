import { EventCard } from "@/components/event/EventCard";
import { getEvents } from "@/lib/cms";

// Rendered per request so a deploy never needs the CMS; the CMS fetch itself is cached for a minute.
export const dynamic = "force-dynamic";

export default async function EventsIndexPage(): Promise<React.ReactElement> {
  const events = await getEvents();
  return (
    <main className="min-h-[100dvh]">
      <header className="ev-band px-6 pb-56 pt-8 sm:pt-10">
        <div className="ev-stars" aria-hidden />
        <div className="ev-rings ev-rings--right" aria-hidden />
        <div className="ev-horizon" aria-hidden />

        <div className="mx-auto w-full max-w-[1200px]">
          <a
            href="https://www.cleanstart.com"
            aria-label="CleanStart"
            className="inline-flex rounded-sm outline-offset-4 focus-visible:outline-2 focus-visible:outline-cs-cyan"
          >
            <img src="/logos/cleanstart.png" alt="CleanStart" width={153} height={32} className="h-7 w-auto sm:h-8" />
          </a>

          <div className="mt-20 sm:mt-28">
            <h1 className="text-[clamp(3rem,2rem+5vw,5.5rem)] font-semibold leading-[1] tracking-tight text-white">
              Events
            </h1>
            <p className="mt-6 max-w-[40ch] text-[length:var(--fs-lead)] leading-snug text-white/75">
              Join CleanStart and our partners in person. Pick an event and register.
            </p>
          </div>
        </div>
      </header>

      <section className="relative -mt-36 px-6 pb-24" aria-labelledby="upcoming-events">
        <div className="mx-auto w-full max-w-[1200px]">
          <h2 id="upcoming-events" className="sr-only">
            Upcoming events
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event, index) => (
              <li key={event.slug} className="ev-pop" style={{ animationDelay: `${0.1 + index * 0.08}s` }}>
                <EventCard event={event} />
              </li>
            ))}
            <li className="ev-pop" style={{ animationDelay: `${0.1 + events.length * 0.08}s` }}>
              <div className="flex h-full min-h-[360px] items-center justify-center rounded-2xl border-2 border-dashed border-[#D9D4EC] px-8 text-center">
                <p className="max-w-[24ch] text-[length:var(--fs-body)] text-[#555555]">
                  More events will appear here.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <footer className="px-6 pb-10 text-[length:var(--fs-caption)] text-[#555555]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap gap-x-6 gap-y-2">
          <a href="https://www.cleanstart.com" className="underline">
            cleanstart.com
          </a>
          <a href="https://www.cleanstart.com/privacy-policy" className="underline">
            Privacy Policy
          </a>
        </div>
      </footer>
    </main>
  );
}
