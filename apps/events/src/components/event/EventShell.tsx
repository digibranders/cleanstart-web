import type { ReactNode } from "react";

interface EventShellProps {
  logos: ReactNode;
  title: string;
  children: ReactNode;
}

/**
 * Page frame: a dark brand band holding the logo bar and title, with the
 * ticket-shaped form card overlapping its lower edge.
 */
export function EventShell({ logos, title, children }: EventShellProps): React.ReactElement {
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
        </div>
      </header>

      <section className="relative -mt-32 px-4 pb-20 sm:px-6">
        <div className="mx-auto w-full max-w-[640px]">{children}</div>
      </section>
    </main>
  );
}
