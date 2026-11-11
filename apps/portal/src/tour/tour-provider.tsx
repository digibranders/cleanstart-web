"use client";

import "driver.js/dist/driver.css";
import { type Driver, driver } from "driver.js";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { ROUTES } from "@/lib/routes";
import { resetAllSlices } from "@/lib/slice";
import { TOUR_STEPS, type TourGroup, type TourStep } from "./steps";

const GROUPS: TourGroup[] = ["Getting in", "Partner", "CleanStart staff"];
const ANCHOR_WAIT_MS = 3000;

function waitForAnchor(anchor: string | undefined): Promise<Element | null> {
  if (!anchor) return Promise.resolve(null);
  return new Promise((resolve) => {
    const started = Date.now();
    const poll = (): void => {
      const el = document.querySelector(`[data-tour="${anchor}"]`);
      if (el || Date.now() - started > ANCHOR_WAIT_MS) resolve(el);
      else setTimeout(poll, 60);
    };
    poll();
  });
}

export function TourProvider(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const [panelOpen, setPanelOpen] = useState(false);
  const [current, setCurrent] = useState<number | null>(null);
  const driverRef = useRef<Driver | null>(null);
  const navigatingForTour = useRef(false);

  const stop = useCallback((): void => {
    driverRef.current?.destroy();
    driverRef.current = null;
    setCurrent(null);
  }, []);

  const show = useCallback(
    async (index: number): Promise<void> => {
      const step: TourStep | undefined = TOUR_STEPS[index];
      if (!step) {
        stop();
        return;
      }
      driverRef.current?.destroy();
      driverRef.current = null;
      setCurrent(index);
      setPanelOpen(false);

      const here = (): string => window.location.pathname + window.location.search;
      if (here() !== step.path) {
        navigatingForTour.current = true;
        router.push(step.path);
        // wait until the new route has rendered before looking for the anchor
        await new Promise<void>((resolve) => {
          const started = Date.now();
          const poll = (): void => {
            if (here() === step.path || Date.now() - started > ANCHOR_WAIT_MS) resolve();
            else setTimeout(poll, 60);
          };
          poll();
        });
        navigatingForTour.current = false;
      }

      const element = await waitForAnchor(step.anchor);
      element?.scrollIntoView({ block: "center", behavior: "instant" });
      const last = index === TOUR_STEPS.length - 1;
      const instance = driver({
        showButtons: index === 0 ? ["next", "close"] : ["previous", "next", "close"],
        nextBtnText: last ? "Finish" : "Next",
        prevBtnText: "Back",
        allowClose: true,
        overlayOpacity: 0.45,
        stagePadding: 6,
        stageRadius: 8,
        onNextClick: () => {
          if (last) stop();
          else void show(index + 1);
        },
        onPrevClick: () => void show(index - 1),
        onCloseClick: () => stop(),
        onDestroyed: () => {
          if (driverRef.current === instance) {
            driverRef.current = null;
            setCurrent(null);
          }
        },
      });
      driverRef.current = instance;
      const popover = {
        title: `${index + 1} of ${TOUR_STEPS.length}. ${step.title}`,
        description: `${step.description}<br><br><span style="color:#6B687D;font-size:12px">Viewing as: ${step.role}</span>`,
        side: "bottom" as const,
        align: "start" as const,
      };
      instance.highlight(element ? { element, popover } : { popover });
    },
    [router, stop],
  );

  // leaving the page by hand ends the spotlight
  // biome-ignore lint/correctness/useExhaustiveDependencies: only react to the path changing
  useEffect(() => {
    if (!navigatingForTour.current && driverRef.current) stop();
  }, [pathname]);

  useEffect(() => () => driverRef.current?.destroy(), []);

  return (
    <>
      <button
        type="button"
        className="tour-fab"
        aria-expanded={panelOpen}
        onClick={() => setPanelOpen((o) => !o)}
      >
        <Icon name="play" />
        Walkthrough
      </button>
      {panelOpen ? (
        <div className="tour-panel" role="dialog" aria-label="Walkthrough">
          <div className="tour-h">
            <h2 className="tour-t">Walkthrough of the whole portal</h2>
            <button type="button" className="ibtn" aria-label="Close walkthrough" onClick={() => setPanelOpen(false)} style={{ width: 26, height: 26 }}>
              <Icon name="x" />
            </button>
          </div>
          <div className="tour-body">
            <button type="button" className="btn btn-p" style={{ margin: "4px 8px 6px", width: "calc(100% - 16px)" }} onClick={() => void show(current ?? 0)}>
              {current === null ? "Start from the beginning" : "Resume"}
            </button>
            {GROUPS.map((group) => (
              <div key={group}>
                <div className="tour-g">{group}</div>
                {TOUR_STEPS.map((step, i) =>
                  step.group === group ? (
                    <button
                      key={step.id}
                      type="button"
                      className={`tour-step${current === i ? " tour-step-on" : ""}`}
                      onClick={() => void show(i)}
                    >
                      <span className="tour-n">{i + 1}</span>
                      <span className="tour-s">
                        <span className="tour-sn">{step.label}</span>
                        <span className="tour-ss">{step.role}</span>
                      </span>
                    </button>
                  ) : null,
                )}
              </div>
            ))}
          </div>
          <div className="tour-f">
            <span style={{ display: "flex", gap: 4 }}>
              <Link href={ROUTES.partner.overview} className="btn btn-s" onClick={() => setPanelOpen(false)}>
                Open as partner
              </Link>
              <Link href={ROUTES.admin.approvals} className="btn btn-s" onClick={() => setPanelOpen(false)}>
                As staff
              </Link>
            </span>
            <button
              type="button"
              className="btn btn-g"
              onClick={() => {
                stop();
                resetAllSlices();
                window.location.assign(ROUTES.signIn);
              }}
            >
              Reset demo data
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
