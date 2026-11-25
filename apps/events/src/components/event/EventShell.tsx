import type { ReactNode } from "react";

interface EventShellProps {
  logos: ReactNode;
  title: string;
  /** Shown under the title; each is left out when empty. */
  dateLabel?: string | null;
  venue?: string | null;
  children: ReactNode;
}

/**
 * Page frame: a dark brand band holding the logo bar and title, with the
 * ticket-shaped form card overlapping its lower edge.
 */
export function EventShell({ logos, title, dateLabel, venue, children }: EventShellProps): React.ReactElement {
  return (
    <main>
      <header className="ev-band px-6 pb-44 pt-12 sm:pt-16">
        <div className="ev-stars" aria-hidden />
        <div className="ev-rings" aria-hidden />
        <div className="ev-horizon" aria-hidden />
        <div className="mx-auto w-full max-w-[860px]">
          {logos}
          <h1 className="mt-12 text-center text-[length:var(--fs-h1)] font-semibold leading-[1.1] tracking-tight text-white sm:mt-16">
            {title}
          </h1>
          {dateLabel || venue ? (
            <p className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-center text-[length:var(--fs-lead)] leading-snug text-white/80">
              {dateLabel ? <span>{dateLabel}</span> : null}
              {dateLabel && venue ? <span aria-hidden className="h-5 w-px bg-white/25" /> : null}
              {venue ? <span>{venue}</span> : null}
            </p>
          ) : null}
        </div>
      </header>

      <section className="relative -mt-32 px-4 pb-20 sm:px-6">
        <div className="mx-auto w-full max-w-[640px]">{children}</div>
      </section>
    </main>
  );
}
