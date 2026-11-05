import { CalendarCheckIcon, ClipboardCheckIcon, FileSearchIcon } from "lucide-react";
import { Fragment, type ComponentType } from "react";

import { FlowArrow } from "@/components/ui/FlowArrow";
import { Reveal } from "@/components/ui/Reveal";

import { CONTAINER_STYLE } from "./scan-ui";

type Step = {
  title: string;
  detail: string;
  Icon: ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
};

const STEPS: readonly Step[] = [
  { title: "Request your scan", detail: "Fill in the short form.", Icon: ClipboardCheckIcon },
  {
    title: "We set it up with you",
    detail: "Our security experts contact you to arrange the scan.",
    Icon: CalendarCheckIcon,
  },
  {
    title: "Review your results together",
    detail: "We walk you through where you’re exposed and how to fix it.",
    Icon: FileSearchIcon,
  },
];

/*
 * Dark purple band in the style of the home page's ProcessBand, without the
 * photo: white line icons, white titles, dotted FlowArrow between steps.
 */
export function ScanHowItWorks(): React.ReactElement {
  return (
    <section
      aria-labelledby="scan-how-heading"
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(120deg, #1a0f45 0%, #2d1770 55%, #3c1e96 100%)" }}
    >
      <div className="relative mx-auto py-14 lg:py-20" style={CONTAINER_STYLE}>
        <Reveal header>
          <h2
            id="scan-how-heading"
            className="font-display text-white"
            style={{
              fontSize: "var(--fs-h2)",
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
            }}
          >
            How it works
          </h2>
        </Reveal>

        <Reveal>
          <ol className="mt-10 flex flex-col items-start gap-10 sm:gap-12 lg:mt-12 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
            {STEPS.map(({ title, detail, Icon }, index) => (
              <Fragment key={title}>
                <li className="flex w-full max-w-[300px] flex-col items-start gap-4 text-left">
                  <Icon aria-hidden strokeWidth={1.25} className="size-[52px] text-white" />
                  <div className="flex flex-col gap-2.5">
                    <h3
                      className="font-display font-semibold text-white"
                      style={{ fontSize: "var(--fs-h3)", lineHeight: 1.1, letterSpacing: "-0.03em" }}
                    >
                      {title}
                    </h3>
                    <p
                      className="text-white/85"
                      style={{
                        fontFamily: "var(--font-sora), Sora, sans-serif",
                        fontSize: "var(--fs-body)",
                        lineHeight: 1.35,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {detail}
                    </p>
                  </div>
                </li>
                {index < STEPS.length - 1 ? (
                  <FlowArrow
                    scale={1.4}
                    className="hidden shrink-0 self-center lg:flex"
                    style={{ ["--arrow-delay" as string]: `${index * 0.12}s` }}
                  />
                ) : null}
              </Fragment>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
